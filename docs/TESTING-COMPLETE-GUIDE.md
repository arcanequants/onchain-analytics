# Complete Testing Guide - OnChain Analytics

## Overview

This guide covers all testing procedures for OnChain Analytics, from unit tests to security audits.

---

## Test Suites

### 1. Unit Tests (Vitest)
**Location:** `src/lib/*.test.ts`
**Purpose:** Test individual functions and utilities

**Run:**
```bash
npm test                 # Run once
npm run test:watch       # Watch mode
npm run test:ui          # Visual UI
npm run test:coverage    # With coverage report
```

**Current Tests:**
- `validation.test.ts` - Input validation functions (100% coverage)
- `rate-limit.test.ts` - Rate limiting logic (100% coverage)

**Example:**
```typescript
import { describe, it, expect } from 'vitest'
import { validateChain } from './validation'

describe('validateChain', () => {
  it('should accept valid chains', () => {
    expect(validateChain('ethereum')).toBe(true)
  })

  it('should reject invalid chains', () => {
    expect(validateChain('bitcoin')).toBe(false)
  })
})
```

---

### 2. Integration Tests (Vitest)
**Location:** `tests/integration/*.test.ts`
**Purpose:** Test API endpoints and database interactions

**Run:**
```bash
npm run test:integration
```

**Tests:**
- `api-gas.test.ts` - Gas tracker endpoints
- `api-fear-greed.test.ts` - Fear & Greed endpoints
- `api-events.test.ts` - Event calendar endpoints
- `api-health.test.ts` - Health check endpoint

**Prerequisites:**
- API must be running (localhost:3000 or production)
- Environment variables configured

**Example:**
```typescript
describe('GET /api/gas', () => {
  it('should return gas prices for all chains', async () => {
    const response = await fetch('http://localhost:3000/api/gas')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })
})
```

---

### 3. E2E Tests (Playwright)
**Location:** `tests/e2e/*.spec.ts`
**Purpose:** Test user flows in real browser

**Run:**
```bash
npm run test:e2e          # Headless
npm run test:e2e:ui       # Interactive UI
npm run test:e2e:headed   # See browser
```

**Tests:**
- `homepage.spec.ts` - Homepage functionality
- `gas-tracker.spec.ts` - Gas price display
- `events-page.spec.ts` - Event calendar
- `fear-greed.spec.ts` - Fear & Greed gauge

**Features:**
- Tests on Chrome, Firefox, Safari, Mobile
- Screenshots on failure
- Video recording on failure
- Trace viewer for debugging

**Example:**
```typescript
test('should display gas tracker', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('text=/GWEI/i')

  const gasPrices = page.locator('text=/\\d+\\.?\\d*\\s*GWEI/i')
  await expect(gasPrices.first()).toBeVisible()
})
```

---

### 4. Load Tests (k6)
**Location:** `tests/load/*.js`
**Purpose:** Test performance under load

**Installation:**
```bash
# macOS
brew install k6

# Ubuntu
sudo apt-get install k6

# Windows
choco install k6
```

**Run:**
```bash
npm run load-test                    # Standard test
k6 run tests/load/spike-test.js     # Spike test
k6 run tests/load/stress-test.js    # Stress test
```

**Tests:**
- `api-load-test.js` - Gradual ramp-up (10 → 200 users)
- `spike-test.js` - Sudden spike (10 → 500 users)
- `stress-test.js` - Find breaking point (up to 400 users)

**Metrics:**
- Response time (avg, p95, p99)
- Error rate
- Requests per second
- Failed requests

**Example Results:**
```
✓ http_req_duration..........: avg=234ms  p(95)=456ms
✓ http_req_failed............: 1.2%
✓ checks.....................: 98.8% passed
```

---

### 5. Security Tests
**Location:** `tests/security/*.sh`
**Purpose:** Find security vulnerabilities

**Run:**
```bash
# All security tests
./tests/security/zap-scan.sh https://vectorialdata.com
./tests/security/security-headers-test.sh https://vectorialdata.com
./tests/security/ssl-test.sh vectorialdata.com

# NPM vulnerabilities
npm audit
```

**Tests:**
- **OWASP ZAP Scan** - Full vulnerability scan (SQL injection, XSS, etc.)
- **Security Headers** - Check HTTP security headers
- **SSL/TLS Test** - Certificate and cipher validation
- **NPM Audit** - Dependency vulnerabilities

**OWASP ZAP Features:**
- Baseline scan (passive)
- API scan (active)
- HTML/JSON/Markdown reports
- Risk scoring (High/Medium/Low)

---

## CI/CD Pipeline

### GitHub Actions Workflows

**Location:** `.github/workflows/`

#### 1. ci.yml - Main CI/CD Pipeline
**Triggers:**
- Push to main/develop
- Pull requests

**Jobs:**
1. **Lint & Type Check**
   - ESLint
   - TypeScript type check

2. **Unit Tests**
   - Vitest tests
   - Coverage report

3. **Build**
   - Next.js build
   - Upload artifacts

4. **Integration Tests**
   - API endpoint tests
   - Database tests

5. **E2E Tests**
   - Playwright tests
   - All browsers

6. **Security Scan**
   - npm audit
   - Snyk scan

7. **Deploy** (main branch only)
   - Deploy to Vercel

**Required Secrets:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
SNYK_TOKEN (optional)
```

#### 2. cron-monitor.yml - CRON Job Monitoring
**Triggers:**
- Every hour
- Manual trigger

**Checks:**
- Health endpoint
- Recent CRON executions
- Alerts on failure

#### 3. dependency-update.yml - Dependency Updates
**Triggers:**
- Weekly (Mondays 9am)
- Manual trigger

**Actions:**
- Update dependencies
- Run tests
- Create PR if passing

---

## Running All Tests

### Quick Test (Essential)
```bash
npm test                # Unit tests
npm run lint            # Linting
npx tsc --noEmit        # Type check
npm run build           # Build test
```

### Full Local Test
```bash
./scripts/run-all-tests.sh
```

**Runs:**
- ✅ Unit tests
- ✅ Type check
- ✅ Linting
- ✅ Build test
- ✅ Integration tests (if API running)
- ✅ E2E tests
- ⏭️ Load tests (optional with RUN_LOAD_TESTS=true)
- ⏭️ Security tests (optional with RUN_SECURITY_TESTS=true)

### Full Test with Load & Security
```bash
RUN_LOAD_TESTS=true RUN_SECURITY_TESTS=true ./scripts/run-all-tests.sh
```

---

## Test Coverage

### Current Coverage

| Module | Coverage | Lines |
|--------|----------|-------|
| validation.ts | 100% | 194 |
| rate-limit.ts | 100% | 172 |
| Overall Unit Tests | 100% | 366 |

### Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** All API endpoints
- **E2E Tests:** Critical user flows
- **Load Tests:** Monthly benchmarks
- **Security:** Quarterly full audits

### Generate Coverage Report
```bash
npm run test:coverage
```

Open: `coverage/index.html`

---

## Writing New Tests

### Unit Test Template
```typescript
// src/lib/myfunction.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from './myfunction'

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })

  it('should handle errors', () => {
    expect(() => myFunction(null)).toThrow()
  })
})
```

### Integration Test Template
```typescript
// tests/integration/api-myendpoint.test.ts
import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

describe('My Endpoint', () => {
  it('should return data', async () => {
    const response = await fetch(`${BASE_URL}/api/myendpoint`)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toBeDefined()
  })
})
```

### E2E Test Template
```typescript
// tests/e2e/myfeature.spec.ts
import { test, expect } from '@playwright/test'

test.describe('My Feature', () => {
  test('should work', async ({ page }) => {
    await page.goto('/mypage')
    await expect(page.locator('h1')).toBeVisible()
  })
})
```

---

## Debugging Tests

### Unit Tests
```bash
# Run specific test file
npm test src/lib/validation.test.ts

# Run specific test
npm test -- -t "should validate chain"

# Debug mode
npm run test:ui
```

### E2E Tests
```bash
# Interactive mode
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npx playwright test tests/e2e/homepage.spec.ts --headed --debug

# Show trace viewer
npx playwright show-trace playwright-report/trace.zip
```

### Integration Tests
```bash
# Verbose output
npm run test:integration -- --reporter=verbose

# Run specific file
npm run test:integration tests/integration/api-gas.test.ts
```

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Homepage Load | < 2s | TBD |
| API Response (p95) | < 500ms | TBD |
| API Response (p99) | < 1s | TBD |
| Error Rate | < 5% | TBD |
| Uptime | > 99.9% | TBD |

### Running Benchmarks
```bash
# Standard load test
k6 run tests/load/api-load-test.js

# Save results
k6 run tests/load/api-load-test.js --out json=results.json
```

---

## Troubleshooting

### Tests Failing in CI but Passing Locally
1. Check environment variables are set in GitHub Secrets
2. Verify Node version matches (20.x)
3. Check for race conditions or timing issues
4. Review CI logs for specific error

### E2E Tests Timing Out
1. Increase timeout in playwright.config.ts
2. Check if app is running on expected port
3. Add explicit waits: `await page.waitForLoadState('networkidle')`
4. Use `--headed` mode to see what's happening

### Integration Tests Failing
1. Verify API is running and accessible
2. Check DATABASE_URL is correct
3. Ensure Supabase tables exist
4. Review API endpoint responses

### Load Tests Showing Poor Performance
1. Check database query efficiency
2. Review API endpoint optimization
3. Verify caching is working
4. Check for N+1 queries
5. Consider connection pooling

---

## Best Practices

### General
- ✅ Write tests before fixing bugs (TDD)
- ✅ Keep tests simple and focused
- ✅ Use descriptive test names
- ✅ Avoid flaky tests (use proper waits)
- ✅ Mock external dependencies
- ✅ Clean up after tests (database, files)

### Unit Tests
- ✅ Test one thing per test
- ✅ Test edge cases
- ✅ Test error conditions
- ✅ Aim for 80%+ coverage

### Integration Tests
- ✅ Test API contract (request/response)
- ✅ Test error responses
- ✅ Test rate limiting
- ✅ Test authentication/authorization

### E2E Tests
- ✅ Test critical user flows
- ✅ Test on multiple browsers
- ✅ Test mobile views
- ✅ Use data-testid attributes
- ✅ Avoid hard-coded waits

### Load Tests
- ✅ Start with low load
- ✅ Gradually increase
- ✅ Test realistic scenarios
- ✅ Monitor during tests
- ✅ Document baselines

### Security Tests
- ✅ Run regularly (monthly minimum)
- ✅ Test in staging first
- ✅ Document findings
- ✅ Track remediation
- ✅ Retest after fixes

---

## Continuous Improvement

### Monthly Tasks
- [ ] Run full security audit
- [ ] Review test coverage
- [ ] Update dependencies
- [ ] Run load tests
- [ ] Review flaky tests

### Quarterly Tasks
- [ ] Third-party security audit
- [ ] Performance benchmarking
- [ ] Test strategy review
- [ ] Update testing docs

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Last Updated:** 2025-01-17
**Maintained By:** Engineering Team
