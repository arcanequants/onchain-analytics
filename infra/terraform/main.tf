# AI Perception Engineering Agency - Infrastructure as Code
# Phase 1, Week 3, Day 5 - DevSecOps Tasks
#
# Terraform configuration for Vercel + Supabase infrastructure
# This enables drift detection and infrastructure governance

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state management
  # In production, use remote backend (S3, GCS, Terraform Cloud)
  backend "local" {
    path = "terraform.tfstate"
  }
}

# ================================================================
# PROVIDERS
# ================================================================

provider "vercel" {
  # API token from environment variable VERCEL_API_TOKEN
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}

provider "supabase" {
  # Access token from environment variable SUPABASE_ACCESS_TOKEN
  access_token = var.supabase_access_token
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ================================================================
# VARIABLES
# ================================================================

variable "vercel_api_token" {
  description = "Vercel API token for authentication"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team ID (optional for personal accounts)"
  type        = string
  default     = null
}

variable "supabase_access_token" {
  description = "Supabase access token for authentication"
  type        = string
  sensitive   = true
}

variable "supabase_organization_id" {
  description = "Supabase organization ID"
  type        = string
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development"
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "ai-perception"
}

variable "domain" {
  description = "Primary domain for the application"
  type        = string
  default     = "aiperception.agency"
}

# ================================================================
# DATA SOURCES
# ================================================================

# Current Vercel project (if importing existing)
data "vercel_project" "main" {
  name = var.project_name
}

# ================================================================
# VERCEL PROJECT
# ================================================================

resource "vercel_project" "main" {
  name      = var.project_name
  framework = "nextjs"

  git_repository = {
    type              = "github"
    repo              = "arcanequants/ai-perception-agency"
    production_branch = "main"
  }

  build_command    = "npm run build"
  output_directory = ".next"
  install_command  = "npm ci"

  # Serverless function configuration
  serverless_function_region = "iad1"

  # Environment variable protection
  protection_bypass_for_automation = false

  # Preview deployments
  auto_assign_custom_domains = true

  # Root directory (monorepo support)
  root_directory = null
}

# ================================================================
# VERCEL ENVIRONMENT VARIABLES
# ================================================================

# Supabase URL
resource "vercel_project_environment_variable" "supabase_url" {
  project_id = vercel_project.main.id
  key        = "NEXT_PUBLIC_SUPABASE_URL"
  value      = var.supabase_project_url
  target     = ["production", "preview", "development"]
}

# Supabase Anon Key (public)
resource "vercel_project_environment_variable" "supabase_anon_key" {
  project_id = vercel_project.main.id
  key        = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  value      = var.supabase_anon_key
  target     = ["production", "preview", "development"]
}

# Supabase Service Role Key (server-side only)
resource "vercel_project_environment_variable" "supabase_service_role" {
  project_id = vercel_project.main.id
  key        = "SUPABASE_SERVICE_ROLE_KEY"
  value      = var.supabase_service_role_key
  target     = ["production", "preview"]
  sensitive  = true
}

# API Keys for LLM providers
resource "vercel_project_environment_variable" "openai_api_key" {
  project_id = vercel_project.main.id
  key        = "OPENAI_API_KEY"
  value      = var.openai_api_key
  target     = ["production"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "anthropic_api_key" {
  project_id = vercel_project.main.id
  key        = "ANTHROPIC_API_KEY"
  value      = var.anthropic_api_key
  target     = ["production"]
  sensitive  = true
}

# Cron secret
resource "vercel_project_environment_variable" "cron_secret" {
  project_id = vercel_project.main.id
  key        = "CRON_SECRET"
  value      = var.cron_secret
  target     = ["production", "preview"]
  sensitive  = true
}

# ================================================================
# VERCEL DOMAINS
# ================================================================

resource "vercel_project_domain" "main" {
  project_id = vercel_project.main.id
  domain     = var.domain
}

resource "vercel_project_domain" "www" {
  project_id = vercel_project.main.id
  domain     = "www.${var.domain}"
}

resource "vercel_project_domain" "app" {
  project_id = vercel_project.main.id
  domain     = "app.${var.domain}"
}

# ================================================================
# ADDITIONAL VARIABLES FOR ENV VARS
# ================================================================

variable "supabase_project_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
}

variable "cron_secret" {
  description = "Secret for authenticating cron jobs"
  type        = string
  sensitive   = true
}

# ================================================================
# OUTPUTS
# ================================================================

output "vercel_project_id" {
  description = "Vercel project ID"
  value       = vercel_project.main.id
}

output "vercel_project_name" {
  description = "Vercel project name"
  value       = vercel_project.main.name
}

output "vercel_domains" {
  description = "Configured domains"
  value = [
    vercel_project_domain.main.domain,
    vercel_project_domain.www.domain,
    vercel_project_domain.app.domain,
  ]
}

output "environment" {
  description = "Current environment"
  value       = var.environment
}

# ================================================================
# MODULE: OIDC FOR GITHUB ACTIONS
# ================================================================

module "oidc" {
  source = "./modules/oidc"

  github_org       = var.github_org
  github_repo      = var.github_repo
  allowed_branches = ["main", "production"]
  project_name     = var.project_name
  environment      = var.environment
}

# ================================================================
# MODULE: SECRETS MANAGEMENT
# ================================================================

module "secrets" {
  source = "./modules/secrets"

  project_name = var.project_name
  environment  = var.environment

  secrets = {
    "openai-api-key" = {
      description = "OpenAI API key"
      value       = var.openai_api_key
      rotation    = false
    }
    "anthropic-api-key" = {
      description = "Anthropic API key"
      value       = var.anthropic_api_key
      rotation    = false
    }
    "supabase-service-role" = {
      description = "Supabase service role key"
      value       = var.supabase_service_role_key
      rotation    = false
    }
    "cron-secret" = {
      description = "Cron job authentication secret"
      value       = var.cron_secret
      rotation    = false
    }
  }
}

# ================================================================
# MODULE: MONITORING
# ================================================================

module "monitoring" {
  source = "./modules/monitoring"

  providers = {
    aws = aws
  }

  project_name    = var.project_name
  environment     = var.environment
  alert_email     = var.alert_email
  slack_webhook_url = var.slack_webhook_url
}

# ================================================================
# ADDITIONAL VARIABLES FOR MODULES
# ================================================================

variable "github_org" {
  description = "GitHub organization name"
  type        = string
  default     = "arcanequants"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "ai-perception-agency"
}

variable "alert_email" {
  description = "Email for alerts"
  type        = string
  default     = "alerts@aiperception.agency"
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts"
  type        = string
  sensitive   = true
  default     = null
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# ================================================================
# ADDITIONAL OUTPUTS FROM MODULES
# ================================================================

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions"
  value       = module.oidc.role_arn
}

output "secrets_arns" {
  description = "Map of secret ARNs"
  value       = module.secrets.secret_arns
  sensitive   = true
}

output "monitoring_dashboard" {
  description = "CloudWatch dashboard name"
  value       = module.monitoring.dashboard_name
}

output "alerts_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = module.monitoring.alerts_topic_arn
}
