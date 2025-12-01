# Secrets Management Module
# Phase 4, Week 8 - DevSecOps Checklist
#
# Manages secrets in AWS Secrets Manager

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# ================================================================
# VARIABLES
# ================================================================

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "secrets" {
  description = "Map of secrets to create"
  type = map(object({
    description = string
    value       = string
    rotation    = optional(bool, false)
  }))
  sensitive = true
}

variable "kms_key_id" {
  description = "KMS key ID for secret encryption"
  type        = string
  default     = null
}

# ================================================================
# KMS KEY FOR SECRETS
# ================================================================

resource "aws_kms_key" "secrets" {
  count = var.kms_key_id == null ? 1 : 0

  description             = "KMS key for ${var.project_name} secrets"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Secrets Manager"
        Effect = "Allow"
        Principal = {
          Service = "secretsmanager.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-secrets-key"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_kms_alias" "secrets" {
  count = var.kms_key_id == null ? 1 : 0

  name          = "alias/${var.project_name}-${var.environment}-secrets"
  target_key_id = aws_kms_key.secrets[0].key_id
}

data "aws_caller_identity" "current" {}

# ================================================================
# SECRETS
# ================================================================

resource "aws_secretsmanager_secret" "secrets" {
  for_each = var.secrets

  name        = "${var.environment}/${var.project_name}/${each.key}"
  description = each.value.description
  kms_key_id  = var.kms_key_id != null ? var.kms_key_id : aws_kms_key.secrets[0].id

  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = each.key
    Environment = var.environment
    ManagedBy   = "terraform"
    Rotation    = each.value.rotation ? "enabled" : "disabled"
  }
}

resource "aws_secretsmanager_secret_version" "secrets" {
  for_each = var.secrets

  secret_id     = aws_secretsmanager_secret.secrets[each.key].id
  secret_string = each.value.value
}

# ================================================================
# IAM POLICY FOR SECRET ACCESS
# ================================================================

resource "aws_iam_policy" "secrets_read" {
  name        = "${var.project_name}-${var.environment}-secrets-read"
  description = "Policy to read ${var.project_name} secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadSecrets"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          for secret in aws_secretsmanager_secret.secrets : secret.arn
        ]
      },
      {
        Sid    = "DecryptSecrets"
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = var.kms_key_id != null ? [var.kms_key_id] : [aws_kms_key.secrets[0].arn]
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-secrets-read"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ================================================================
# OUTPUTS
# ================================================================

output "secret_arns" {
  description = "Map of secret names to ARNs"
  value = {
    for k, v in aws_secretsmanager_secret.secrets : k => v.arn
  }
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = var.kms_key_id != null ? var.kms_key_id : aws_kms_key.secrets[0].arn
}

output "secrets_read_policy_arn" {
  description = "IAM policy ARN for reading secrets"
  value       = aws_iam_policy.secrets_read.arn
}
