# OIDC Authentication for CI/CD

**Document Version:** 1.0
**Last Updated:** 2025-01-30
**Owner:** DevSecOps

---

## Overview

This document describes the OpenID Connect (OIDC) authentication setup for GitHub Actions, replacing long-lived static tokens with short-lived, dynamically generated credentials.

## Why OIDC?

### Problems with Static Tokens

| Issue | Risk Level | Impact |
|-------|------------|--------|
| Token exposure in logs | High | Full account compromise |
| Token rotation overhead | Medium | Manual process, often skipped |
| Broad permissions | High | Lateral movement if compromised |
| No audit trail | Medium | Difficult incident response |
| Long-lived credentials | High | Extended attack window |

### Benefits of OIDC

| Benefit | Description |
|---------|-------------|
| **No stored secrets** | Tokens generated per-workflow run |
| **Short-lived** | Tokens expire after workflow completes |
| **Scoped** | Limited to specific repository/workflow |
| **Auditable** | Full trace of token issuance |
| **Automatic rotation** | No manual rotation required |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Actions                              │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Workflow   │───▶│ OIDC Provider│───▶│   AWS STS    │      │
│  │              │    │   (GitHub)   │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                                       │               │
│         │                                       ▼               │
│         │                              ┌──────────────┐         │
│         │                              │ Short-lived  │         │
│         │                              │ Credentials  │         │
│         │                              └──────────────┘         │
│         │                                       │               │
│         ▼                                       ▼               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Deploy to Vercel                        │  │
│  │              (Using short-lived credentials)               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Setup Guide

### Step 1: Configure AWS IAM Identity Provider

```hcl
# infra/terraform/modules/oidc/main.tf

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]

  tags = {
    Name        = "github-actions-oidc"
    Environment = "shared"
  }
}
```

### Step 2: Create IAM Role for GitHub Actions

```hcl
# infra/terraform/modules/oidc/role.tf

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [
        "repo:${var.github_org}/${var.github_repo}:*",
      ]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "github-actions-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json

  tags = {
    Name        = "github-actions-deploy"
    Environment = "shared"
  }
}

# Attach necessary policies
resource "aws_iam_role_policy_attachment" "deploy" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.deploy_permissions.arn
}
```

### Step 3: Define Deploy Permissions

```hcl
# infra/terraform/modules/oidc/policy.tf

resource "aws_iam_policy" "deploy_permissions" {
  name        = "github-actions-deploy-permissions"
  description = "Permissions for GitHub Actions deployments"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.deployment_bucket}",
          "arn:aws:s3:::${var.deployment_bucket}/*"
        ]
      },
      {
        Sid    = "CloudFrontInvalidation"
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = var.cloudfront_distribution_arns
      },
      {
        Sid    = "SecretsManagerRead"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:*:*:secret:prod/aiperception/*"
        ]
      }
    ]
  })
}
```

### Step 4: Configure GitHub Workflow

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]

permissions:
  id-token: write   # Required for OIDC
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-deploy
          role-session-name: github-actions-${{ github.run_id }}
          aws-region: us-east-1

      - name: Verify credentials
        run: aws sts get-caller-identity

      - name: Deploy
        run: |
          # Your deployment commands here
          # Credentials are automatically available
```

## Security Best Practices

### 1. Limit Role Scope

```hcl
# Only allow specific branches
condition {
  test     = "StringEquals"
  variable = "token.actions.githubusercontent.com:sub"
  values   = [
    "repo:org/repo:ref:refs/heads/main",
    "repo:org/repo:ref:refs/heads/production",
  ]
}
```

### 2. Use Environment Protection

```yaml
jobs:
  deploy:
    environment: production  # Requires approval
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
```

### 3. Audit Token Usage

```sql
-- CloudTrail query for OIDC token usage
SELECT
  eventTime,
  eventName,
  userIdentity.sessionContext.sessionIssuer.arn AS role_arn,
  userIdentity.sessionContext.webIdFederationData.federatedProvider AS provider,
  sourceIPAddress,
  requestParameters
FROM cloudtrail_logs
WHERE eventSource = 'sts.amazonaws.com'
  AND eventName = 'AssumeRoleWithWebIdentity'
ORDER BY eventTime DESC;
```

### 4. Monitor for Anomalies

```yaml
# CloudWatch alarm for unusual OIDC usage
resource "aws_cloudwatch_metric_alarm" "unusual_oidc" {
  alarm_name          = "unusual-oidc-token-usage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "AssumeRoleWithWebIdentityCount"
  namespace           = "AWS/STS"
  period              = 3600
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "Unusual number of OIDC token requests"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    RoleArn = aws_iam_role.github_actions.arn
  }
}
```

## Vercel OIDC Integration

For Vercel deployments, we use a hybrid approach:

```yaml
steps:
  # Get OIDC token for AWS services
  - name: Configure AWS credentials via OIDC
    uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
      aws-region: us-east-1

  # Get Vercel token from AWS Secrets Manager
  - name: Get Vercel token
    id: secrets
    run: |
      TOKEN=$(aws secretsmanager get-secret-value \
        --secret-id prod/aiperception/vercel \
        --query SecretString --output text)
      echo "::add-mask::$TOKEN"
      echo "token=$TOKEN" >> $GITHUB_OUTPUT

  # Deploy to Vercel using retrieved token
  - name: Deploy to Vercel
    run: vercel deploy --prod --token=${{ steps.secrets.outputs.token }}
```

## Troubleshooting

### Error: "Could not assume role"

**Cause**: Trust policy doesn't match workflow context

**Solution**:
```hcl
# Check the exact subject claim
condition {
  test     = "StringLike"
  variable = "token.actions.githubusercontent.com:sub"
  values   = [
    "repo:OWNER/REPO:*",  # Wildcard for all refs
  ]
}
```

### Error: "Token expired"

**Cause**: Long-running workflow exceeded token lifetime

**Solution**: Re-authenticate mid-workflow
```yaml
- name: Re-authenticate
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: us-east-1
```

### Error: "Permission denied"

**Cause**: IAM policy doesn't include required actions

**Solution**: Review CloudTrail logs
```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AccessDenied \
  --start-time 2025-01-30T00:00:00Z
```

## Migration Checklist

- [ ] Create OIDC provider in AWS
- [ ] Create IAM role with trust policy
- [ ] Attach necessary permissions
- [ ] Update GitHub workflows
- [ ] Test in staging environment
- [ ] Remove old static tokens
- [ ] Update documentation
- [ ] Monitor for issues

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-30 | DevSecOps | Initial version |

**Next Review:** 2025-07-30
