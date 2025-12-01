# Vercel Module for AI Perception Engineering Agency
# Manages Vercel project configuration

terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

# ================================================================
# VARIABLES
# ================================================================

variable "project_name" {
  description = "Name of the Vercel project"
  type        = string
}

variable "team_id" {
  description = "Vercel team ID (optional)"
  type        = string
  default     = null
}

variable "git_repository" {
  description = "Git repository configuration"
  type = object({
    type              = string
    repo              = string
    production_branch = string
  })
}

variable "framework" {
  description = "Framework type"
  type        = string
  default     = "nextjs"
}

variable "build_command" {
  description = "Build command"
  type        = string
  default     = "npm run build"
}

variable "output_directory" {
  description = "Output directory"
  type        = string
  default     = ".next"
}

variable "install_command" {
  description = "Install command"
  type        = string
  default     = "npm ci"
}

variable "serverless_region" {
  description = "Serverless function region"
  type        = string
  default     = "iad1"
}

variable "environment_variables" {
  description = "Map of environment variables"
  type = map(object({
    value     = string
    target    = list(string)
    sensitive = optional(bool, false)
  }))
  default = {}
}

variable "domains" {
  description = "List of domains to configure"
  type        = list(string)
  default     = []
}

# ================================================================
# RESOURCES
# ================================================================

resource "vercel_project" "this" {
  name      = var.project_name
  team_id   = var.team_id
  framework = var.framework

  git_repository = {
    type              = var.git_repository.type
    repo              = var.git_repository.repo
    production_branch = var.git_repository.production_branch
  }

  build_command              = var.build_command
  output_directory           = var.output_directory
  install_command            = var.install_command
  serverless_function_region = var.serverless_region
}

resource "vercel_project_environment_variable" "this" {
  for_each = var.environment_variables

  project_id = vercel_project.this.id
  key        = each.key
  value      = each.value.value
  target     = each.value.target
  sensitive  = each.value.sensitive
}

resource "vercel_project_domain" "this" {
  for_each = toset(var.domains)

  project_id = vercel_project.this.id
  domain     = each.value
}

# ================================================================
# OUTPUTS
# ================================================================

output "project_id" {
  description = "Vercel project ID"
  value       = vercel_project.this.id
}

output "project_name" {
  description = "Vercel project name"
  value       = vercel_project.this.name
}

output "configured_domains" {
  description = "Configured domains"
  value       = [for d in vercel_project_domain.this : d.domain]
}
