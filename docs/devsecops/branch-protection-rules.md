# Branch Protection Rules

**Document Version**: 1.0
**Last Updated**: 2025-12-01
**Owner**: DevSecOps Team
**Status**: Active

---

## 1. Overview

This document defines the branch protection rules for the AI Perception codebase. These rules ensure code quality, security, and proper review processes before changes reach production.

---

## 2. Branch Structure

### 2.1 Protected Branches

| Branch | Protection Level | Purpose |
|--------|-----------------|---------|
| `main` | Critical | Production-ready code |
| `staging` | High | Pre-production testing |
| `develop` | Medium | Integration branch |
| `release/*` | High | Release candidates |

### 2.2 Branch Naming Convention

```
feature/    - New features (e.g., feature/schema-extractor)
bugfix/     - Bug fixes (e.g., bugfix/score-calculation)
hotfix/     - Production hotfixes (e.g., hotfix/security-patch)
release/    - Release branches (e.g., release/v1.2.0)
docs/       - Documentation only (e.g., docs/api-reference)
refactor/   - Code refactoring (e.g., refactor/auth-module)
test/       - Test additions (e.g., test/integration-coverage)
chore/      - Maintenance tasks (e.g., chore/dependency-update)
```

---

## 3. Main Branch Protection

### 3.1 Required Settings

```yaml
# GitHub Branch Protection Configuration for 'main'

protection_rules:
  require_pull_request_reviews:
    enabled: true
    required_approving_review_count: 2
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
    require_last_push_approval: true

  require_status_checks:
    enabled: true
    strict: true  # Require branch to be up to date
    contexts:
      - "build"
      - "test"
      - "lint"
      - "type-check"
      - "security-scan"

  require_conversation_resolution: true

  require_signed_commits: true

  require_linear_history: true

  enforce_admins: true

  restrictions:
    users: []
    teams:
      - "core-maintainers"
    apps:
      - "github-actions"

  allow_force_pushes: false

  allow_deletions: false
```

### 3.2 Required Status Checks

| Check | Description | Required |
|-------|-------------|----------|
| `build` | Next.js build succeeds | Yes |
| `test` | All unit tests pass | Yes |
| `lint` | ESLint passes with no errors | Yes |
| `type-check` | TypeScript compilation succeeds | Yes |
| `security-scan` | Gitleaks finds no secrets | Yes |
| `coverage` | Code coverage >= 80% | No* |

*Coverage is tracked but not blocking for now.

### 3.3 Code Owners

```
# .github/CODEOWNERS

# Default owners for everything
*                       @ai-perception/core-team

# Security-sensitive files require security review
/src/lib/security/      @ai-perception/security-team
/src/lib/auth/          @ai-perception/security-team
/.env.example           @ai-perception/security-team

# AI/ML code requires ML team review
/src/lib/ai/            @ai-perception/ml-team
/src/lib/nlp/           @ai-perception/ml-team
/src/lib/knowledge-graph/ @ai-perception/ml-team

# Infrastructure changes require DevOps review
/.github/workflows/     @ai-perception/devops-team
/supabase/              @ai-perception/devops-team
/scripts/               @ai-perception/devops-team

# Documentation
/docs/                  @ai-perception/docs-team

# Legal/compliance documents
/docs/legal/            @ai-perception/legal-team
/docs/security/         @ai-perception/security-team
```

---

## 4. Staging Branch Protection

### 4.1 Required Settings

```yaml
# GitHub Branch Protection Configuration for 'staging'

protection_rules:
  require_pull_request_reviews:
    enabled: true
    required_approving_review_count: 1
    dismiss_stale_reviews: true
    require_code_owner_reviews: false

  require_status_checks:
    enabled: true
    strict: true
    contexts:
      - "build"
      - "test"
      - "lint"

  require_conversation_resolution: false

  require_signed_commits: false

  enforce_admins: false

  allow_force_pushes: false

  allow_deletions: false
```

---

## 5. Develop Branch Protection

### 5.1 Required Settings

```yaml
# GitHub Branch Protection Configuration for 'develop'

protection_rules:
  require_pull_request_reviews:
    enabled: true
    required_approving_review_count: 1
    dismiss_stale_reviews: false

  require_status_checks:
    enabled: true
    strict: false  # Allow merging even if not up to date
    contexts:
      - "build"
      - "test"

  allow_force_pushes: false

  allow_deletions: false
```

---

## 6. Merge Requirements

### 6.1 Pull Request Checklist

Before merging any PR, ensure:

- [ ] All CI checks pass
- [ ] Required number of approvals received
- [ ] No merge conflicts
- [ ] Conversation threads resolved
- [ ] Branch is up to date with target (for main)
- [ ] Commit messages follow conventions
- [ ] No secrets in code (verified by Gitleaks)
- [ ] Documentation updated (if applicable)
- [ ] Tests added/updated (if applicable)

### 6.2 Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>

Examples:
feat(auth): add OAuth2 support for Google login
fix(scoring): correct weight calculation for brand metrics
docs(api): update endpoint documentation for v2
chore(deps): upgrade Next.js to 15.1.0
```

**Types**: feat, fix, docs, style, refactor, perf, test, chore, ci, build

### 6.3 Merge Strategies

| Target Branch | Strategy | Squash | Rebase |
|---------------|----------|--------|--------|
| main | Merge commit | No | No |
| staging | Squash | Yes | No |
| develop | Squash or Merge | Optional | No |

---

## 7. Security Considerations

### 7.1 Secret Scanning

All branches are scanned for secrets using:
- GitHub Secret Scanning
- Gitleaks (pre-commit and CI)
- detect-secrets

### 7.2 Dependency Scanning

- Dependabot enabled for security updates
- npm audit runs on every CI build
- Critical vulnerabilities block merges

### 7.3 Code Scanning

- CodeQL analysis on main branch
- SAST scanning for security vulnerabilities
- Weekly scheduled scans

---

## 8. Emergency Procedures

### 8.1 Hotfix Process

For critical production issues:

1. Create `hotfix/` branch from `main`
2. Implement minimal fix
3. Get expedited review (1 senior reviewer)
4. Merge to `main` with documented justification
5. Cherry-pick to `develop` and `staging`

### 8.2 Bypass Conditions

Branch protection can only be bypassed:
- By repository admins
- With documented justification
- For genuine emergencies
- With post-incident review

**Bypass requires**:
- Slack notification to #engineering
- GitHub issue documenting the bypass
- Post-mortem within 48 hours

---

## 9. Enforcement

### 9.1 Automated Enforcement

GitHub Actions enforce:
- Required status checks
- Commit signature verification
- Branch naming conventions
- PR template completion

### 9.2 Manual Enforcement

Code reviewers enforce:
- Code quality standards
- Architecture decisions
- Security best practices
- Documentation requirements

### 9.3 Violations

| Violation | First Offense | Repeat Offense |
|-----------|---------------|----------------|
| Bypassing checks | Warning + documentation | Process review |
| Committing secrets | Immediate rotation + training | Access review |
| Force push to protected | Investigation | Restricted access |

---

## 10. Implementation Guide

### 10.1 GitHub UI Setup

1. Go to Repository → Settings → Branches
2. Click "Add rule" for each protected branch
3. Configure settings as specified above
4. Save changes

### 10.2 CLI Setup (gh CLI)

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Set up branch protection for main
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks='{"strict":true,"contexts":["build","test","lint","type-check","security-scan"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":2,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  -f restrictions=null \
  -f required_linear_history=true \
  -f allow_force_pushes=false \
  -f allow_deletions=false
```

### 10.3 Terraform Setup (Optional)

```hcl
resource "github_branch_protection" "main" {
  repository_id = github_repository.main.node_id
  pattern       = "main"

  required_status_checks {
    strict   = true
    contexts = ["build", "test", "lint", "type-check", "security-scan"]
  }

  required_pull_request_reviews {
    required_approving_review_count = 2
    dismiss_stale_reviews           = true
    require_code_owner_reviews      = true
    require_last_push_approval      = true
  }

  enforce_admins         = true
  require_signed_commits = true
  allows_force_pushes    = false
  allows_deletions       = false
}
```

---

## 11. Monitoring and Auditing

### 11.1 Audit Logs

Review GitHub audit logs monthly for:
- Branch protection changes
- Protection bypasses
- Force pushes
- Admin actions

### 11.2 Metrics

Track and review:
- PR review turnaround time
- CI/CD failure rates
- Security scan findings
- Bypass frequency

---

## 12. Related Documents

- [INFORMATION-SECURITY-POLICY.md](../security/INFORMATION-SECURITY-POLICY.md)
- [ACCESS-CONTROL-POLICY.md](../security/ACCESS-CONTROL-POLICY.md)
- [NAMING-CONVENTIONS.md](../standards/NAMING-CONVENTIONS.md)

---

## 13. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-01 | Initial release |

---

*This document is enforced through GitHub branch protection rules and CI/CD pipelines.*
