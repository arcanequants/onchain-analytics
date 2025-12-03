# AI Perception User Guide

**Version**: 1.0.0
**Last Updated**: 2025-12-01

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding Your AI Perception Score](#understanding-your-ai-perception-score)
3. [Dashboard Overview](#dashboard-overview)
4. [Running an Analysis](#running-an-analysis)
5. [Interpreting Results](#interpreting-results)
6. [Recommendations](#recommendations)
7. [Monitoring](#monitoring)
8. [Account & Billing](#account--billing)
9. [API Access](#api-access)
10. [FAQ](#faq)

---

## Getting Started

### What is AI Perception?

AI Perception analyzes how AI assistants like ChatGPT, Claude, Gemini, and Perplexity perceive and recommend your brand. As more users rely on AI for product recommendations, understanding your AI visibility is crucial for business growth.

### Quick Start

1. **Enter your website URL** on the homepage
2. **Wait for analysis** (typically 30-60 seconds)
3. **Review your score** and recommendations
4. **Take action** on improvement suggestions

### Account Types

| Plan | Analyses | Monitoring | Features |
|------|----------|------------|----------|
| Free | 3/month | None | Basic score |
| Starter | 25/month | 1 URL | Full breakdown |
| Pro | 100/month | 10 URLs | Competitor analysis |
| Enterprise | Unlimited | Unlimited | API access, custom |

---

## Understanding Your AI Perception Score

### The 0-100 Scale

Your AI Perception Score reflects how well AI models understand and recommend your brand:

| Score Range | Rating | Meaning |
|-------------|--------|---------|
| 90-100 | Excellent | AI models strongly recommend you |
| 70-89 | Good | Regularly mentioned, room to improve |
| 50-69 | Fair | Inconsistent AI recognition |
| 30-49 | Poor | Rarely mentioned by AI |
| 0-29 | Critical | AI doesn't know your brand |

### Score Components

Your overall score is calculated from four dimensions:

1. **Recognition (25%)**: Does AI know your brand exists?
2. **Accuracy (25%)**: Is AI's information about you correct?
3. **Sentiment (25%)**: Does AI speak positively about you?
4. **Recommendation (25%)**: Does AI suggest you to users?

### Per-Provider Breakdown

We analyze your perception across:

- **ChatGPT (OpenAI)**: The most widely used AI assistant
- **Claude (Anthropic)**: Known for thoughtful, nuanced responses
- **Gemini (Google)**: Integrated with Google's knowledge graph
- **Perplexity**: AI-powered search engine

---

## Dashboard Overview

### Main Dashboard

After signing in, your dashboard shows:

- **Overall Score**: Your current AI Perception Score
- **Score Trend**: How your score has changed over time
- **Recent Analyses**: History of your brand analyses
- **Active Monitors**: URLs being tracked for changes
- **Recommendations**: Prioritized action items

### Navigation

- **Dashboard**: Overview and quick actions
- **Analyses**: Detailed analysis history
- **Monitoring**: Score change alerts
- **Competitors**: Compare against competitors
- **Settings**: Account and preferences

---

## Running an Analysis

### Basic Analysis

1. Click "New Analysis" or enter URL in search box
2. Ensure URL is your official website (e.g., `https://yourcompany.com`)
3. Click "Analyze"
4. Wait for all AI providers to respond

### Analysis Options

- **Include competitors**: Automatically detect and analyze competitors
- **Deep analysis**: Extended prompts for more detailed insights
- **Priority queue**: Faster processing (Pro/Enterprise)

### What We Analyze

For each AI provider, we ask:

1. What do you know about [Brand]?
2. Would you recommend [Brand] for [Industry use case]?
3. How does [Brand] compare to competitors?
4. What are [Brand]'s strengths and weaknesses?

---

## Interpreting Results

### Score Card

Each analysis shows:

- **Overall Score**: Combined score across all providers
- **Provider Scores**: Individual scores from each AI
- **Confidence Level**: How certain we are about the score
- **Score Change**: Comparison to previous analysis

### AI Response Analysis

For each provider, we show:

- **What AI Said**: Actual AI response (summarized)
- **Key Facts Mentioned**: Facts AI stated about your brand
- **Sentiment Analysis**: Positive, neutral, or negative tone
- **Competitors Mentioned**: Other brands AI brought up
- **Hallucinations**: Incorrect information detected

### Hallucination Detection

We flag when AI says something incorrect about your brand:

- **Factual Errors**: Wrong founding year, location, products
- **Outdated Info**: Old leadership, discontinued products
- **Confusion**: Mixing you up with similarly-named brands
- **Fabrication**: Made-up awards, partnerships, claims

---

## Recommendations

### Priority Levels

Recommendations are tagged by urgency:

- **Critical**: Address immediately (hallucinations, negative sentiment)
- **High**: Significant impact on score
- **Medium**: Moderate improvements
- **Low**: Nice-to-have optimizations

### Recommendation Categories

1. **Structured Data**: Add Schema.org markup to your website
2. **Content**: Create AI-readable content about your brand
3. **Authority**: Build citations and backlinks
4. **Freshness**: Keep information current
5. **Clarification**: Address AI confusion points

### Taking Action

For each recommendation:

1. Read the specific suggestion
2. Understand the expected impact
3. Implement the change
4. Re-analyze after 2-4 weeks
5. Track score improvement

---

## Monitoring

### Setting Up Monitors

1. Go to Monitoring > Add Monitor
2. Enter the URL to track
3. Set alert thresholds (e.g., alert if score drops >5 points)
4. Choose notification preferences

### Alert Types

- **Score Drop**: Significant decrease in perception score
- **Score Increase**: Improvement worth celebrating
- **New Hallucination**: AI started saying something incorrect
- **Competitor Change**: Competitor's score changed significantly

### Notification Channels

- **Email**: Daily/weekly digest or instant alerts
- **Dashboard**: In-app notification center
- **Webhook**: (Enterprise) Send to Slack, Teams, or custom endpoint

---

## Account & Billing

### Managing Your Account

1. Go to Settings > Account
2. Update profile information
3. Manage team members (Pro/Enterprise)
4. Configure preferences

### Billing

1. Go to Settings > Billing
2. View current plan and usage
3. Upgrade or downgrade plan
4. Update payment method
5. Download invoices

### Upgrading

When you hit plan limits:

1. You'll see an upgrade prompt
2. Choose your new plan
3. Existing data is preserved
4. Pro-rated billing applies

---

## API Access

### Getting API Keys

(Enterprise plan only)

1. Go to Settings > API
2. Click "Create API Key"
3. Name your key and set permissions
4. Copy and securely store the key

### API Endpoints

```
POST /api/v1/analyze
GET  /api/v1/analysis/{id}
GET  /api/v1/analyses
POST /api/v1/monitor
GET  /api/v1/monitors
```

### Rate Limits

| Plan | Requests/min | Requests/day |
|------|--------------|--------------|
| Enterprise | 60 | 10,000 |
| Partner | 120 | 50,000 |

### Webhooks

Configure webhooks to receive:

- Analysis completed
- Score changed
- Alert triggered
- Monitor status

See [API Documentation](/docs/api) for full details.

---

## FAQ

### General

**Q: How often should I analyze my brand?**
A: We recommend monthly analyses for most brands, weekly for fast-changing industries.

**Q: How long does an analysis take?**
A: Typically 30-60 seconds. Complex analyses may take up to 2 minutes.

**Q: Can I analyze competitors?**
A: Yes, with Starter plan and above. We auto-detect competitors or you can specify them.

### Scoring

**Q: Why is my score different across providers?**
A: Each AI model has different training data and knowledge. Variations of 10-20 points are normal.

**Q: My score dropped. What happened?**
A: Common causes: AI model updates, competitor improvements, negative press, outdated information.

**Q: Can I improve my score quickly?**
A: Some changes (structured data) show results in weeks. Others (authority) take months.

### Technical

**Q: Do you store AI responses?**
A: Yes, for your analysis history. We don't share your data with others.

**Q: Is my website data secure?**
A: Yes, we use encryption in transit and at rest. See our [Privacy Policy](/privacy).

**Q: What if AI hallucinates about my brand?**
A: We detect and flag hallucinations. Follow our recommendations to provide accurate information.

### Billing

**Q: Can I get a refund?**
A: Yes, within 14 days of purchase. Contact support@aiperception.io.

**Q: Do unused analyses roll over?**
A: No, analysis credits reset monthly.

**Q: Is there an annual discount?**
A: Yes, save 20% with annual billing.

---

## Getting Help

- **Help Center**: [/help](/help) - Searchable knowledge base
- **Email**: support@aiperception.io
- **Live Chat**: Available on Pro and Enterprise plans
- **Status Page**: [status.aiperception.io](https://status.aiperception.io)

---

## Glossary

| Term | Definition |
|------|------------|
| AI Perception | How AI assistants understand and recommend your brand |
| Hallucination | When AI states incorrect information as fact |
| Share of Voice | Your brand's mentions relative to competitors |
| GEO | Generative Engine Optimization - optimizing for AI recommendations |
| E-E-A-T | Experience, Expertise, Authoritativeness, Trust |

---

*Last updated: December 2025*
