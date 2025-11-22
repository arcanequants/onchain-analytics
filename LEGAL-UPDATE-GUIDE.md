# 📋 Legal Documents Update Guide
**Quick Reference for Future Feature Releases**

---

## 🎯 When to Update Legal Documents

Update Privacy Policy and Terms of Service when implementing:
- ✅ New data collection methods
- ✅ New third-party services/APIs
- ✅ New user features (auth, payments, subscriptions)
- ✅ New analytics or tracking
- ✅ Changes to data retention policies
- ✅ New jurisdictions or compliance requirements

---

## 📝 Update Checklist Template

### Before Adding New Feature:
```
[ ] Does it collect new user data?
[ ] Does it use third-party services?
[ ] Does it involve payments/transactions?
[ ] Does it change how we process data?
[ ] Does it add new legal risks?

If YES to any → Update legal docs BEFORE launch
```

---

## 📂 File Locations

```
Legal Documents:
├── src/app/privacy/page.tsx    → Privacy Policy
├── src/app/terms/page.tsx      → Terms of Service
│
Legal Components:
├── src/components/Footer.tsx   → Global footer with legal links
├── src/components/CookieBanner.tsx → Cookie consent
├── src/app/login/page.tsx      → Legal consent on login
└── src/components/UserMenu.tsx → Legal links in user dropdown
```

---

## 🔄 Common Update Scenarios

### Scenario 1: User Authentication (Week 4)
**Estimated Time:** 10 minutes

**Privacy Policy Updates:**
```typescript
// Add to Section 5: How We Use Your Information
- Session Management & Authentication
  * JWT tokens for authentication (stored in httpOnly cookies)
  * Session expiration: 7 days (rolling refresh)
  * IP address logging for security monitoring
  * Failed login attempt tracking (max 5 attempts)
```

**Terms Updates:**
```typescript
// Add to Section 3.2: Account Registration
- Session Security:
  * Sessions expire after 7 days of inactivity
  * You are responsible for logging out on shared devices
  * We may terminate sessions if suspicious activity detected
```

---

### Scenario 2: Stripe Payment Integration (Week 5-6)
**Estimated Time:** 15 minutes

**Privacy Policy Updates:**
```typescript
// Update Section 6.1: Service Providers
- Payment Processing: Stripe, Inc. (PCI DSS Level 1 compliant)
  * We do NOT store credit card numbers, CVV, or full PANs
  * Stripe collects: billing name, address, ZIP code, last 4 digits
  * Stripe Privacy Policy: https://stripe.com/privacy
  * Stripe processes payments in accordance with PCI DSS requirements

// Add to Section 8: Data Retention
- Billing Records: 7 years (IRS/HMRC tax compliance)
- Payment Metadata: 10 years (fraud prevention, chargebacks)
```

**Terms Updates:**
```typescript
// Update Section 6.2: Payment Processing
By providing payment information, you:
- Authorize Stripe to process payments on our behalf
- Agree to Stripe's Terms of Service: https://stripe.com/legal
- Confirm payment method is valid and has sufficient funds
- Accept responsibility for all charges and fees

// Add to Section 6: Payment Terms
Chargebacks/Disputes:
- Fraudulent chargebacks will result in immediate account termination
- You must contact support BEFORE initiating chargeback
- Chargeback fees ($15 USD) will be charged to your account
```

---

### Scenario 3: New Third-Party API Integration
**Estimated Time:** 5-10 minutes per API

**Privacy Policy Template:**
```typescript
// Add to Section 3.3: Information from Third-Party Sources
- [API Name]: [Brief description]
  * Data collected: [List specific data points]
  * Privacy Policy: [Link to API provider's privacy policy]
  * Data usage: [How we use this data]
  * Data retention: [How long we keep it]
```

**Example (Alchemy API):**
```typescript
- Alchemy (Blockchain Node Provider):
  * Data collected: Public blockchain data (transactions, balances, NFTs)
  * Privacy Policy: https://www.alchemy.com/policies/privacy-policy
  * Data usage: Real-time blockchain analytics and wallet tracking
  * Data retention: 30 days (API request logs), indefinite (public blockchain data)
```

---

### Scenario 4: New Analytics/Tracking Tool
**Estimated Time:** 8 minutes

**Privacy Policy Updates:**
```typescript
// Add to Section 10.2: Performance & Analytics Cookies
- [Tool Name] ([Purpose])
  * Cookies: [List cookie names]
  * Data collected: [e.g., page views, session duration, user flows]
  * Retention: [e.g., 14 months]
  * Opt-out: [Link to opt-out mechanism]
```

**Cookie Banner Update:**
```typescript
// Update src/components/CookieBanner.tsx
// Add new checkbox in preferences section:
<div className="cookie-preference-item">
  <label className="cookie-preference-label">
    <input
      type="checkbox"
      checked={preferences.[newTool]}
      onChange={(e) =>
        setPreferences({ ...preferences, [newTool]: e.target.checked })
      }
    />
    <span className="cookie-preference-name">[Tool Name]</span>
    <span className="cookie-preference-desc">
      [Brief description of what it does]
    </span>
  </label>
</div>
```

---

### Scenario 5: Email Marketing/Newsletters
**Estimated Time:** 10 minutes

**Privacy Policy Updates:**
```typescript
// Add to Section 5: How We Use Your Information
- Marketing Communications (with consent):
  * Product updates and feature announcements
  * Educational content and best practices
  * Special offers and promotions (opt-in required)
  * Frequency: Maximum 1 email per week
  * Opt-out: Unsubscribe link in every email

// Add to Section 3.1: Information You Provide
- Email Preferences:
  * Marketing consent status (opt-in/opt-out)
  * Email open rates and click-through rates (via SendGrid)
  * Unsubscribe history
```

**Terms Updates:**
```typescript
// Add to Section 5: Acceptable Use
- Email Communications:
  * You consent to receive transactional emails (required)
  * Marketing emails require explicit opt-in consent
  * You may unsubscribe anytime via email footer link
  * Unsubscribe requests processed within 48 hours
```

---

## 🚨 High-Risk Features (Require Extra Attention)

### 1. AI/ML Features with User Data
**Legal Considerations:**
- GDPR Article 22: Automated decision-making rights
- Explain how AI models work (transparency)
- Right to human review of AI decisions
- Bias and fairness disclosures

**Update Template:**
```typescript
// Privacy Policy - Add new Section
Section X: Artificial Intelligence and Machine Learning

We use AI/ML models to [describe purpose]. These models:
- Do NOT make automated decisions with legal/significant effects
- Process data: [list data types used for training/inference]
- Model providers: [e.g., OpenAI, Anthropic]
- You have the right to opt-out of AI processing (contact privacy@)

// Terms - Add disclaimer
Section 7.X: AI-Generated Content Disclaimer

AI-GENERATED PREDICTIONS, RECOMMENDATIONS, AND ANALYTICS ARE PROVIDED "AS IS"
WITHOUT WARRANTY. We are not responsible for AI errors, hallucinations, or
inaccurate predictions. Always verify AI-generated information independently.
```

### 2. User-Generated Content (Forums, Comments, Reviews)
**Legal Considerations:**
- DMCA takedown procedures (17 U.S.C. §512)
- Content moderation policies
- User liability for posted content
- Right to remove content

### 3. Cryptocurrency Custody/Wallets
**Legal Considerations:**
- NOT A CUSTODIAN disclaimer (critical)
- Key management warnings
- FinCEN MSB registration (if applicable)
- State money transmitter licenses

---

## 🎨 Formatting Standards

### Section Numbering:
```
Privacy Policy:
- Current: Sections 1-14
- Next available: Section 15

Terms of Service:
- Current: Sections 1-19
- Next available: Section 20
```

### Warning Box Template (Critical Disclaimers):
```typescript
<div style={{
  background: 'rgba(220, 38, 38, 0.1)',
  border: '2px solid rgba(220, 38, 38, 0.4)',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '20px'
}}>
  <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#fca5a5', fontWeight: '700' }}>
    ⚠️ CRITICAL: [HEADLINE IN CAPS]
  </p>
  <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
    [Detailed warning text...]
  </p>
</div>
```

### Info Box Template (Important Information):
```typescript
<div style={{
  background: 'rgba(102, 126, 234, 0.1)',
  border: '1px solid rgba(102, 126, 234, 0.3)',
  borderRadius: '8px',
  padding: '20px'
}}>
  <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
    <strong>[Title]:</strong> [Content]
  </p>
</div>
```

---

## ⚡ Quick Update Workflow

```bash
# 1. Create feature branch
git checkout -b legal/[feature-name]

# 2. Update legal documents
vim src/app/privacy/page.tsx
vim src/app/terms/page.tsx

# 3. Update "Last Updated" date and version
# Privacy Policy: Line 52-58
# Terms: Line 54-60

# 4. Test build
npm run build

# 5. Commit with detailed message
git add src/app/privacy/page.tsx src/app/terms/page.tsx
git commit -m "legal: Update for [feature-name]

- Privacy Policy: [what changed]
- Terms: [what changed]
- Compliance: [GDPR/CCPA/other]
"

# 6. Push and merge
git push origin legal/[feature-name]
```

---

## 📊 Current Legal Coverage Status

| Feature | Privacy Policy | Terms | Status |
|---------|---------------|-------|--------|
| Sports Betting Analytics | ✅ Section 3.4 | ✅ Section 7.5 | 100% |
| AI Event Analytics | ✅ Section 5 | ✅ Section 7.1 | 100% |
| Blockchain Data | ✅ Section 3.3 | ✅ Section 2 | 100% |
| OAuth (Google/GitHub) | ✅ Section 3.1 | ✅ Section 3.2 | 100% |
| Google Analytics 4 | ✅ Section 10.2 | ✅ Section 7.2 | 100% |
| Sentry Error Tracking | ✅ Section 3.2 | ✅ Section 7.2 | 100% |
| **User Auth (Week 4)** | ⚠️ 90% | ⚠️ 90% | **10 min update needed** |
| **Stripe (Week 5-6)** | ⚠️ 85% | ⚠️ 85% | **15 min update needed** |

---

## 🔍 Review Checklist Before Publishing

```
Legal Updates Pre-Publish Checklist:
[ ] Updated "Last Updated" date in both files
[ ] Incremented version number (if major changes)
[ ] Spell-checked all new content
[ ] Verified all third-party links work
[ ] Checked section numbering is sequential
[ ] Ensured consistent formatting (indentation, colors)
[ ] Added to Table of Contents (if new section)
[ ] Tested on mobile (responsive layout)
[ ] Ran `npm run build` successfully
[ ] Reviewed for typos/grammar
[ ] Confirmed legal accuracy (if uncertain, consult lawyer)
[ ] Updated LEGAL-UPDATE-GUIDE.md if new pattern
```

---

## 📞 When to Consult a Lawyer

**Consult legal counsel if:**
- ❗ Entering new jurisdictions (EU, CA, UK, etc.)
- ❗ Collecting children's data (<13 years old)
- ❗ Handling health/medical data (HIPAA)
- ❗ Processing biometric data (facial recognition, fingerprints)
- ❗ Providing financial advice or investment services
- ❗ Becoming a cryptocurrency custodian
- ❗ Handling payment processing directly (not via Stripe)
- ❗ Receiving legal notices, subpoenas, or GDPR complaints
- ❗ Class action lawsuit threats
- ❗ Regulatory inquiries (SEC, FTC, CFPB, etc.)

**Emergency Legal Contact:**
- Email: legal@vectorialdata.com
- For GDPR/Privacy: dpo@vectorialdata.com

---

## 🎓 Best Practices

### 1. Update BEFORE Launch (Not After)
```
❌ BAD:  Launch feature → Wait for complaints → Update legal docs
✅ GOOD: Draft legal updates → Review → Launch feature with coverage
```

### 2. Version Control for Legal Docs
```bash
# Tag major legal updates
git tag -a legal-v1.1 -m "Added Stripe payment processing terms"
git push origin legal-v1.1
```

### 3. Keep a Legal Changelog
```markdown
## Legal Changelog

### v1.1 - 2025-01-21
- Added Section 3.4: Sports Betting Analytics Data
- Added Section 7.5: Sports Betting Disclaimers
- Updated effective date to January 21, 2025

### v1.0 - 2025-01-01
- Initial Privacy Policy and Terms of Service
- GDPR/CCPA compliant baseline
```

### 4. User Notification for Material Changes
```typescript
// If material changes, notify users 30 days in advance:
- Email to all registered users
- In-app banner notification
- Homepage prominent notice
- Update "Last Updated" date
```

---

## 🚀 Future-Proofing Tips

1. **Over-Disclose Rather Than Under-Disclose**
   - Better to list a data point you might collect than miss one

2. **Use Broad Language Where Appropriate**
   - "Analytics providers" instead of "Google Analytics only"
   - Allows adding new tools without full rewrite

3. **Maintain Flexibility in Disclaimers**
   - "We may use..." instead of "We use..."
   - Provides room for future features

4. **Link to Third-Party Policies**
   - Don't copy their terms (they change)
   - Link to source of truth

5. **Document Your Decisions**
   - Why did you word something a certain way?
   - Future you will thank past you

---

## 📚 Resources

### Legal Templates & Guides
- GDPR Official Text: https://gdpr-info.eu/
- CCPA Official Text: https://oag.ca.gov/privacy/ccpa
- Stripe Legal Docs: https://stripe.com/legal
- Google Analytics Legal: https://support.google.com/analytics/answer/7318509

### Compliance Checkers
- GDPR Checklist: https://gdpr.eu/checklist/
- CCPA Compliance Guide: https://www.oag.ca.gov/privacy/ccpa/compliance

### Legal Databases
- Case Law (US): https://scholar.google.com/
- EU Case Law: https://curia.europa.eu/

---

## 🎯 Success Metrics

**Legal Compliance Goals:**
- ✅ Zero GDPR complaints (0 in 12 months)
- ✅ Zero CCPA complaints (0 in 12 months)
- ✅ 100% legal coverage for active features
- ✅ Updates published BEFORE feature launch
- ✅ User notification for material changes (30 days advance)
- ✅ Annual legal review by qualified attorney

---

**Last Updated:** January 21, 2025
**Version:** 1.0
**Maintained By:** Legal & Compliance Team
**Questions:** legal@vectorialdata.com

---

💡 **Pro Tip:** Bookmark this guide! You'll need it for Week 4 (Auth) and Week 5-6 (Stripe).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
