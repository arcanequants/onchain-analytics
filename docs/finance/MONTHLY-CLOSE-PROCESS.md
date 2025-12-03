# Monthly Close Process

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Active |
| Owner | CFO / Controller |
| Created | December 2024 |
| Target | Close by 8th of month |

---

## 1. Executive Summary

This document defines AI Perception's monthly financial close process. The goal is to produce accurate, complete financial statements by the 8th business day of each month.

### Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Close completion | Day 8 | Day 10 (estimated) |
| Error rate | <1% | Baseline needed |
| Adjustments post-close | <3 | Baseline needed |
| Reconciliation accuracy | 100% | Baseline needed |

---

## 2. Close Calendar

### 2.1 Standard Timeline

| Day | Activities | Owner |
|-----|------------|-------|
| Day 1 | Cut-off, begin data collection | Controller |
| Day 2 | Revenue recognition | Controller |
| Day 3 | Expense accruals | Controller |
| Day 4 | Account reconciliations | Controller |
| Day 5 | Journal entries | Controller |
| Day 6 | Management review | CFO |
| Day 7 | Final adjustments | Controller |
| Day 8 | Close books, reports | CFO |

### 2.2 Calendar Template

```
Month: [MONTH YEAR]

Week 1 of Month:
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │  1  │  2  │  3  │  4  │  5  │  6  │
│     │ D1  │ D2  │ D3  │ D4  │ D5  │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  7  │  8  │  9  │ 10  │ 11  │ 12  │ 13  │
│     │ D6  │ D7  │ D8  │     │     │     │
│     │     │     │CLOSE│     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

D1: Cut-off & Data Collection
D2: Revenue Recognition
D3: Expense Accruals
D4: Reconciliations
D5: Journal Entries
D6: Management Review
D7: Final Adjustments
D8: Books Closed
```

---

## 3. Pre-Close Preparation (Day -3 to -1)

### 3.1 Pre-Close Checklist

| Task | Owner | Due |
|------|-------|-----|
| Confirm all invoices sent | Controller | Day -3 |
| Verify payment processing complete | Controller | Day -2 |
| Collect vendor invoices | Controller | Day -1 |
| Confirm payroll processed | Controller | Day -1 |
| Review pending transactions | Controller | Day -1 |
| Notify team of cut-off | Controller | Day -1 |

### 3.2 Cut-off Procedures

**Revenue Cut-off:**
- All subscription activations through month-end
- API usage metered through 11:59 PM UTC
- One-time purchases through month-end

**Expense Cut-off:**
- All approved expenses through month-end
- Credit card transactions through statement date
- Vendor invoices dated through month-end

---

## 4. Day-by-Day Close Procedures

### 4.1 Day 1: Cut-off & Data Collection

**Duration:** 4 hours

#### Tasks:

- [ ] **Pull Stripe revenue data**
  ```sql
  SELECT
    DATE_TRUNC('month', created_at) as month,
    SUM(amount) as total_revenue,
    COUNT(*) as transaction_count
  FROM stripe_transactions
  WHERE created_at >= '[MONTH_START]'
    AND created_at < '[MONTH_END]'
    AND status = 'succeeded'
  GROUP BY DATE_TRUNC('month', created_at);
  ```

- [ ] **Export bank statements**
  - Download PDF statements
  - Export CSV transactions
  - Reconcile ending balance

- [ ] **Collect expense reports**
  - Team credit cards
  - Reimbursement requests
  - Vendor invoices

- [ ] **Pull system usage data**
  - API calls by tier
  - AI query counts
  - Infrastructure costs

#### Deliverables:
- [ ] Stripe export file
- [ ] Bank statement PDFs
- [ ] Expense summary spreadsheet
- [ ] Usage metrics report

### 4.2 Day 2: Revenue Recognition

**Duration:** 4 hours

#### Tasks:

- [ ] **Subscription revenue**
  ```
  For each subscription:
  1. Identify billing period
  2. Calculate daily rate = Monthly fee / Days in month
  3. Recognize revenue for days in period
  4. Defer remainder to following month
  ```

- [ ] **Usage-based revenue**
  - API overage charges
  - Enterprise usage fees
  - One-time query packs

- [ ] **Deferred revenue adjustment**
  ```
  DR: Cash/AR
  CR: Deferred Revenue (new signups, annual prepay)

  DR: Deferred Revenue (recognized portion)
  CR: Revenue
  ```

- [ ] **Revenue reconciliation**
  - Stripe payments → Revenue recognized
  - Identify discrepancies
  - Document adjustments

#### Deliverables:
- [ ] Revenue recognition schedule
- [ ] Deferred revenue rollforward
- [ ] Revenue reconciliation

### 4.3 Day 3: Expense Accruals

**Duration:** 4 hours

#### Tasks:

- [ ] **Recurring expense accruals**

  | Expense | Amount | Accrual Method |
  |---------|--------|----------------|
  | Salaries | $XX,XXX | Full month |
  | Benefits | $X,XXX | Estimated 20% of salary |
  | Rent | $X,XXX | Full month |
  | Insurance | $XXX | 1/12 annual |
  | Software | $X,XXX | Per vendor |

- [ ] **Variable expense accruals**

  | Expense | Source | Calculation |
  |---------|--------|-------------|
  | OpenAI API | Usage logs | Actual usage × rate |
  | Anthropic API | Usage logs | Actual usage × rate |
  | Vercel hosting | Dashboard | Actual charges |
  | Supabase | Dashboard | Actual charges |

- [ ] **Prepaid expense amortization**
  - Annual subscriptions → 1/12 monthly
  - Insurance → 1/12 monthly
  - Domain registrations → 1/12 monthly

- [ ] **Accrual journal entries**
  ```
  DR: [Expense Account]
  CR: Accrued Liabilities

  DR: Prepaid Expenses (new)
  CR: Cash

  DR: [Expense Account]
  CR: Prepaid Expenses (amortization)
  ```

#### Deliverables:
- [ ] Accrual schedule
- [ ] Prepaid expense rollforward
- [ ] Accrued liabilities schedule

### 4.4 Day 4: Account Reconciliations

**Duration:** 6 hours

#### Tasks:

- [ ] **Cash reconciliation**

  | Account | Book Balance | Bank Balance | Difference |
  |---------|--------------|--------------|------------|
  | Operating | $XXX,XXX | $XXX,XXX | $X,XXX |
  | Payroll | $XX,XXX | $XX,XXX | $XXX |

  Reconciling items:
  - Outstanding checks
  - Deposits in transit
  - Bank fees not recorded
  - Interest not recorded

- [ ] **Accounts receivable reconciliation**
  - Customer balances vs Stripe
  - Aging schedule
  - Bad debt assessment

- [ ] **Accounts payable reconciliation**
  - Vendor balances vs invoices
  - Aging schedule
  - Unrecorded liabilities

- [ ] **Intercompany reconciliation** (if applicable)
  - Eliminate intercompany balances
  - Confirm matching entries

- [ ] **Fixed asset reconciliation**
  - Asset additions
  - Disposals
  - Depreciation calculation

#### Deliverables:
- [ ] Bank reconciliation(s)
- [ ] AR aging report
- [ ] AP aging report
- [ ] Fixed asset schedule

### 4.5 Day 5: Journal Entries

**Duration:** 4 hours

#### Tasks:

- [ ] **Standard recurring entries**

  | Entry | Description | Amount |
  |-------|-------------|--------|
  | JE-001 | Depreciation | $X,XXX |
  | JE-002 | Prepaid amortization | $X,XXX |
  | JE-003 | Accrued expenses | $X,XXX |
  | JE-004 | Deferred revenue release | $X,XXX |

- [ ] **Adjusting entries**
  - Error corrections
  - Reclassifications
  - Accrual true-ups

- [ ] **Entry documentation**
  Each journal entry requires:
  - Entry number
  - Date
  - Description
  - Accounts and amounts
  - Supporting documentation
  - Preparer
  - Approver

- [ ] **Post entries to GL**
  - Input all entries
  - Verify balances
  - Run trial balance

#### Deliverables:
- [ ] Journal entry listing
- [ ] Supporting documentation
- [ ] Preliminary trial balance

### 4.6 Day 6: Management Review

**Duration:** 3 hours

#### Tasks:

- [ ] **CFO review of trial balance**
  - Compare to prior month
  - Compare to budget
  - Investigate variances >10%

- [ ] **Variance analysis**

  | Account | Actual | Budget | Variance | % | Explanation |
  |---------|--------|--------|----------|---|-------------|
  | Revenue | $XX,XXX | $XX,XXX | $X,XXX | X% | [Reason] |
  | COGS | $X,XXX | $X,XXX | $XXX | X% | [Reason] |
  | ... | ... | ... | ... | ... | ... |

- [ ] **Review key metrics**
  - MRR vs target
  - Gross margin %
  - Burn rate
  - Runway

- [ ] **Identify issues**
  - Missing accruals
  - Unusual transactions
  - Classification errors

#### Deliverables:
- [ ] CFO review notes
- [ ] Variance analysis
- [ ] Adjustment requests (if any)

### 4.7 Day 7: Final Adjustments

**Duration:** 3 hours

#### Tasks:

- [ ] **Process adjustment entries**
  - From management review
  - Error corrections
  - Final accrual updates

- [ ] **Final reconciliation check**
  - All reconciliations signed off
  - All entries posted
  - Trial balance clean

- [ ] **Prepare financial statements**
  - Income statement
  - Balance sheet
  - Cash flow statement

- [ ] **Final review**
  - Statements tie to trial balance
  - Prior period comparisons correct
  - Notes accurate

#### Deliverables:
- [ ] Final adjusting entries
- [ ] Draft financial statements
- [ ] Statement package for approval

### 4.8 Day 8: Close Books

**Duration:** 2 hours

#### Tasks:

- [ ] **Final CFO approval**
  - Review statement package
  - Sign off on financials
  - Approve for distribution

- [ ] **Lock period**
  - Close month in accounting system
  - Prevent further postings
  - Archive supporting documents

- [ ] **Distribute reports**
  - Board package
  - Investor update (if applicable)
  - Internal dashboards

- [ ] **Close checklist signoff**
  - All items complete
  - All reconciliations approved
  - Documentation filed

#### Deliverables:
- [ ] Approved financial statements
- [ ] Signed close checklist
- [ ] Board/investor reports

---

## 5. Financial Statement Package

### 5.1 Income Statement Template

```
AI PERCEPTION, INC.
INCOME STATEMENT
For the Month Ended [MONTH] [YEAR]

                                    Month        YTD         Budget
                                    -------      -------     -------
REVENUE
  Subscription Revenue              $XX,XXX      $XXX,XXX    $XXX,XXX
  API/Usage Revenue                 $X,XXX       $XX,XXX     $XX,XXX
  Enterprise Revenue                $XX,XXX      $XX,XXX     $XX,XXX
                                    -------      -------     -------
TOTAL REVENUE                       $XX,XXX      $XXX,XXX    $XXX,XXX

COST OF REVENUE
  AI API Costs (OpenAI/Anthropic)   $X,XXX       $XX,XXX     $XX,XXX
  Infrastructure (Hosting)          $X,XXX       $XX,XXX     $XX,XXX
  Data Costs                        $XXX         $X,XXX      $X,XXX
                                    -------      -------     -------
TOTAL COST OF REVENUE               $X,XXX       $XX,XXX     $XX,XXX
                                    -------      -------     -------
GROSS PROFIT                        $XX,XXX      $XXX,XXX    $XXX,XXX
  Gross Margin %                    XX%          XX%         XX%

OPERATING EXPENSES
  Research & Development            $XX,XXX      $XXX,XXX    $XXX,XXX
  Sales & Marketing                 $X,XXX       $XX,XXX     $XX,XXX
  General & Administrative          $X,XXX       $XX,XXX     $XX,XXX
                                    -------      -------     -------
TOTAL OPERATING EXPENSES            $XX,XXX      $XXX,XXX    $XXX,XXX
                                    -------      -------     -------
OPERATING INCOME (LOSS)             $(X,XXX)     $(XX,XXX)   $(XX,XXX)

Other Income (Expense)
  Interest Income                   $XXX         $X,XXX      $X,XXX
  Interest Expense                  $(XXX)       $(X,XXX)    $(X,XXX)
                                    -------      -------     -------
NET INCOME (LOSS)                   $(X,XXX)     $(XX,XXX)   $(XX,XXX)
```

### 5.2 Balance Sheet Template

```
AI PERCEPTION, INC.
BALANCE SHEET
As of [MONTH] [YEAR]

                                    Current      Prior       Change
                                    Month        Month
ASSETS                              -------      -------     -------
Current Assets
  Cash and Cash Equivalents         $XXX,XXX     $XXX,XXX    $X,XXX
  Accounts Receivable               $XX,XXX      $XX,XXX     $X,XXX
  Prepaid Expenses                  $X,XXX       $X,XXX      $XXX
                                    -------      -------
Total Current Assets                $XXX,XXX     $XXX,XXX

Fixed Assets
  Property & Equipment              $X,XXX       $X,XXX
  Less: Accumulated Depreciation    $(X,XXX)     $(X,XXX)
                                    -------      -------
Net Fixed Assets                    $X,XXX       $X,XXX

Other Assets
  Security Deposits                 $X,XXX       $X,XXX
                                    -------      -------
TOTAL ASSETS                        $XXX,XXX     $XXX,XXX


LIABILITIES AND EQUITY
Current Liabilities
  Accounts Payable                  $X,XXX       $X,XXX
  Accrued Expenses                  $X,XXX       $X,XXX
  Deferred Revenue                  $XX,XXX      $XX,XXX
                                    -------      -------
Total Current Liabilities           $XX,XXX      $XX,XXX

Long-Term Liabilities               $-           $-

Stockholders' Equity
  Common Stock                      $X,XXX       $X,XXX
  Additional Paid-In Capital        $XXX,XXX     $XXX,XXX
  Retained Earnings (Deficit)       $(XX,XXX)    $(XX,XXX)
  Current Period Net Income (Loss)  $(X,XXX)     $(X,XXX)
                                    -------      -------
Total Stockholders' Equity          $XXX,XXX     $XXX,XXX
                                    -------      -------
TOTAL LIABILITIES AND EQUITY        $XXX,XXX     $XXX,XXX
```

### 5.3 Key Metrics Summary

```
AI PERCEPTION, INC.
KEY METRICS SUMMARY
For the Month Ended [MONTH] [YEAR]

REVENUE METRICS
                            Month       YTD         Target
MRR                         $XX,XXX     $XX,XXX     $XX,XXX
ARR (Annualized)           $XXX,XXX    $XXX,XXX    $XXX,XXX
MRR Growth (MoM)           X.X%        X.X%        X.X%
New MRR                    $X,XXX      $XX,XXX     $XX,XXX
Churned MRR                $(X,XXX)    $(XX,XXX)   $(X,XXX)
Net MRR Change             $X,XXX      $XX,XXX     $XX,XXX

CUSTOMER METRICS
Total Customers            X,XXX       X,XXX       X,XXX
New Customers              XXX         X,XXX       X,XXX
Churned Customers          XX          XXX         XXX
Net Customer Change        XXX         XXX         XXX
ARPU                       $XX.XX      $XX.XX      $XX.XX

EFFICIENCY METRICS
Gross Margin               XX.X%       XX.X%       XX.X%
Operating Margin           (XX.X%)     (XX.X%)     (XX.X%)
Burn Rate                  $XX,XXX     $XX,XXX     $XX,XXX
Runway (months)            XX          XX          XX

UNIT ECONOMICS
CAC                        $XXX        $XXX        $XXX
LTV                        $X,XXX      $X,XXX      $X,XXX
LTV:CAC                    X.X:1       X.X:1       X.X:1
```

---

## 6. Controls & Approvals

### 6.1 Control Matrix

| Control | Description | Owner | Frequency |
|---------|-------------|-------|-----------|
| Bank reconciliation | All accounts reconciled | Controller | Monthly |
| Revenue recognition | Stripe-to-GL reconciliation | Controller | Monthly |
| Expense approval | All expenses >$500 approved | CFO | As incurred |
| Journal entry | All JEs reviewed and approved | CFO | Monthly |
| Trial balance | Management review | CFO | Monthly |
| Financial statements | Board approval | Board | Quarterly |

### 6.2 Approval Matrix

| Amount | Approver |
|--------|----------|
| <$500 | Controller |
| $500-$5,000 | CFO |
| $5,000-$25,000 | CFO + CEO |
| >$25,000 | Board |

### 6.3 Segregation of Duties

| Function | Primary | Secondary |
|----------|---------|-----------|
| Record transactions | Controller | - |
| Approve transactions | CFO | CEO |
| Reconcile accounts | Controller | External accountant |
| Review financials | CFO | Board |

---

## 7. Automation & Tools

### 7.1 Accounting Stack

| Function | Tool | Integration |
|----------|------|-------------|
| General ledger | QuickBooks Online / Xero | Primary |
| Revenue | Stripe | Auto-sync |
| Expenses | Ramp / Brex | Auto-sync |
| Payroll | Gusto / Rippling | Auto-sync |
| Reporting | Excel / Sheets | Manual |

### 7.2 Automation Opportunities

| Process | Current | Automated |
|---------|---------|-----------|
| Stripe revenue sync | Manual export | API sync daily |
| Expense categorization | Manual | ML categorization |
| Bank feeds | Manual import | Auto-fetch |
| Recurring entries | Manual input | Scheduled posts |
| Report generation | Manual | Template auto-fill |

---

## 8. Troubleshooting

### 8.1 Common Issues

| Issue | Cause | Resolution |
|-------|-------|------------|
| Books don't balance | Entry error | Review recent entries |
| Bank rec won't balance | Timing difference | Check outstanding items |
| Revenue mismatch | Recognition timing | Review deferred schedule |
| Missing expense | Late invoice | Add to accruals |

### 8.2 Escalation Path

1. Controller investigates
2. Controller consults CFO
3. CFO reviews with external accountant
4. CFO reports to Board if material

---

## 9. Compliance Requirements

### 9.1 GAAP Compliance

- Revenue recognition per ASC 606
- Expense recognition per matching principle
- Asset depreciation per ASC 360
- Lease accounting per ASC 842 (if applicable)

### 9.2 Tax Compliance

- Sales tax collection/remittance
- Estimated tax payments (quarterly)
- Annual filings
- 1099 reporting

### 9.3 Audit Readiness

Maintain for each month:
- [ ] All journal entries with support
- [ ] All reconciliations with signoffs
- [ ] Approved financial statements
- [ ] Key metric calculations
- [ ] Variance explanations

---

## 10. Continuous Improvement

### 10.1 Monthly Retrospective

After each close:
- What went well?
- What delayed close?
- What errors occurred?
- What can be automated?

### 10.2 Quarterly Goals

| Quarter | Focus |
|---------|-------|
| Q1 2025 | Establish baseline, document process |
| Q2 2025 | Reduce close to Day 6 |
| Q3 2025 | Automate recurring entries |
| Q4 2025 | Full automation, Day 5 close |

---

## Appendix A: Close Checklist Template

```markdown
# Monthly Close Checklist - [MONTH YEAR]

## Pre-Close (Days -3 to -1)
- [ ] Invoices sent
- [ ] Payments processed
- [ ] Vendor invoices collected
- [ ] Payroll confirmed
- [ ] Cut-off notice sent

## Day 1: Data Collection
- [ ] Stripe export
- [ ] Bank statements
- [ ] Expense reports
- [ ] Usage data

## Day 2: Revenue
- [ ] Subscription revenue calculated
- [ ] Usage revenue calculated
- [ ] Deferred revenue adjusted
- [ ] Revenue reconciled

## Day 3: Expenses
- [ ] Recurring accruals posted
- [ ] Variable accruals posted
- [ ] Prepaids amortized
- [ ] Expense entries posted

## Day 4: Reconciliations
- [ ] Cash reconciled
- [ ] AR reconciled
- [ ] AP reconciled
- [ ] Fixed assets reconciled

## Day 5: Journal Entries
- [ ] Standard entries posted
- [ ] Adjusting entries posted
- [ ] All entries documented
- [ ] Trial balance run

## Day 6: Review
- [ ] CFO review complete
- [ ] Variance analysis done
- [ ] Issues identified
- [ ] Adjustments requested

## Day 7: Adjustments
- [ ] Adjustment entries posted
- [ ] Final reconciliation check
- [ ] Statements prepared
- [ ] Package reviewed

## Day 8: Close
- [ ] CFO approval obtained
- [ ] Period locked
- [ ] Reports distributed
- [ ] Documentation filed

Prepared by: _________________ Date: _________
Approved by: _________________ Date: _________
```

## Appendix B: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | CFO | Initial process |
