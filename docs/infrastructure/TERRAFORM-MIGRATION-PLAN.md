# Terraform Infrastructure as Code Migration Plan

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Planning |
| Owner | CTO / DevOps Lead |
| Created | December 2024 |
| Target Completion | Q2 2025 |

---

## 1. Executive Summary

This document outlines the migration of AI Perception's infrastructure from manual/click-ops provisioning to Infrastructure as Code (IaC) using Terraform. This migration will improve reproducibility, auditability, disaster recovery, and enable multi-environment consistency.

### Current State

| Aspect | Status |
|--------|--------|
| Infrastructure definition | Manual / Console |
| Environment parity | Low |
| Disaster recovery | 2-4 hours (manual) |
| Audit trail | Limited |
| IaC coverage | 0% |

### Target State

| Aspect | Target |
|--------|--------|
| Infrastructure definition | 100% Terraform |
| Environment parity | High (identical) |
| Disaster recovery | <30 minutes (automated) |
| Audit trail | Complete (git history) |
| IaC coverage | 100% |

---

## 2. Current Infrastructure Inventory

### 2.1 Vercel (Frontend & API)

| Resource | Type | Count | Priority |
|----------|------|-------|----------|
| Projects | Deployment | 2 | HIGH |
| Domains | Custom domain | 3 | HIGH |
| Environment variables | Config | 25+ | HIGH |
| Edge functions | Serverless | 5 | MEDIUM |
| Redirects | Routing | 10 | LOW |

### 2.2 Supabase (Database & Auth)

| Resource | Type | Count | Priority |
|----------|------|-------|----------|
| Database | PostgreSQL | 1 | CRITICAL |
| Tables | Schema | 30+ | CRITICAL |
| Functions | PL/pgSQL | 15 | HIGH |
| RLS Policies | Security | 50+ | CRITICAL |
| Auth config | Identity | 1 | HIGH |
| Storage buckets | Files | 3 | MEDIUM |

### 2.3 External Services

| Service | Resources | Priority |
|---------|-----------|----------|
| GitHub | Repos, Actions, Secrets | HIGH |
| OpenAI | API keys, usage limits | MEDIUM |
| Anthropic | API keys | MEDIUM |
| Stripe | Products, prices, webhooks | HIGH |
| Sentry | Projects, alerts | MEDIUM |
| Analytics | Property config | LOW |

### 2.4 DNS & CDN

| Resource | Provider | Priority |
|----------|----------|----------|
| DNS records | Namecheap/Cloudflare | HIGH |
| SSL certificates | Vercel (auto) | LOW |
| CDN config | Vercel (auto) | LOW |

---

## 3. Terraform Architecture

### 3.1 Repository Structure

```
infrastructure/
├── README.md
├── .gitignore
├── .terraform-version
│
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars
│
├── modules/
│   ├── vercel/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── supabase/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── github/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── stripe/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── monitoring/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
├── scripts/
│   ├── init.sh
│   ├── plan.sh
│   ├── apply.sh
│   └── import.sh
│
└── docs/
    ├── GETTING-STARTED.md
    ├── MODULES.md
    └── RUNBOOK.md
```

### 3.2 State Management

| Environment | State Backend | Lock Mechanism |
|-------------|---------------|----------------|
| Development | Terraform Cloud / S3 | DynamoDB |
| Staging | Terraform Cloud / S3 | DynamoDB |
| Production | Terraform Cloud / S3 | DynamoDB |

**Backend Configuration:**

```hcl
terraform {
  backend "s3" {
    bucket         = "aiperception-terraform-state"
    key            = "env/${var.environment}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

### 3.3 Provider Configuration

```hcl
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
    stripe = {
      source  = "lukasaron/stripe"
      version = "~> 1.0"
    }
  }
}
```

---

## 4. Module Specifications

### 4.1 Vercel Module

```hcl
# modules/vercel/main.tf

resource "vercel_project" "main" {
  name      = var.project_name
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  environment = [
    for env_var in var.environment_variables : {
      key    = env_var.key
      value  = env_var.value
      target = env_var.target
    }
  ]
}

resource "vercel_project_domain" "domains" {
  for_each = toset(var.domains)

  project_id = vercel_project.main.id
  domain     = each.value
}

resource "vercel_deployment" "production" {
  project_id = vercel_project.main.id
  ref        = var.git_ref
  production = true
}
```

**Variables:**

```hcl
# modules/vercel/variables.tf

variable "project_name" {
  type        = string
  description = "Vercel project name"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository (org/repo)"
}

variable "domains" {
  type        = list(string)
  description = "Custom domains"
  default     = []
}

variable "environment_variables" {
  type = list(object({
    key    = string
    value  = string
    target = list(string)
  }))
  description = "Environment variables"
  sensitive   = true
}

variable "git_ref" {
  type        = string
  description = "Git ref to deploy"
  default     = "main"
}
```

### 4.2 Supabase Module

```hcl
# modules/supabase/main.tf

resource "supabase_project" "main" {
  organization_id   = var.organization_id
  name              = var.project_name
  database_password = var.database_password
  region            = var.region

  lifecycle {
    prevent_destroy = true
  }
}

resource "supabase_settings" "api" {
  project_ref = supabase_project.main.id

  api = {
    db_schema            = "public,storage,graphql_public"
    db_extra_search_path = "public,extensions"
    max_rows             = 1000
  }
}

resource "supabase_settings" "auth" {
  project_ref = supabase_project.main.id

  auth = {
    site_url                 = var.site_url
    additional_redirect_urls = var.redirect_urls
    jwt_expiry              = 3600
    enable_signup           = true

    external = {
      google = {
        enabled   = true
        client_id = var.google_client_id
        secret    = var.google_client_secret
      }
    }
  }
}
```

### 4.3 GitHub Module

```hcl
# modules/github/main.tf

resource "github_repository" "main" {
  name        = var.repo_name
  description = var.description
  visibility  = var.visibility

  has_issues      = true
  has_discussions = false
  has_projects    = true
  has_wiki        = false

  delete_branch_on_merge = true
  allow_squash_merge     = true
  allow_merge_commit     = false
  allow_rebase_merge     = true

  vulnerability_alerts = true
}

resource "github_branch_protection" "main" {
  repository_id = github_repository.main.node_id
  pattern       = "main"

  required_status_checks {
    strict   = true
    contexts = var.required_status_checks
  }

  required_pull_request_reviews {
    required_approving_review_count = 1
    dismiss_stale_reviews           = true
  }

  enforce_admins = false
}

resource "github_actions_secret" "secrets" {
  for_each = var.secrets

  repository      = github_repository.main.name
  secret_name     = each.key
  plaintext_value = each.value
}
```

### 4.4 Stripe Module

```hcl
# modules/stripe/main.tf

resource "stripe_product" "products" {
  for_each = var.products

  name        = each.value.name
  description = each.value.description
  active      = true
}

resource "stripe_price" "prices" {
  for_each = var.prices

  product     = stripe_product.products[each.value.product_key].id
  currency    = each.value.currency
  unit_amount = each.value.unit_amount

  recurring = {
    interval       = each.value.interval
    interval_count = each.value.interval_count
  }
}

resource "stripe_webhook_endpoint" "webhook" {
  url = var.webhook_url

  enabled_events = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed",
  ]
}
```

---

## 5. Migration Phases

### Phase 1: Foundation (Week 1-2)

| Task | Owner | Status |
|------|-------|--------|
| Create infrastructure repository | DevOps | Pending |
| Set up Terraform Cloud workspace | DevOps | Pending |
| Configure state backend (S3 + DynamoDB) | DevOps | Pending |
| Create base module structure | DevOps | Pending |
| Document secrets management | DevOps | Pending |

**Deliverables:**
- [ ] Repository with structure
- [ ] State backend configured
- [ ] CI/CD for Terraform
- [ ] Secrets in Vault/AWS Secrets Manager

### Phase 2: Non-Critical Resources (Week 3-4)

| Resource | Module | Import/Create |
|----------|--------|---------------|
| GitHub repos | github | Import |
| GitHub Actions secrets | github | Import |
| Sentry projects | monitoring | Create new |
| Analytics config | monitoring | Create new |

**Import Commands:**
```bash
# Import existing GitHub repo
terraform import module.github.github_repository.main arcanequants/onchain-analytics

# Import GitHub branch protection
terraform import module.github.github_branch_protection.main arcanequants/onchain-analytics:main
```

### Phase 3: Vercel Resources (Week 5-6)

| Resource | Module | Import/Create |
|----------|--------|---------------|
| Vercel projects | vercel | Import |
| Domains | vercel | Import |
| Environment variables | vercel | Import |
| Edge config | vercel | Create new |

**Import Commands:**
```bash
# Import Vercel project
terraform import module.vercel.vercel_project.main prj_xxxxx

# Import domain
terraform import module.vercel.vercel_project_domain.domains["aiperception.io"] prj_xxxxx/aiperception.io
```

### Phase 4: Supabase Resources (Week 7-8)

| Resource | Module | Import/Create |
|----------|--------|---------------|
| Supabase project | supabase | Import |
| Database config | supabase | Import |
| Auth settings | supabase | Import |
| Storage buckets | supabase | Import |

**Note:** Database schema migrations handled separately via Supabase CLI, not Terraform.

### Phase 5: Stripe & Payment (Week 9-10)

| Resource | Module | Import/Create |
|----------|--------|---------------|
| Products | stripe | Import |
| Prices | stripe | Import |
| Webhooks | stripe | Import |
| Customer portal | stripe | Create new |

### Phase 6: Testing & Validation (Week 11-12)

| Task | Description |
|------|-------------|
| Plan validation | `terraform plan` shows no changes |
| Destroy/recreate test | Test in dev environment |
| DR test | Full restore from Terraform |
| Documentation | Complete runbooks |
| Training | Team training session |

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/terraform.yml

name: Terraform

on:
  push:
    branches: [main]
    paths: ['infrastructure/**']
  pull_request:
    branches: [main]
    paths: ['infrastructure/**']

env:
  TF_VERSION: '1.6.0'
  TF_WORKING_DIR: 'infrastructure'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Format
        run: terraform fmt -check -recursive
        working-directory: ${{ env.TF_WORKING_DIR }}

      - name: Terraform Init
        run: terraform init -backend=false
        working-directory: ${{ env.TF_WORKING_DIR }}

      - name: Terraform Validate
        run: terraform validate
        working-directory: ${{ env.TF_WORKING_DIR }}

  plan:
    needs: validate
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
          cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}

      - name: Terraform Init
        run: terraform init
        working-directory: ${{ env.TF_WORKING_DIR }}/environments/production

      - name: Terraform Plan
        run: terraform plan -no-color
        working-directory: ${{ env.TF_WORKING_DIR }}/environments/production
        env:
          TF_VAR_vercel_api_token: ${{ secrets.VERCEL_TOKEN }}
          TF_VAR_supabase_access_token: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          TF_VAR_github_token: ${{ secrets.GH_TOKEN }}
          TF_VAR_stripe_api_key: ${{ secrets.STRIPE_API_KEY }}

  apply:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
          cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}

      - name: Terraform Init
        run: terraform init
        working-directory: ${{ env.TF_WORKING_DIR }}/environments/production

      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: ${{ env.TF_WORKING_DIR }}/environments/production
        env:
          TF_VAR_vercel_api_token: ${{ secrets.VERCEL_TOKEN }}
          TF_VAR_supabase_access_token: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          TF_VAR_github_token: ${{ secrets.GH_TOKEN }}
          TF_VAR_stripe_api_key: ${{ secrets.STRIPE_API_KEY }}
```

### 6.2 Pre-commit Hooks

```yaml
# .pre-commit-config.yaml

repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.83.5
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
      - id: terraform_tflint
      - id: terraform_checkov
```

---

## 7. Secrets Management

### 7.1 Sensitive Variables

| Variable | Storage | Access |
|----------|---------|--------|
| Database passwords | AWS Secrets Manager | Terraform via data source |
| API keys (OpenAI, etc) | AWS Secrets Manager | Terraform via data source |
| OAuth secrets | AWS Secrets Manager | Terraform via data source |
| Stripe keys | AWS Secrets Manager | Terraform via data source |
| Terraform Cloud token | GitHub Secrets | CI/CD only |

### 7.2 AWS Secrets Manager Integration

```hcl
# Data source for secrets
data "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = "aiperception/${var.environment}/api-keys"
}

locals {
  api_keys = jsondecode(data.aws_secretsmanager_secret_version.api_keys.secret_string)
}

# Usage in module
module "vercel" {
  source = "../modules/vercel"

  environment_variables = [
    {
      key    = "OPENAI_API_KEY"
      value  = local.api_keys.openai
      target = ["production"]
    }
  ]
}
```

---

## 8. Disaster Recovery

### 8.1 Full Infrastructure Recovery

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

set -e

echo "Starting disaster recovery..."

# 1. Initialize Terraform
terraform init

# 2. Apply infrastructure
terraform apply -auto-approve

# 3. Verify deployment
./scripts/verify-deployment.sh

echo "Disaster recovery complete!"
```

### 8.2 Recovery Time Objectives

| Scenario | Without IaC | With IaC |
|----------|-------------|----------|
| Full environment rebuild | 4-8 hours | 30-45 minutes |
| Single service recovery | 1-2 hours | 5-10 minutes |
| Config rollback | 30 minutes | 2 minutes |
| Secret rotation | 1 hour | 10 minutes |

---

## 9. Testing Strategy

### 9.1 Test Types

| Test Type | Description | Frequency |
|-----------|-------------|-----------|
| Format check | `terraform fmt -check` | Every commit |
| Validation | `terraform validate` | Every commit |
| Linting | tflint rules | Every commit |
| Security scan | Checkov/tfsec | Every PR |
| Plan review | Manual review of plan | Every PR |
| Apply test | Apply to dev | Weekly |
| DR test | Full recovery test | Monthly |

### 9.2 Test Environment Strategy

```
main branch
    │
    ▼
[PR Created] ──► [terraform plan (dev)]
    │
    ▼
[PR Merged] ──► [terraform apply (dev)]
    │
    ▼
[Tag: staging-*] ──► [terraform apply (staging)]
    │
    ▼
[Tag: prod-*] ──► [terraform apply (production)]
```

---

## 10. Success Metrics

### 10.1 Migration Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| IaC coverage | 100% | Resources in TF / Total |
| Drift detection | 0 drift | Daily terraform plan |
| Plan accuracy | 100% | Apply matches plan |
| Recovery time | <30 min | DR test duration |

### 10.2 Operational Metrics

| Metric | Before IaC | After IaC |
|--------|------------|-----------|
| Change lead time | 2-4 hours | 15-30 minutes |
| Change failure rate | 15% | <5% |
| Mean time to recovery | 4 hours | 30 minutes |
| Infrastructure audits | Manual | Automated |

---

## Appendix A: Resource Import Checklist

### Vercel Resources

- [ ] Project: `prj_JcfMkHCknbG347i8NpBykOjL5qbB`
- [ ] Domain: `aiperception.io`
- [ ] Domain: `app.aiperception.io`
- [ ] Environment variables (25+)

### Supabase Resources

- [ ] Project: `fjxbuyxephlfoivcpckd`
- [ ] Database settings
- [ ] Auth configuration
- [ ] Storage buckets

### GitHub Resources

- [ ] Repository: `arcanequants/onchain-analytics`
- [ ] Branch protection rules
- [ ] Actions secrets
- [ ] Environments

### Stripe Resources

- [ ] Products (Free, Pro, Enterprise)
- [ ] Prices (monthly, annual)
- [ ] Webhook endpoints

## Appendix B: Terraform Commands Quick Reference

```bash
# Initialize
terraform init

# Format check
terraform fmt -check -recursive

# Validate
terraform validate

# Plan
terraform plan -out=plan.tfplan

# Apply
terraform apply plan.tfplan

# Import resource
terraform import <resource_address> <resource_id>

# Show state
terraform state list
terraform state show <resource_address>

# Destroy (DANGER)
terraform destroy -target=<resource_address>
```

## Appendix C: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | CTO | Initial migration plan |
