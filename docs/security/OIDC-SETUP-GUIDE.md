# OIDC Authentication Setup Guide

## Overview

This guide documents the OpenID Connect (OIDC) configuration for secure, keyless authentication in our CI/CD pipelines. OIDC eliminates the need for long-lived secrets by using short-lived, automatically rotated tokens.

## Benefits of OIDC

| Traditional Secrets | OIDC |
|---------------------|------|
| Long-lived credentials | Short-lived tokens (minutes) |
| Manual rotation required | Automatic rotation |
| Risk of secret exposure | No secrets to expose |
| Stored in GitHub Secrets | Generated on demand |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐                                                │
│  │  Workflow Run   │                                                │
│  │                 │                                                │
│  │  1. Request     │                                                │
│  │     OIDC Token  │                                                │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐      ┌─────────────────┐                       │
│  │  GitHub OIDC    │      │  Cloud Provider │                       │
│  │  Provider       │ ────▶│  (AWS/Vercel)   │                       │
│  │                 │      │                 │                       │
│  │  2. Issue JWT   │      │  3. Validate    │                       │
│  │     Token       │      │     Token       │                       │
│  └─────────────────┘      └────────┬────────┘                       │
│                                    │                                │
│                                    ▼                                │
│                           ┌─────────────────┐                       │
│                           │  4. Authorized  │                       │
│                           │     Actions     │                       │
│                           │  (Deploy, etc)  │                       │
│                           └─────────────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## GitHub Actions OIDC Token

GitHub automatically provides OIDC tokens to workflows. The token contains claims about the workflow:

```json
{
  "iss": "https://token.actions.githubusercontent.com",
  "sub": "repo:org/repo:ref:refs/heads/main",
  "aud": "https://github.com/org",
  "ref": "refs/heads/main",
  "sha": "abc123...",
  "repository": "org/repo",
  "repository_owner": "org",
  "actor": "username",
  "event_name": "push"
}
```

## Provider-Specific Setup

### AWS OIDC Setup

#### 1. Create Identity Provider in AWS IAM

```bash
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --client-id-list "sts.amazonaws.com" \
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"
```

#### 2. Create IAM Role with Trust Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:arcanequants/ai-perception:*"
        }
      }
    }
  ]
}
```

#### 3. Attach Required Policies

```bash
# Example: S3 deployment access
aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

#### 4. GitHub Workflow Usage

```yaml
permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsDeployRole
          aws-region: us-east-1
```

### Vercel OIDC Setup

#### 1. Configure GitHub Repository Variables

```bash
# Set as repository variables (not secrets)
VERCEL_ORG_ID=team_xxxx
VERCEL_PROJECT_ID=prj_xxxx
```

#### 2. Vercel API Token (Currently Required)

While Vercel is working on native OIDC support, use a Vercel token stored as a GitHub Secret:

```yaml
- name: Deploy to Vercel
  run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

#### 3. Future OIDC Support (When Available)

```yaml
- name: Get OIDC token for Vercel
  id: oidc
  uses: actions/github-script@v7
  with:
    script: |
      const token = await core.getIDToken('vercel.com');
      core.setSecret(token);
      core.setOutput('token', token);

- name: Deploy with OIDC
  run: vercel deploy --prod --token="${{ steps.oidc.outputs.token }}"
```

### Supabase OIDC Setup

#### 1. Configure Supabase CLI with OIDC

```yaml
- name: Get OIDC token for Supabase
  id: supabase-oidc
  uses: actions/github-script@v7
  with:
    script: |
      const token = await core.getIDToken('supabase.com');
      core.setSecret(token);
      core.setOutput('token', token);

- name: Run migrations
  run: supabase db push --access-token "${{ steps.supabase-oidc.outputs.token }}"
```

## Workflow Configuration

### Required Permissions

```yaml
permissions:
  id-token: write    # Required for OIDC token request
  contents: read     # Required for checkout
  deployments: write # Optional: for deployment tracking
```

### Getting OIDC Token in Workflow

```yaml
- name: Get OIDC Token
  id: oidc
  uses: actions/github-script@v7
  with:
    script: |
      // Request token for specific audience
      const token = await core.getIDToken('sts.amazonaws.com');
      core.setSecret(token);
      core.setOutput('token', token);
```

### Multiple Audiences

```yaml
- name: Get tokens for multiple providers
  uses: actions/github-script@v7
  with:
    script: |
      const awsToken = await core.getIDToken('sts.amazonaws.com');
      const vercelToken = await core.getIDToken('vercel.com');

      core.setSecret(awsToken);
      core.setSecret(vercelToken);

      core.setOutput('aws_token', awsToken);
      core.setOutput('vercel_token', vercelToken);
```

## Security Best Practices

### 1. Restrict Token Audience

Always specify the minimum required audience:

```yaml
# Good - specific audience
const token = await core.getIDToken('sts.amazonaws.com');

# Bad - default audience includes more permissions
const token = await core.getIDToken();
```

### 2. Limit Trust Policy Scope

```json
{
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:sub": "repo:org/repo:ref:refs/heads/main"
    }
  }
}
```

### 3. Use Environment Protection Rules

```yaml
jobs:
  deploy-production:
    environment:
      name: production
    # Requires approval before running
```

### 4. Audit Token Usage

Monitor CloudTrail for AssumeRoleWithWebIdentity calls:

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity \
  --start-time "2024-01-01"
```

## Troubleshooting

### Token Request Failed

```
Error: Unable to get OIDC token
```

**Solution**: Ensure `id-token: write` permission is set.

### Invalid Audience

```
Error: Token audience doesn't match
```

**Solution**: Verify the audience in the OIDC token matches the trust policy.

### Trust Policy Denied

```
Error: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

**Solution**: Check the `sub` claim in trust policy matches the workflow.

### Token Debugging

```yaml
- name: Debug OIDC token
  uses: actions/github-script@v7
  with:
    script: |
      const token = await core.getIDToken('sts.amazonaws.com');
      const [header, payload, signature] = token.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      console.log('Token claims:', JSON.stringify(decoded, null, 2));
```

## Migration from Long-Lived Secrets

### Phase 1: Parallel Running
- Keep existing secrets
- Add OIDC authentication
- Test in preview environments

### Phase 2: Validation
- Run OIDC in production with fallback
- Monitor for issues
- Document any differences

### Phase 3: Deprecation
- Remove fallback to secrets
- Delete long-lived credentials
- Update documentation

### Phase 4: Completion
- Remove secret references from workflows
- Rotate and delete old secrets
- Enable alerts for secret creation

## Current Implementation Status

| Provider | OIDC Status | Notes |
|----------|-------------|-------|
| AWS | Configured | Full OIDC support |
| Vercel | Pending | Using token, awaiting native OIDC |
| Supabase | Pending | Using access token |
| GitHub | Native | Built-in OIDC provider |

## Related Documentation

- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [AWS OIDC Provider](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [Workflow: oidc-deploy.yml](/.github/workflows/oidc-deploy.yml)

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | Claude | Initial version |
