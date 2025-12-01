# OIDC Provider Module for GitHub Actions
# Phase 4, Week 8 - DevSecOps Checklist
#
# Configures OIDC federation for secure CI/CD

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ================================================================
# VARIABLES
# ================================================================

variable "github_org" {
  description = "GitHub organization name"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "allowed_branches" {
  description = "List of branches allowed to assume the role"
  type        = list(string)
  default     = ["main", "production"]
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "deploy_policy_arns" {
  description = "List of policy ARNs to attach to the deploy role"
  type        = list(string)
  default     = []
}

# ================================================================
# OIDC PROVIDER
# ================================================================

# Check if provider already exists
data "aws_iam_openid_connect_provider" "github" {
  count = length(try(data.aws_iam_openid_connect_provider.github_existing.id, "")) > 0 ? 0 : 1
  url   = "https://token.actions.githubusercontent.com"
}

data "aws_iam_openid_connect_provider" "github_existing" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github" {
  count = length(try(data.aws_iam_openid_connect_provider.github_existing.id, "")) > 0 ? 0 : 1

  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]

  # GitHub's OIDC thumbprints
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]

  tags = {
    Name        = "github-actions-oidc"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

locals {
  oidc_provider_arn = length(try(data.aws_iam_openid_connect_provider.github_existing.id, "")) > 0 ? data.aws_iam_openid_connect_provider.github_existing.arn : aws_iam_openid_connect_provider.github[0].arn
}

# ================================================================
# IAM ROLE FOR GITHUB ACTIONS
# ================================================================

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [local.oidc_provider_arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    # Restrict to specific repository
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Restrict to specific branches
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        for branch in var.allowed_branches :
        "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/${branch}"
      ]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${var.project_name}-${var.environment}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
  max_session_duration = 3600 # 1 hour maximum

  tags = {
    Name        = "${var.project_name}-github-actions"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ================================================================
# DEFAULT DEPLOY POLICY
# ================================================================

data "aws_iam_policy_document" "deploy" {
  # S3 for deployment artifacts
  statement {
    sid    = "S3Access"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::${var.project_name}-${var.environment}-*",
      "arn:aws:s3:::${var.project_name}-${var.environment}-*/*"
    ]
  }

  # Secrets Manager for environment variables
  statement {
    sid    = "SecretsManagerRead"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [
      "arn:aws:secretsmanager:*:*:secret:${var.environment}/${var.project_name}/*"
    ]
  }

  # CloudWatch for logging
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "arn:aws:logs:*:*:log-group:/aws/github-actions/${var.project_name}/*"
    ]
  }

  # ECR for container images (if needed)
  statement {
    sid    = "ECRAccess"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload"
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Project"
      values   = [var.project_name]
    }
  }
}

resource "aws_iam_policy" "deploy" {
  name        = "${var.project_name}-${var.environment}-deploy"
  description = "Policy for GitHub Actions deployments"
  policy      = data.aws_iam_policy_document.deploy.json

  tags = {
    Name        = "${var.project_name}-deploy"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role_policy_attachment" "deploy" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.deploy.arn
}

# Attach additional policies
resource "aws_iam_role_policy_attachment" "additional" {
  for_each = toset(var.deploy_policy_arns)

  role       = aws_iam_role.github_actions.name
  policy_arn = each.value
}

# ================================================================
# OUTPUTS
# ================================================================

output "oidc_provider_arn" {
  description = "OIDC provider ARN"
  value       = local.oidc_provider_arn
}

output "role_arn" {
  description = "IAM role ARN for GitHub Actions"
  value       = aws_iam_role.github_actions.arn
}

output "role_name" {
  description = "IAM role name for GitHub Actions"
  value       = aws_iam_role.github_actions.name
}

output "deploy_policy_arn" {
  description = "Deploy policy ARN"
  value       = aws_iam_policy.deploy.arn
}
