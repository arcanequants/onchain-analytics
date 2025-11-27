# AI Perception - UX Writing Style Guide

> Phase 1, Week 1, Day 1
> Based on EXECUTIVE-ROADMAP-BCG.md Section 2.31

This document defines the voice, tone, and terminology standards for all user-facing content in the AI Perception product.

---

## Table of Contents

1. [Brand Voice](#brand-voice)
2. [Tone by Context](#tone-by-context)
3. [Terminology Standards](#terminology-standards)
4. [Writing Rules](#writing-rules)
5. [Error Messages](#error-messages)
6. [Loading States](#loading-states)
7. [Empty States](#empty-states)
8. [Upgrade Prompts](#upgrade-prompts)
9. [Core Glossary Terms](#core-glossary-terms)

---

## Brand Voice

Our voice is consistent across all touchpoints. We are:

| Attribute | What It Means | Example |
|-----------|---------------|---------|
| **Confident but not arrogant** | We know our stuff, but we don't talk down to users | "Your score indicates strong AI visibility" (not "We've determined...") |
| **Expert but accessible** | We explain complex concepts simply | "AI models recommend brands they trust" (not "LLM output correlation...") |
| **Helpful but not hand-holding** | We guide without patronizing | "Add Schema.org markup to your site" (not "Schema.org is a type of code...") |
| **Data-driven but human** | Numbers matter, but so does empathy | "Your score improved 12 points!" (not "Metric delta: +12") |
| **Empowering, not alarming** | Even bad news focuses on solutions | "Room to grow" (not "Poor performance") |

---

## Tone by Context

Our tone adapts to the situation while maintaining our core voice:

| Context | Tone | Example |
|---------|------|---------|
| **Landing page** | Inspiring, bold, clear | "Discover how AI sees your brand" |
| **Loading states** | Engaging, educational, patient | "Asking ChatGPT about your industry..." |
| **Results** | Objective, encouraging, actionable | "Your score: 67. Here's how to reach 80+" |
| **Errors** | Empathetic, helpful, solution-focused | "We couldn't analyze that URL. Try a different page." |
| **Upgrade prompts** | Value-focused, not pushy | "Unlock competitor tracking" (not "Upgrade now!") |
| **Emails** | Personal, concise, actionable | "Your score changed. Here's what happened." |
| **Documentation** | Clear, thorough, practical | Step-by-step with examples |

---

## Terminology Standards

### Use These Terms

| Preferred Term | Avoid | Reason |
|----------------|-------|--------|
| **AI Perception Score** | rating, rank, grade | Our branded, unique metric |
| **analysis** | scan, audit, check | Implies depth and intelligence |
| **AI models** | bots, machines, algorithms | Humanizes the technology |
| **recommendations** | fixes, problems, issues | Focuses on action, not blame |
| **improve** | fix, repair, correct | Implies growth, not brokenness |
| **your brand** | your website, your company | Holistic, not just technical |
| **mentioned** | found, detected, indexed | Natural language about AI responses |
| **recommended** | selected, chosen, preferred | Implies endorsement |

### Provider Names

Always use proper names when referring to AI providers:

| Use | Avoid |
|-----|-------|
| ChatGPT | OpenAI's chatbot, GPT |
| Claude | Anthropic's AI |
| Gemini | Google's AI |
| Perplexity | Perplexity AI |

### Score Levels

Use these labels consistently:

| Score Range | Label | Description |
|-------------|-------|-------------|
| 80-100 | **Excellent** | Your brand has exceptional AI visibility |
| 60-79 | **Good** | Your brand has strong AI visibility with room for improvement |
| 40-59 | **Average** | Your brand has moderate AI visibility |
| 20-39 | **Needs Improvement** | Your brand has limited AI visibility |
| 0-19 | **Critical** | Your brand has very low AI visibility |

---

## Writing Rules

### 1. Lead with the benefit, not the feature

```
BAD:  "We query 4 AI providers"
GOOD: "See how ChatGPT, Claude & more perceive you"

BAD:  "Our algorithm analyzes structured data"
GOOD: "Understand what makes AI trust your brand"
```

### 2. Use "you/your" not "users/they"

```
BAD:  "Users can view their score"
GOOD: "View your score"

BAD:  "The user's brand is analyzed"
GOOD: "Your brand is analyzed"
```

### 3. Prefer active voice

```
BAD:  "Your score was calculated"
GOOD: "We calculated your score"

BAD:  "An analysis will be performed"
GOOD: "We'll analyze your brand"
```

### 4. Be specific with numbers

```
BAD:  "Improve your AI visibility"
GOOD: "Increase your score from 45 to 70+"

BAD:  "Get more recommendations"
GOOD: "Get recommended 3x more often"
```

### 5. One idea per sentence

```
BAD:  "Enter your URL and we'll analyze how AI models perceive your
      brand using ChatGPT, Claude, Gemini and Perplexity to give
      you a comprehensive score."

GOOD: "Enter your URL. We'll ask AI models about your brand.
      Get your score in 30 seconds."
```

### 6. Front-load important information

```
BAD:  "After completing our analysis process, your score will be 67"
GOOD: "Your score: 67"

BAD:  "Due to rate limits, we need to wait before analyzing"
GOOD: "Please wait 30 seconds. We're managing API limits."
```

### 7. Use sentence case for UI elements

```
BAD:  "View Full Analysis Report"
GOOD: "View full analysis report"

Exception: Proper nouns (ChatGPT, AI Perception Score)
```

---

## Error Messages

Every error message should include:

1. **What happened** (brief, non-technical)
2. **Why it happened** (if helpful)
3. **What to do next** (actionable)

### Error Message Template

```
[Title]: Brief description of the problem
[Description]: Why this happened and what the user can do

Example:
Title: "Couldn't analyze this URL"
Description: "The site may be blocking our analysis. Try your homepage
instead, or contact us if this continues."
```

### Error Message Examples

| Situation | Message |
|-----------|---------|
| Invalid URL | "This doesn't look like a valid URL. Try entering a complete address like https://example.com" |
| Site unreachable | "We couldn't reach this website. Check the URL and try again." |
| Rate limited | "You've reached the free tier limit. Upgrade or try again in 1 hour." |
| AI provider down | "ChatGPT is temporarily unavailable. Your score may be partial." |
| Network error | "Connection lost. Check your internet and try again." |
| Server error | "Something went wrong on our end. We're looking into it." |

### Error Tone Guidelines

- Never blame the user
- Avoid technical jargon (don't say "API error" or "500 response")
- Always provide a next step
- Be empathetic but brief

---

## Loading States

Loading states are an opportunity to educate and engage users.

### Progress Messages

Use progressive messages that tell users what's happening:

```
Step 1: "Analyzing your website..."
Step 2: "Asking ChatGPT about your industry..."
Step 3: "Checking Claude's recommendations..."
Step 4: "Analyzing how you compare to competitors..."
Step 5: "Calculating your AI Perception Score..."
```

### Loading Tips

Show one tip at a time during analysis:

```
"Did you know? Brands in Wikidata get recommended 40% more often."
"Tip: Adding Schema.org markup can improve your score by 10+ points."
"Fun fact: ChatGPT answers over 100M queries about product recommendations daily."
```

### Time Expectations

Always set expectations:

```
"This usually takes about 30 seconds"
"Almost there... finishing up the analysis"
"Taking longer than usual. Hang tight!"
```

---

## Empty States

When there's no data to show, guide users to take action.

### Empty State Template

```
[Illustration or Icon]
[Headline]: What this section is for
[Description]: Brief explanation
[CTA Button]: Action to populate this section
```

### Examples

| Section | Headline | Description | CTA |
|---------|----------|-------------|-----|
| No analyses yet | "Your first analysis awaits" | "Enter a URL to see how AI models perceive any brand" | "Analyze a brand" |
| No competitors | "Track your competition" | "Add competitors to see how you compare" | "Add competitors" |
| No history | "History builds over time" | "Your past analyses will appear here" | "Run an analysis" |

---

## Upgrade Prompts

Upgrade prompts should be value-focused, not pushy.

### Principles

1. Explain the value, not the feature
2. Show what they're missing, not what they can't do
3. Use soft language ("unlock", "get access") not hard ("you must", "required")

### Examples

```
BAD:  "Upgrade to Pro - $29/month"
GOOD: "Unlock competitor tracking and weekly reports"

BAD:  "You've hit your limit. Upgrade now."
GOOD: "You've used your 3 free analyses. Upgrade for unlimited access."

BAD:  "This feature requires Pro"
GOOD: "Track competitors with Pro"
```

### Upgrade Prompt Contexts

| Context | Prompt |
|---------|--------|
| Free limit reached | "You've analyzed 3 brands this month. Upgrade for unlimited analyses." |
| Premium feature | "Historical tracking shows how your score changes over time." |
| Competitor teaser | "See how you compare to [Competitor]. Available with Pro." |
| Report export | "Download this report as PDF. Available with Pro." |

---

## Core Glossary Terms

These terms must be explained to users, either via tooltips or a glossary page.

### AI Perception Score (0-100)

**Definition:** A measurement of how likely AI assistants like ChatGPT and Claude are to recommend your brand when users ask about your industry.

**Tooltip:** "Based on mentions, recommendations, and sentiment across multiple AI models."

### GEO (Generative Engine Optimization)

**Definition:** The practice of optimizing your brand's presence for AI models, similar to SEO for search engines.

**Tooltip:** "Like SEO, but for ChatGPT instead of Google."

### Share of Voice (SOV)

**Definition:** The percentage of times your brand is mentioned vs competitors when AI discusses your industry.

**Tooltip:** "If AI mentions your industry 10 times and you're mentioned 3 times, your SOV is 30%."

### E-E-A-T

**Definition:** Experience, Expertise, Authoritativeness, Trust. Google's quality framework that AI models also use.

**Tooltip:** "Signals that tell AI your brand is trustworthy."

### Hallucination

**Definition:** When an AI model states something incorrect about your brand (wrong products, location, etc.)

**Tooltip:** "AI 'made up' information about you."

### Knowledge Graph

**Definition:** Structured databases like Wikidata that AI models use as trusted sources of information.

**Tooltip:** "Being in Wikidata = AI trusts you more."

---

## Quick Reference Card

### Do
- Use "you" and "your"
- Lead with benefits
- Be specific with numbers
- Provide next steps in errors
- Use our branded terms

### Don't
- Use technical jargon
- Blame the user
- Be vague about time/progress
- Use passive voice
- Create anxiety about low scores

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-01 | Initial UX Writing Guide |

---

*This document is part of the AI Perception Engineering Agency documentation.*
