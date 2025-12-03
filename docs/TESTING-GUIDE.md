# Comprehensive E2E Testing Guide

## Quick Reference

| Role | Access Level | Key Features to Test |
|------|--------------|---------------------|
| Anonymous | Public pages | Landing, Pricing, FAQ, Glossary |
| Free User | Basic analysis | 3 analyses/month, 2 AI providers |
| Starter User | Extended | 100 analyses, 4 providers, exports |
| Pro User | Full access | 500 analyses, API, priority support |
| Admin | All features | All admin dashboards, RLHF, ops |

---

## Pre-Testing Setup

### 1. Environment Check
```bash
# Verify production deployment
curl -I https://onchain-analytics-arcanequants-projects.vercel.app/

# Local development
npm run dev
# App runs on http://localhost:3000
```

### 2. Test Accounts Needed
Create these accounts in Supabase or through signup:

| Email | Role | Plan |
|-------|------|------|
| `test-free@example.com` | User | Free |
| `test-starter@example.com` | User | Starter |
| `test-pro@example.com` | User | Pro |
| `admin@example.com` | Admin | Pro + Admin flag |

---

## Test Matrix

### PHASE 1: Public Pages (Anonymous)

#### 1.1 Landing Page (`/`)
- [ ] Page loads without errors
- [ ] Hero section displays correctly
- [ ] URL input field is visible and functional
- [ ] "Analyze FREE" button is clickable
- [ ] "How It Works" section shows 3 steps
- [ ] Features grid displays 4 cards
- [ ] CTA section is visible
- [ ] Footer links work (Glossary, Privacy, Terms, Contact)
- [ ] Mobile responsive layout

#### 1.2 Pricing Page (`/pricing`)
- [ ] All 3 plans display (Free, Starter, Pro)
- [ ] Monthly/Annual toggle works
- [ ] Annual pricing shows ~17% discount
- [ ] Feature comparison table is complete
- [ ] "Get Started" buttons navigate correctly
- [ ] FAQ section is visible with 6 questions

#### 1.3 FAQ Page (`/faq`)
- [ ] Page renders correctly
- [ ] All FAQs are expandable/collapsible

#### 1.4 Glossary Page (`/glossary`)
- [ ] Terms are displayed
- [ ] Search/filter works (if implemented)

#### 1.5 Help Center (`/help`)
- [ ] Main help page loads
- [ ] Individual help articles load (`/help/[slug]`)

---

### PHASE 2: Authentication Flow

#### 2.1 Login Page (`/login`)
- [ ] Page renders with gradient background
- [ ] Email/password fields are functional
- [ ] "Sign In" submits form
- [ ] Error messages display on invalid credentials
- [ ] "Forgot password?" navigates to reset mode
- [ ] "Sign up" link switches to signup form
- [ ] "Back to Home" link works
- [ ] Terms/Privacy links are visible

#### 2.2 Signup Flow
- [ ] Full name field appears
- [ ] Email validation works
- [ ] Password minimum length enforced (6 chars)
- [ ] Signup creates account
- [ ] "Check your email" message appears
- [ ] Verification email is sent

#### 2.3 Email Verification (`/auth/verify-email`)
- [ ] Page handles verification token
- [ ] Success message on valid token
- [ ] Error message on invalid/expired token
- [ ] Redirect to dashboard after verification

#### 2.4 Password Reset
- [ ] `/auth/reset-password` page loads
- [ ] Email input for reset request
- [ ] Reset email is sent
- [ ] Reset link works
- [ ] New password can be set

---

### PHASE 3: Free User Experience

#### 3.1 Dashboard (`/dashboard`)
- [ ] Dashboard loads after login
- [ ] User profile info displays
- [ ] Usage counter shows (0/3 analyses)
- [ ] "Start Analysis" CTA is visible
- [ ] Recent analyses list (empty initially)

#### 3.2 Analysis Flow
- [ ] Enter URL on landing page
- [ ] Analysis starts with loading screen
- [ ] Progress stages animate:
  - Extracting brand information
  - Generating queries
  - Querying AI providers
  - Analyzing responses
  - Generating recommendations
- [ ] Results page loads (`/results/[id]`)

#### 3.3 Results Page (`/results/[id]`)
- [ ] AI Perception Score displays (0-100)
- [ ] Score gauge visualization works
- [ ] Category breakdown shows:
  - Visibility score
  - Sentiment score
  - Authority score
  - Relevance score
- [ ] Provider breakdown (OpenAI, Anthropic only for free)
- [ ] Recommendations section displays
- [ ] Share button works
- [ ] "Analyze Another" button works
- [ ] Upgrade prompts appear for locked features

#### 3.4 Usage Limits
- [ ] Run 3 analyses
- [ ] Usage counter updates to 3/3
- [ ] 4th analysis shows limit reached message
- [ ] Upgrade prompt appears

---

### PHASE 4: Paid User Features (Starter/Pro)

#### 4.1 Checkout Flow
- [ ] Click "Upgrade" on pricing page
- [ ] Stripe checkout loads
- [ ] Test card: `4242 4242 4242 4242`
- [ ] Payment succeeds
- [ ] Redirect to `/billing/success`
- [ ] Confetti animation plays
- [ ] Features list animates in
- [ ] Auto-redirect to dashboard

#### 4.2 Billing Portal (`/api/billing/portal`)
- [ ] Opens Stripe customer portal
- [ ] Can view invoices
- [ ] Can update payment method
- [ ] Can cancel subscription

#### 4.3 Starter Plan Features
- [ ] 100 analyses available
- [ ] 4 AI providers (OpenAI, Anthropic, Google, Perplexity)
- [ ] 3 competitor tracking
- [ ] PDF export works
- [ ] CSV export works
- [ ] 90-day history retention

#### 4.4 Pro Plan Features
- [ ] 500 analyses available
- [ ] 10 competitor tracking
- [ ] JSON export works
- [ ] API access enabled (`/api/v1/analyze`)
- [ ] Priority support badge visible

---

### PHASE 5: Admin Panel

#### 5.1 Admin Access
- [ ] Non-admin users cannot access `/admin/*`
- [ ] Admin users see sidebar navigation
- [ ] Keyboard shortcuts work (Cmd+K, Cmd+B, Cmd+1-9)

#### 5.2 CEO Dashboard (`/admin/ceo`)
- [ ] Key metrics display:
  - Total users
  - Revenue (MRR)
  - Active analyses
  - Conversion rate
- [ ] Charts render correctly
- [ ] Date range selector works

#### 5.3 Finance Dashboard (`/admin/finance`)
- [ ] Revenue metrics display
- [ ] Runway calculator shows
- [ ] Expense breakdown visible
- [ ] Financial projections chart

#### 5.4 Operations (`/admin/ops`)
- [ ] System health indicators
- [ ] Active jobs count
- [ ] Error rate metrics
- [ ] Automation rate tracking

#### 5.5 Health Dashboard (`/admin/health`)
- [ ] All systems status (green/yellow/red)
- [ ] Database status
- [ ] API latency metrics
- [ ] Cron job status

#### 5.6 Costs Dashboard (`/admin/costs`)
- [ ] AI provider costs breakdown
- [ ] Cost per analysis metric
- [ ] Budget alerts
- [ ] Cost projections

#### 5.7 Queues (`/admin/queues`)
- [ ] Queue status display
- [ ] Job counts
- [ ] Failed jobs list
- [ ] Retry functionality

#### 5.8 Vendors (`/admin/vendors`)
- [ ] Vendor list display
- [ ] Status indicators
- [ ] Risk scores

#### 5.9 Feature Flags (`/admin/feature-flags`)
- [ ] Flag list displays
- [ ] Toggle on/off works
- [ ] Percentage rollout visible

#### 5.10 RLHF Corrections (`/admin/rlhf/corrections`)
- [ ] Pending corrections queue
- [ ] Approve/reject workflow
- [ ] Correction history

#### 5.11 RLHF Calibration (`/admin/rlhf/calibration`)
- [ ] Calibration metrics
- [ ] Model accuracy scores
- [ ] Adjustment controls

#### 5.12 Notifications (`/admin/notifications`)
- [ ] Notification list
- [ ] Mark as read
- [ ] Filter by type

#### 5.13 Audit Log (`/admin/audit`)
- [ ] Action log displays
- [ ] Filter by user/action
- [ ] Export audit log

#### 5.14 Data Quality (`/admin/data-quality`)
- [ ] Data quality scores
- [ ] Anomaly detection
- [ ] Quality trends

#### 5.15 API Playground (`/admin/api-playground`)
- [ ] API endpoint selector
- [ ] Request builder
- [ ] Response viewer

#### 5.16 Cron Jobs (`/admin/cron`)
- [ ] Cron job list
- [ ] Last run status
- [ ] Manual trigger option

#### 5.17 Semantic Audit (`/admin/semantic-audit`)
- [ ] Semantic analysis results
- [ ] Entity extraction review
- [ ] Quality metrics

---

### PHASE 6: API Endpoints

#### 6.1 Health Endpoints
```bash
# Basic health
curl https://[DOMAIN]/api/health

# Deep health check
curl https://[DOMAIN]/api/health/deep
```
- [ ] Returns 200 OK
- [ ] JSON response with status

#### 6.2 Analysis API
```bash
# Start analysis (requires auth)
curl -X POST https://[DOMAIN]/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```
- [ ] Returns analysisId
- [ ] Progress endpoint works (`/api/analyze/progress/[id]`)

#### 6.3 V1 API (Pro only)
```bash
curl -X POST https://[DOMAIN]/api/v1/analyze \
  -H "Authorization: Bearer [API_KEY]" \
  -d '{"url": "https://example.com"}'
```
- [ ] Returns 401 for non-Pro users
- [ ] Works for Pro users with API key

#### 6.4 Billing Endpoints
- [ ] `/api/billing/checkout` - Creates checkout session
- [ ] `/api/billing/portal` - Opens customer portal
- [ ] `/api/billing/subscription` - Returns subscription status
- [ ] `/api/billing/webhook` - Handles Stripe webhooks

#### 6.5 OpenAPI Spec
```bash
# JSON format
curl https://[DOMAIN]/api/openapi

# YAML format
curl https://[DOMAIN]/api/openapi?format=yaml
```

---

### PHASE 7: SEO & Programmatic Pages

#### 7.1 AI Perception Pages
- [ ] `/ai-perception/[industry]` loads
- [ ] `/ai-perception/[industry]/[city]` loads
- [ ] Meta tags are correct
- [ ] Schema.org markup present

#### 7.2 SEO Files
- [ ] `/robots.txt` accessible
- [ ] `/sitemap.xml` generates correctly

#### 7.3 OpenGraph Images
- [ ] `/results/[id]` generates OG image
- [ ] Badge endpoint works (`/api/badge/[brandId]`)

---

### PHASE 8: Settings & Preferences

#### 8.1 Notification Settings (`/settings/notifications`)
- [ ] Email preferences toggles
- [ ] Alert frequency selector
- [ ] Save changes works

---

### PHASE 9: Cron Jobs (Background)

Verify in Vercel logs or `/admin/cron`:

- [ ] `monitor` - Cron monitoring
- [ ] `detect-drift` - AI drift detection
- [ ] `enforce-retention` - Data retention
- [ ] `mine-preference-pairs` - RLHF data mining
- [ ] `rlhf-report` - RLHF reporting

---

## Quick Smoke Test Checklist

Run this 5-minute test before each release:

1. [ ] Landing page loads
2. [ ] Can sign up new user
3. [ ] Can log in
4. [ ] Can run analysis
5. [ ] Results page displays
6. [ ] Admin dashboard loads (admin user)
7. [ ] `/api/health` returns 200

---

## Bug Report Template

When finding issues, document:

```markdown
**Page/Feature:**
**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**

**Actual Behavior:**

**Browser/Device:**

**Screenshots:**

**Console Errors:**
```

---

## Test Data

### Test URLs for Analysis
- `https://stripe.com` - Well-known fintech
- `https://openai.com` - AI company (high scores)
- `https://example.com` - Generic (low scores)
- `https://your-domain.com` - Your own site

### Test Credit Cards (Stripe)
| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Insufficient funds |

---

## Performance Benchmarks

| Metric | Target | Acceptable |
|--------|--------|------------|
| Landing page load | < 2s | < 3s |
| Analysis start | < 1s | < 2s |
| Full analysis | < 30s | < 60s |
| Results page load | < 1s | < 2s |
| Admin dashboard | < 2s | < 4s |

---

## Contact

For issues or questions:
- Technical: Check `/admin/health`
- Billing: Stripe Dashboard
- Users: Supabase Dashboard
