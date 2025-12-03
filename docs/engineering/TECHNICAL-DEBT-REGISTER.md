# Technical Debt Register

**Last Updated**: 2025-12-01
**Phase**: 2, Week 3, Day 5
**Owner**: Engineering Team

---

## Overview

This document tracks known technical debt, prioritizes remediation efforts, and provides visibility into code quality tradeoffs. Technical debt is categorized by severity and estimated effort.

### Severity Levels

| Level | Description | SLA |
|-------|-------------|-----|
| **Critical** | Security risk or data loss potential | Fix within 1 sprint |
| **High** | Significant performance or reliability impact | Fix within 2 sprints |
| **Medium** | Code quality or maintainability concern | Fix within 1 quarter |
| **Low** | Minor improvement opportunity | Fix when convenient |

### Effort Estimation

| Size | Description | Time Estimate |
|------|-------------|---------------|
| **XS** | Trivial fix | < 1 hour |
| **S** | Small change | 1-4 hours |
| **M** | Moderate work | 1-2 days |
| **L** | Significant effort | 3-5 days |
| **XL** | Major refactor | 1-2 weeks |

---

## Active Technical Debt

### TD-001: In-Memory Analysis Store
**Severity**: High | **Effort**: M | **Created**: 2025-11-27

**Location**: `src/app/api/analyze/route.ts`

**Description**: Analysis records are stored in-memory using a Map. This data is lost on server restart and doesn't scale across multiple instances.

**Current Workaround**: None - data loss occurs on restart.

**Proposed Solution**: Migrate to Supabase with proper database schema (already designed in migrations).

**Blocked By**: None

**Assigned To**: Unassigned

---

### TD-002: Hardcoded AI Provider Credentials
**Severity**: Medium | **Effort**: S | **Created**: 2025-11-28

**Location**: Multiple files in `src/lib/ai/providers/`

**Description**: Some provider configurations have hardcoded defaults that should be fully environment-driven.

**Current Workaround**: Environment variables are used but with defaults.

**Proposed Solution**: Remove all hardcoded defaults, fail fast if env vars missing.

**Blocked By**: None

**Assigned To**: Unassigned

---

### TD-003: Missing Request Tracing Propagation
**Severity**: Medium | **Effort**: M | **Created**: 2025-11-29

**Location**: `src/lib/request-tracing/`

**Description**: Request tracing is set up but trace IDs don't propagate to all downstream services (especially AI provider calls).

**Current Workaround**: Manual correlation using timestamps.

**Proposed Solution**: Implement OpenTelemetry-compatible trace propagation.

**Blocked By**: None

**Assigned To**: Unassigned

---

### TD-004: Duplicate Type Definitions
**Severity**: Low | **Effort**: S | **Created**: 2025-11-30

**Location**: Various files across `src/lib/` and `src/types/`

**Description**: Some type definitions are duplicated across modules instead of being centralized.

**Current Workaround**: None - increases maintenance burden.

**Proposed Solution**: Audit and consolidate types into `src/types/`.

**Blocked By**: None

**Assigned To**: Unassigned

---

### TD-005: Inconsistent Error Handling
**Severity**: Medium | **Effort**: M | **Created**: 2025-11-30

**Location**: API routes in `src/app/api/`

**Description**: Error handling varies between routes - some use Result pattern, others throw, others return error responses directly.

**Current Workaround**: None.

**Proposed Solution**: Standardize on Result pattern with consistent error middleware.

**Blocked By**: None

**Assigned To**: Unassigned

---

### TD-006: Missing API Rate Limiting Per User
**Severity**: High | **Effort**: M | **Created**: 2025-12-01

**Location**: `src/lib/rate-limit.ts`

**Description**: Rate limiting is implemented at the IP level but not at the authenticated user level, allowing abuse across IPs.

**Current Workaround**: IP-based limiting provides some protection.

**Proposed Solution**: Implement user-based rate limiting using Redis.

**Blocked By**: Authentication implementation

**Assigned To**: Unassigned

---

### TD-007: Large Bundle Size from Recharts
**Severity**: Low | **Effort**: M | **Created**: 2025-12-01

**Location**: `src/components/charts/`

**Description**: Recharts is imported in full, adding ~150KB to the bundle when only a subset of components are used.

**Current Workaround**: None.

**Proposed Solution**: Use tree-shaking or switch to lighter charting library (Tremor, Chart.js).

**Blocked By**: None

**Assigned To**: Unassigned

---

### TD-008: Mock Data in Admin Dashboard
**Severity**: Low | **Effort**: S | **Created**: 2025-12-01

**Location**: `src/app/admin/costs/page.tsx`

**Description**: Admin cost dashboard uses mock data instead of real database queries.

**Current Workaround**: Mock data simulates expected behavior.

**Proposed Solution**: Connect to real API endpoints once database is populated.

**Blocked By**: TD-001 (database migration)

**Assigned To**: Unassigned

---

### TD-009: Missing Database Connection Pooling
**Severity**: Medium | **Effort**: S | **Created**: 2025-12-01

**Location**: Database configuration

**Description**: Supabase client is created per-request without explicit connection pooling configuration.

**Current Workaround**: Supabase handles pooling by default, but not optimally configured.

**Proposed Solution**: Configure explicit connection pool size and timeout settings.

**Blocked By**: None

**Assigned To**: Unassigned

---

### TD-010: Test Coverage Gaps
**Severity**: Medium | **Effort**: L | **Created**: 2025-12-01

**Location**: Various modules

**Description**: Several critical modules lack comprehensive test coverage:
- `src/lib/crisis/` - 0% coverage
- `src/lib/media/` - 0% coverage
- `src/lib/ai/drift/` - 0% coverage
- `src/lib/ai/testing/` - 0% coverage

**Current Workaround**: Manual testing.

**Proposed Solution**: Add unit and integration tests for all new modules.

**Blocked By**: None

**Assigned To**: Unassigned

---

## Resolved Technical Debt

### TD-R001: Missing TypeScript Strict Mode
**Resolved**: 2025-11-28 | **Original Severity**: Medium

**Resolution**: Enabled strict mode in tsconfig.json and fixed all type errors.

---

### TD-R002: Untyped Environment Variables
**Resolved**: 2025-11-29 | **Original Severity**: Low

**Resolution**: Implemented Zod-based environment validation in `src/lib/env/`.

---

## Technical Debt Metrics

### Current Summary

| Severity | Count | Total Effort |
|----------|-------|--------------|
| Critical | 0 | 0 |
| High | 2 | 2M |
| Medium | 5 | 4M + 1S |
| Low | 3 | 2S + 1M |

### Trend

```
Week 1: 3 items (1 High, 2 Medium)
Week 2: 6 items (1 High, 3 Medium, 2 Low)
Week 3: 10 items (2 High, 5 Medium, 3 Low)
```

### Burndown Target

- End of Phase 2: Resolve all High severity items
- End of Phase 3: Reduce to < 5 Medium items
- End of Phase 4: Reduce to < 3 total items

---

## Adding New Technical Debt

When adding new technical debt:

1. Create a new entry with unique ID (TD-XXX)
2. Specify severity and effort
3. Document location and description
4. Propose a solution
5. Note any blockers
6. Update the summary metrics

### Template

```markdown
### TD-XXX: [Title]
**Severity**: [Critical|High|Medium|Low] | **Effort**: [XS|S|M|L|XL] | **Created**: YYYY-MM-DD

**Location**: `path/to/file.ts`

**Description**: [What is the debt and why does it exist?]

**Current Workaround**: [How are we managing without fixing it?]

**Proposed Solution**: [How should we fix it?]

**Blocked By**: [Any dependencies?]

**Assigned To**: [Who is responsible?]
```

---

## Review Schedule

- **Weekly**: Review High and Critical items in sprint planning
- **Monthly**: Full register review and prioritization
- **Quarterly**: Metrics analysis and target setting

---

## Related Documents

- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture decisions
- [CODING-STANDARDS.md](../CODING-STANDARDS.md) - Code quality guidelines
- [NAMING-CONVENTIONS.md](../standards/NAMING-CONVENTIONS.md) - Naming standards
