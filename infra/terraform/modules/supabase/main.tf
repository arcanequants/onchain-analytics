# Supabase Project Configuration Module
# Phase 4, Week 8 - DevSecOps Checklist

terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

# ================================================================
# VARIABLES
# ================================================================

variable "organization_id" {
  description = "Supabase organization ID"
  type        = string
}

variable "project_name" {
  description = "Name for the Supabase project"
  type        = string
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Region for the Supabase project"
  type        = string
  default     = "us-east-1"
}

variable "plan" {
  description = "Supabase plan (free, pro, team)"
  type        = string
  default     = "pro"

  validation {
    condition     = contains(["free", "pro", "team", "enterprise"], var.plan)
    error_message = "Plan must be one of: free, pro, team, enterprise"
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
}

# ================================================================
# SUPABASE PROJECT
# ================================================================

resource "supabase_project" "main" {
  organization_id   = var.organization_id
  name              = var.project_name
  database_password = var.database_password
  region            = var.region

  lifecycle {
    prevent_destroy = true
  }
}

# ================================================================
# DATABASE SETTINGS
# ================================================================

resource "supabase_settings" "main" {
  project_ref = supabase_project.main.id

  api {
    # Enable pg_graphql extension
    pg_graphql_enabled = true
  }
}

# ================================================================
# OUTPUTS
# ================================================================

output "project_id" {
  description = "Supabase project ID"
  value       = supabase_project.main.id
}

output "project_ref" {
  description = "Supabase project reference"
  value       = supabase_project.main.id
}

output "api_url" {
  description = "Supabase API URL"
  value       = "https://${supabase_project.main.id}.supabase.co"
}

output "anon_key" {
  description = "Supabase anonymous key"
  value       = supabase_project.main.anon_key
  sensitive   = true
}

output "service_role_key" {
  description = "Supabase service role key"
  value       = supabase_project.main.service_role_key
  sensitive   = true
}

output "database_url" {
  description = "Database connection URL"
  value       = "postgresql://postgres:${var.database_password}@db.${supabase_project.main.id}.supabase.co:5432/postgres"
  sensitive   = true
}
