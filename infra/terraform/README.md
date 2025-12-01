# Infrastructure as Code (Terraform)

AI Perception Engineering Agency infrastructure managed with Terraform.

## Overview

This Terraform configuration manages:
- **Vercel Project**: Next.js deployment configuration
- **Environment Variables**: Secure handling of secrets
- **Domains**: Primary and subdomain configuration
- **Drift Detection**: Infrastructure state tracking

## Prerequisites

1. **Terraform**: Version 1.5.0 or higher
2. **Vercel API Token**: Generate at https://vercel.com/account/tokens
3. **Supabase Access Token**: Generate at https://app.supabase.com/account/tokens

## Setup

### 1. Install Terraform

```bash
# macOS
brew install terraform

# Verify installation
terraform version
```

### 2. Set Environment Variables

```bash
export TF_VAR_vercel_api_token="your-vercel-token"
export TF_VAR_supabase_access_token="your-supabase-token"
export TF_VAR_supabase_anon_key="your-anon-key"
export TF_VAR_supabase_service_role_key="your-service-role-key"
export TF_VAR_openai_api_key="your-openai-key"
export TF_VAR_anthropic_api_key="your-anthropic-key"
export TF_VAR_cron_secret="your-cron-secret"
```

### 3. Initialize Terraform

```bash
cd infra/terraform
terraform init
```

### 4. Plan Changes

```bash
# Production
terraform plan -var-file=environments/production.tfvars

# Staging
terraform plan -var-file=environments/staging.tfvars
```

### 5. Apply Changes

```bash
terraform apply -var-file=environments/production.tfvars
```

## Drift Detection

Run drift detection manually:

```bash
terraform plan -var-file=environments/production.tfvars -detailed-exitcode
```

Exit codes:
- `0`: No changes
- `1`: Error
- `2`: Changes detected (drift)

The `/api/cron/detect-drift` endpoint runs this automatically daily.

## Directory Structure

```
infra/terraform/
├── main.tf                      # Main configuration
├── modules/
│   └── vercel/
│       └── main.tf              # Vercel module
├── environments/
│   ├── production.tfvars        # Production values
│   └── staging.tfvars           # Staging values
├── .gitignore                   # Ignore state files
└── README.md                    # This file
```

## Security Notes

1. **Never commit sensitive values**: Use environment variables
2. **State file contains secrets**: Keep terraform.tfstate secure
3. **Review plans carefully**: Destructive changes can break production
4. **Use remote state in production**: Consider Terraform Cloud or S3

## Importing Existing Resources

If migrating from manual setup:

```bash
# Import existing Vercel project
terraform import vercel_project.main prj_XXXXXXXXX

# Import existing domains
terraform import vercel_project_domain.main prj_XXXXXXXXX/aiperception.agency
```

## Common Commands

```bash
# Format configuration
terraform fmt -recursive

# Validate configuration
terraform validate

# Show current state
terraform show

# List resources in state
terraform state list

# Force unlock state (use carefully)
terraform force-unlock LOCK_ID
```
