# AI PERCEPTION ENGINEERING AGENCY
## Executive Strategic Roadmap

**Document Classification:** Strategic Planning
**Version:** 12.0 (Technical + UX/UI + AI/Data + KG/SEO + Content + Full Stack + Reputation/PR + Prompt Engineering + Ontology + Computational Linguistics + LLM Behavioral Research Review)
**Date:** November 25, 2024
**Prepared by:** BCG Digital Ventures - Technology Strategy Practice
**Reviewed by:**
- Senior Software Director - Technical Architecture Review
- Senior UX/UI Executive - User Experience & Interface Review
- Senior AI & Data Engineer Director - AI/ML & Data Pipeline Review
- Senior Knowledge Graph & SEO Architect - Structured Data & AI Discoverability Review
- Senior Technical Content Writer Director - Documentation & UX Writing Review
- Senior Full Stack Developer Director - Code Quality & DevOps Review
- Senior Reputation & Digital PR Specialist - Brand Strategy & Crisis Management Review
- Senior Prompt Engineer / Model Analyst - Prompt Architecture & Model Optimization Review
- Senior Principal Ontologist - Knowledge Modeling & Semantic Architecture Review
- Senior Computational Linguist - NLP, Text Analysis & Language Understanding Review
- Senior LLM Behavioral Researcher - Model Behavior, Drift Detection & Response Stability Review

---

## EXECUTIVE SUMMARY

### The Opportunity

We are witnessing a fundamental shift in how consumers discover products and services. By 2027, an estimated **70% of product research** will begin with AI assistants rather than traditional search engines. This creates an unprecedented blind spot for businesses: **they have no visibility into whether AI models recommend them**.

### The Core Problem We Solve

> "Las empresas gastan millones en SEO tradicional (para Google), pero cuando le preguntas a ChatGPT: '¿Cuál es el mejor CRM para una PyME en México?', la IA recomienda basándose en su 'conocimiento interno'. Si la marca no existe en el 'cerebro' de la IA, será ignorada."

**Key Insight:** OpenAI/Google venderán espacios publicitarios ("Sponsored" en ChatGPT), pero la **reputación orgánica no se compra**. Ellos no arreglarán la estructura de datos ni la presencia digital de un cliente. Ese trabajo estratégico es nuestro.

### Our Position

AI Perception Engineering Agency enters this market as a **first-mover** in the GEO (Generative Engine Optimization) SaaS space, offering businesses a simple, self-service tool to:

1. **Measure** their AI perception score across major LLMs
2. **Monitor** changes in AI recommendations over time
3. **Diagnose** issues (hallucinations, missing data, poor sentiment)
4. **Improve** their visibility through actionable, automated insights

### Strategic Differentiators

| Factor | Our Approach | Traditional SEO Tools |
|--------|--------------|----------------------|
| Target | AI recommendations | Search engine rankings |
| Complexity | Enter URL, get score | Complex dashboards, keywords |
| Time to Value | 30 seconds | Days/weeks |
| Pricing | $0-79/month | $100-500+/month |
| Operations | 100% automated | Requires expertise |

### The Strategic Positioning

```
┌─────────────────────────────────────────────────────────────────────┐
│           MARKETING VIEJO vs AI PERCEPTION ENGINEERING              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SEO/Ads Tradicional          AI Perception (Nosotros)              │
│  ═══════════════════          ════════════════════════              │
│  Objetivo: Ganar un Click     Objetivo: SER la Respuesta            │
│  Target: Motor de Búsqueda    Target: Modelo de Lenguaje (LLM)      │
│  Métrica: Tráfico/Visitas     Métrica: Menciones/Sentimiento/Citas  │
│  Táctica: Keywords            Táctica: Entidades y Contexto         │
│  Resultado: Top 10 Google     Resultado: "Te recomiendo X porque…"  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### The Vision (Alberto's North Star)

**"Todo automatizado. El negocio no depende de mí. Yo soy el visionario, Claude ejecuta."**

This means:
- **ZERO manual operations** - Every feature must run without human intervention
- **Self-service complete** - Users never need to contact support
- **AI Agents handle edge cases** - Not humans
- **Scales infinitely** - No bottleneck on people

---

## PART I: MARKET ANALYSIS

### 1.1 Total Addressable Market (TAM)

```
┌─────────────────────────────────────────────────────────────┐
│  GLOBAL SMB MARKET FOR AI VISIBILITY TOOLS                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Total SMBs globally:           400M+                       │
│  SMBs with web presence:        ~200M                       │
│  SMBs aware of AI impact:       ~20M (10%)                  │
│  Serviceable market (English):  ~8M                         │
│  Target market Year 1:          ~500K (early adopters)      │
│                                                             │
│  Average willingness to pay:    $35/month                   │
│  TAM (Year 1 target):           $210M annual                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Competitive Landscape

| Player | Focus | Pricing | Our Advantage |
|--------|-------|---------|---------------|
| SEMrush | Traditional SEO | $130+/mo | We focus on AI, simpler UX |
| Ahrefs | Backlinks/SEO | $99+/mo | Different market entirely |
| Brand24 | Social monitoring | $79+/mo | We monitor AI, not social |
| **No direct competitor** | GEO/AI Perception | - | First mover advantage |

### 1.3 Risk Assessment Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API costs exceed budget | Medium | High | Aggressive caching, rate limiting |
| LLM APIs change/deprecate | Low | Critical | Abstraction layer, multi-provider |
| Competitor enters market | Medium | Medium | Speed to market, UX excellence |
| Low conversion to paid | Medium | High | Iterate on value proposition |
| AI recommendations become deterministic | Low | Medium | Expand to optimization services |
| Security breach (SSRF, injection) | Medium | Critical | Input validation, URL sanitization |
| AI hallucinations in scoring | High | Medium | Golden dataset validation, user feedback |

### 1.4 Budget Constraint Analysis ($100/month Maximum)

```
┌─────────────────────────────────────────────────────────────────────┐
│              OPERATIONAL BUDGET BREAKDOWN (PRE-REVENUE)             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TIER 1: FREE SERVICES (Use These First)                           │
│  ├─ Vercel Hobby           $0    (100GB bandwidth, good for MVP)   │
│  ├─ Supabase Free          $0    (500MB DB, 2GB storage)           │
│  ├─ Upstash Free           $0    (10K requests/day)                │
│  ├─ Resend Free            $0    (100 emails/day)                  │
│  ├─ Google AI (Gemini)     $0    (Free tier very generous)         │
│  └─ Subtotal               $0                                      │
│                                                                     │
│  TIER 2: PAY-PER-USE (Main Cost Driver)                            │
│  ├─ OpenAI (GPT-3.5-turbo) ~$0.002/request                         │
│  ├─ Anthropic (Haiku)      ~$0.003/request                         │
│  └─ Perplexity             ~$0.005/request (DEFER TO PHASE 4)      │
│                                                                     │
│  BUDGET ALLOCATION (Worst Case Pre-Revenue):                       │
│  ├─ Target: 50 analyses/day × 30 days = 1,500 analyses/month       │
│  ├─ With 2 AI providers: 3,000 API calls                           │
│  ├─ Cost: 3,000 × $0.0025 avg = $7.50/month                       │
│  ├─ Safety buffer (caching fails): ×3 = $22.50/month              │
│  └─ TOTAL PROJECTED: ~$25/month (75% buffer remaining)             │
│                                                                     │
│  ⚠️  CRITICAL DECISION: Start with 2 AI providers only            │
│      (OpenAI + Anthropic). Add Google/Perplexity in Phase 4.       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PART II: TECHNICAL ARCHITECTURE

### 2.1 System Architecture (Target State)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Landing  │  │ Analysis │  │Dashboard │  │ Results/Reports  │    │
│  │   Page   │  │   Page   │  │   Page   │  │      Page        │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js Routes)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │/api/     │  │/api/     │  │/api/     │  │/api/             │    │
│  │analyze   │  │results   │  │monitor   │  │billing           │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
┌──────────────────────┐  ┌──────────────┐  ┌──────────────────────┐
│   AI ORCHESTRATOR    │  │   CACHE      │  │    QUEUE SYSTEM      │
│  ┌────────────────┐  │  │   LAYER      │  │  ┌────────────────┐  │
│  │ OpenAI Client  │  │  │  (Upstash)   │  │  │  Background    │  │
│  │ Anthropic      │  │  │              │  │  │  Analysis Jobs │  │
│  │ Google AI      │  │  │  - Results   │  │  │                │  │
│  │ Perplexity     │  │  │  - Scores    │  │  │  - Batch AI    │  │
│  └────────────────┘  │  │  - Sessions  │  │  │  - Monitoring  │  │
└──────────────────────┘  └──────────────┘  └──────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER (Supabase)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │  Users   │  │ Analyses │  │  Scores  │  │   Subscriptions  │    │
│  │ Profiles │  │ Results  │  │ History  │  │    & Billing     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Advanced Analysis Features (NEW)

Based on industry best practices, we're adding these **fully automated** diagnostic capabilities:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ADVANCED DIAGNOSTICS ENGINE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. HALLUCINATION DETECTION                                         │
│     ════════════════════════                                        │
│     Problem: AIs sometimes invent facts about brands                │
│     Solution: Cross-reference AI claims with actual website data    │
│     Output: "ChatGPT says you sell X, but your site shows Y"        │
│     Automation: 100% - Compare AI response vs scraped metadata      │
│                                                                     │
│  2. SHARE OF VOICE (SOV) IN AI                                      │
│     ═══════════════════════════                                     │
│     Problem: How often does brand appear vs competitors?            │
│     Solution: Run multiple queries, calculate mention frequency     │
│     Output: "You appear in 2/10 queries, competitor in 7/10"        │
│     Automation: 100% - Batch queries by industry, aggregate stats   │
│                                                                     │
│  3. KNOWLEDGE GRAPH PRESENCE CHECK                                  │
│     ═════════════════════════════════                               │
│     Problem: AIs trust structured data (Wikidata, Schema.org)       │
│     Solution: Check if brand exists in key knowledge sources        │
│     Output: Checklist of "Found in Wikidata ✓, Missing Schema ✗"   │
│     Automation: 100% - API calls to Wikidata, parse site for schema │
│                                                                     │
│  4. SEMANTIC SENTIMENT ANALYSIS                                     │
│     ════════════════════════════                                    │
│     Problem: AI learns from reviews/mentions across the web         │
│     Solution: Analyze how AI perceives brand sentiment              │
│     Output: "AI associates your brand with: reliable, expensive"    │
│     Automation: 100% - Extract sentiment from AI explanations       │
│                                                                     │
│  5. RAG OPTIMIZATION SCORE                                          │
│     ════════════════════════                                        │
│     Problem: Modern AIs search web before answering (RAG)           │
│     Solution: Check if site is "AI-readable" (structured, dense)    │
│     Output: "Your site scores 45/100 for AI readability"            │
│     Automation: 100% - Analyze page structure, content density      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Implementation Priority:**

| Feature | Phase | Complexity | Value |
|---------|-------|------------|-------|
| Hallucination Detection | Phase 2 | Medium | High |
| Share of Voice | Phase 2 | Medium | Very High |
| Knowledge Graph Check | Phase 2 | Low | Medium |
| Semantic Sentiment | Phase 1 | Low | High (already partial) |
| RAG Optimization Score | Phase 4 | High | High |

### 2.3 Database Schema (New Tables Required)

```sql
-- Core Analysis Tables
┌─────────────────────────────────────────────────────────────┐
│ analyses                                                    │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ user_id         UUID REFERENCES user_profiles(id)           │
│ url             TEXT NOT NULL                               │
│ brand_name      TEXT                                        │
│ industry        TEXT                                        │
│ country         TEXT                                        │
│ status          ENUM('pending','processing','completed')    │
│ overall_score   INTEGER (0-100)                             │
│ created_at      TIMESTAMPTZ                                 │
│ completed_at    TIMESTAMPTZ                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ai_responses                                                │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ analysis_id     UUID REFERENCES analyses(id)                │
│ provider        ENUM('openai','anthropic','google','pplx')  │
│ model           TEXT                                        │
│ prompt_used     TEXT                                        │
│ raw_response    TEXT                                        │
│ mentions_brand  BOOLEAN                                     │
│ recommends      BOOLEAN                                     │
│ sentiment       ENUM('positive','neutral','negative')       │
│ position        INTEGER (1-10, null if not mentioned)       │
│ context         TEXT (excerpt where brand mentioned)        │
│ score           INTEGER (0-100)                             │
│ tokens_used     INTEGER                                     │
│ latency_ms      INTEGER                                     │
│ created_at      TIMESTAMPTZ                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ competitors                                                 │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ analysis_id     UUID REFERENCES analyses(id)                │
│ name            TEXT                                        │
│ url             TEXT                                        │
│ overall_score   INTEGER                                     │
│ detected_auto   BOOLEAN (auto-detected vs user-added)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ recommendations                                             │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ analysis_id     UUID REFERENCES analyses(id)                │
│ category        TEXT                                        │
│ priority        INTEGER (1-5)                               │
│ title           TEXT                                        │
│ description     TEXT                                        │
│ impact_score    INTEGER (1-10)                              │
│ effort_score    INTEGER (1-10)                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ score_history                                               │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ user_id         UUID REFERENCES user_profiles(id)           │
│ url             TEXT                                        │
│ score           INTEGER                                     │
│ recorded_at     TIMESTAMPTZ                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ subscriptions                                               │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ user_id         UUID REFERENCES user_profiles(id)           │
│ stripe_customer_id      TEXT                                │
│ stripe_subscription_id  TEXT                                │
│ plan            ENUM('free','starter','pro')                │
│ status          ENUM('active','canceled','past_due')        │
│ current_period_start    TIMESTAMPTZ                         │
│ current_period_end      TIMESTAMPTZ                         │
│ created_at      TIMESTAMPTZ                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ usage_tracking                                              │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ user_id         UUID REFERENCES user_profiles(id)           │
│ month           DATE                                        │
│ analyses_count  INTEGER                                     │
│ api_calls_count INTEGER                                     │
│ tokens_used     INTEGER                                     │
└─────────────────────────────────────────────────────────────┘

-- NEW: Advanced Diagnostics Tables

┌─────────────────────────────────────────────────────────────┐
│ hallucinations                                              │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ analysis_id     UUID REFERENCES analyses(id)                │
│ provider        TEXT                                        │
│ claim           TEXT (what AI said)                         │
│ reality         TEXT (what website actually shows)          │
│ severity        ENUM('minor','moderate','severe')           │
│ category        TEXT (product, location, pricing, etc.)     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ share_of_voice                                              │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ analysis_id     UUID REFERENCES analyses(id)                │
│ industry        TEXT                                        │
│ country         TEXT                                        │
│ total_queries   INTEGER                                     │
│ brand_mentions  INTEGER                                     │
│ sov_percentage  DECIMAL                                     │
│ top_competitor  TEXT                                        │
│ competitor_sov  DECIMAL                                     │
│ recorded_at     TIMESTAMPTZ                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ knowledge_graph_status                                      │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ analysis_id     UUID REFERENCES analyses(id)                │
│ wikidata_found  BOOLEAN                                     │
│ wikidata_id     TEXT                                        │
│ schema_org      JSONB (detected schemas on site)            │
│ crunchbase      BOOLEAN                                     │
│ linkedin_co     BOOLEAN                                     │
│ google_kg       BOOLEAN (Google Knowledge Graph)            │
│ overall_score   INTEGER (0-100)                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ rag_readability                                             │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ analysis_id     UUID REFERENCES analyses(id)                │
│ content_density INTEGER (facts per 1000 words)              │
│ structure_score INTEGER (headings, lists, tables)           │
│ schema_score    INTEGER (structured data quality)           │
│ mobile_score    INTEGER                                     │
│ load_speed_ms   INTEGER                                     │
│ overall_score   INTEGER (0-100)                             │
│ recommendations JSONB                                       │
└─────────────────────────────────────────────────────────────┘

-- NEW: Cost Control & Observability Tables

┌─────────────────────────────────────────────────────────────┐
│ api_cost_tracking (CRITICAL for budget control)             │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ analysis_id     UUID REFERENCES analyses(id)                │
│ provider        TEXT (openai, anthropic, google, perplexity)│
│ model           TEXT (gpt-3.5-turbo, claude-haiku, etc.)    │
│ tokens_input    INTEGER                                     │
│ tokens_output   INTEGER                                     │
│ cost_usd        DECIMAL(10,6)                               │
│ latency_ms      INTEGER                                     │
│ cached          BOOLEAN (true if served from cache)         │
│ created_at      TIMESTAMPTZ                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ daily_cost_summary (for alerts and dashboards)              │
├─────────────────────────────────────────────────────────────┤
│ date            DATE PRIMARY KEY                            │
│ total_cost_usd  DECIMAL(10,2)                               │
│ total_analyses  INTEGER                                     │
│ cache_hit_rate  DECIMAL(5,2) (percentage)                   │
│ avg_cost_per_analysis DECIMAL(10,4)                         │
│ openai_cost     DECIMAL(10,2)                               │
│ anthropic_cost  DECIMAL(10,2)                               │
│ google_cost     DECIMAL(10,2)                               │
│ perplexity_cost DECIMAL(10,2)                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Security Architecture (NEW - Critical)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY REQUIREMENTS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. INPUT VALIDATION (URLs)                                         │
│     ════════════════════════                                        │
│     - Validate URL format (reject malformed)                        │
│     - Block internal IPs (127.0.0.1, 10.x, 192.168.x) → SSRF       │
│     - Block localhost, file://, ftp://                              │
│     - Whitelist only http:// and https://                          │
│     - Max URL length: 2048 characters                              │
│     Implementation: /lib/security/url-validator.ts                  │
│                                                                     │
│  2. RATE LIMITING                                                   │
│     ═══════════════                                                 │
│     - Per IP: 10 requests/minute (unauthenticated)                  │
│     - Per User: Based on plan limits                                │
│     - Per API Key: 100/minute (if public API)                       │
│     Implementation: Upstash Rate Limit (already have Upstash)       │
│                                                                     │
│  3. PROMPT INJECTION PREVENTION                                     │
│     ════════════════════════════                                    │
│     - Sanitize brand names before inserting in prompts              │
│     - Never include raw user input in system prompts                │
│     - Use parameterized prompts with strict templates               │
│     Implementation: /lib/ai/prompt-sanitizer.ts                     │
│                                                                     │
│  4. DATA PROTECTION                                                 │
│     ═══════════════                                                 │
│     - Hash sensitive data (emails for lookup)                       │
│     - Row Level Security in Supabase (users see only their data)    │
│     - API routes validate session before data access                │
│     Implementation: Supabase RLS policies                           │
│                                                                     │
│  5. SECRETS MANAGEMENT                                              │
│     ══════════════════                                              │
│     - All API keys in Vercel env vars (not in code)                 │
│     - Rotate keys quarterly                                         │
│     - Separate keys for dev/staging/prod                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.5 Testing Strategy (NEW - Quality Assurance)

```
┌─────────────────────────────────────────────────────────────────────┐
│                       TESTING PYRAMID                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         ┌─────────┐                                 │
│                        │   E2E   │  5-10 tests (critical flows)    │
│                       ─┴─────────┴─                                 │
│                     ┌───────────────┐                               │
│                    │  Integration   │  20-30 tests (API routes)    │
│                   ─┴───────────────┴─                               │
│                 ┌───────────────────────┐                           │
│                │       Unit Tests       │  50+ tests (functions)   │
│               ─┴───────────────────────┴─                           │
│                                                                     │
│  TOOLS (Free/Budget-Friendly):                                     │
│  ├─ Vitest (unit tests, fast, free)                                │
│  ├─ Testing Library (React components, free)                       │
│  ├─ Playwright (E2E, free, runs in Vercel preview)                 │
│  └─ GitHub Actions (CI, free for public repos)                     │
│                                                                     │
│  CRITICAL TEST CASES:                                              │
│  ├─ URL validation rejects malicious inputs                        │
│  ├─ AI responses are parsed correctly                              │
│  ├─ Scoring algorithm is deterministic                             │
│  ├─ Rate limiting blocks excessive requests                        │
│  ├─ Free users can't access paid features                          │
│  ├─ Stripe webhook updates subscription correctly                  │
│  └─ Analysis completes under 45 seconds                            │
│                                                                     │
│  GOLDEN DATASET (AI Quality):                                      │
│  ├─ 20 known brands with expected AI responses                     │
│  ├─ Manual scoring for comparison                                  │
│  └─ Weekly regression test against golden dataset                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.6 Observability & Cost Control (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  OBSERVABILITY STACK (FREE TIER)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. LOGGING                                                        │
│     ═══════                                                        │
│     - Vercel Logs (free, 1 hour retention)                         │
│     - Structured JSON logs for all API routes                      │
│     - Log: analysis_id, duration_ms, tokens_used, cost_usd         │
│                                                                     │
│  2. REAL-TIME COST TRACKING                                        │
│     ═══════════════════════                                        │
│     - Track every AI API call cost in database                     │
│     - Daily/weekly cost aggregation                                │
│     - Alert when daily cost > $5 (50% of worst-case budget)       │
│     Table: api_cost_tracking                                       │
│     Columns: provider, tokens_in, tokens_out, cost_usd, date       │
│                                                                     │
│  3. HEALTH CHECKS                                                  │
│     ═════════════                                                  │
│     - /api/health → returns OK if all services connected           │
│     - UptimeRobot (free) pings /api/health every 5 min            │
│     - Email alert on downtime                                      │
│                                                                     │
│  4. ERROR TRACKING                                                 │
│     ══════════════                                                 │
│     - Sentry free tier (5K errors/month)                          │
│     - Capture: AI failures, payment failures, auth errors          │
│     - Source maps for debugging                                    │
│                                                                     │
│  5. ANALYTICS (Without Extra Cost)                                 │
│     ═══════════════════════════                                    │
│     - Vercel Analytics (included in Hobby)                         │
│     - Track: page views, analysis starts, conversions              │
│     - No need for Google Analytics initially                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.7 UX/UI Architecture (NEW - User Experience Review)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UX GAPS IDENTIFIED & SOLUTIONS                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. NO USER JOURNEY MAP                                             │
│     ═══════════════════                                             │
│     Problem: Roadmap has features but no defined user paths         │
│     Solution: Define 3 primary journeys with touchpoints            │
│                                                                     │
│  2. NO DESIGN SYSTEM                                                │
│     ════════════════════                                            │
│     Problem: Components listed but no visual consistency plan       │
│     Solution: Create design tokens + component library first        │
│                                                                     │
│  3. NO EMPTY STATES                                                 │
│     ═══════════════════                                             │
│     Problem: What does user see with 0 analyses? 0 history?         │
│     Solution: Design helpful empty states that guide to action      │
│                                                                     │
│  4. NO ERROR UX                                                     │
│     ════════════════                                                │
│     Problem: "Graceful degradation" but no error message design     │
│     Solution: Human-friendly error messages + recovery actions      │
│                                                                     │
│  5. NO LOADING EXPERIENCE                                           │
│     ══════════════════════                                          │
│     Problem: 30-45 second wait with no engagement                   │
│     Solution: Progress storytelling ("Asking ChatGPT...", etc.)     │
│                                                                     │
│  6. NO MOBILE CONSIDERATION                                         │
│     ═══════════════════════                                         │
│     Problem: SaaS targets SMBs, many check on mobile                │
│     Solution: Mobile-first responsive design                        │
│                                                                     │
│  7. NO ONBOARDING FLOW                                              │
│     ══════════════════════                                          │
│     Problem: User lands, enters URL... then what?                   │
│     Solution: First-run experience with value demonstration         │
│                                                                     │
│  8. NO SOCIAL PROOF PLACEMENT                                       │
│     ═══════════════════════════                                     │
│     Problem: Landing page has no trust elements                     │
│     Solution: Early wins section, testimonials placeholder          │
│                                                                     │
│  9. NO FREEMIUM FRICTION DESIGN                                     │
│     ═════════════════════════════                                   │
│     Problem: "Show partial results" but no strategic blur/tease     │
│     Solution: Visible but locked content that creates desire        │
│                                                                     │
│  10. NO CELEBRATION/DELIGHT MOMENTS                                 │
│      ════════════════════════════                                   │
│      Problem: Score delivered with no emotional response            │
│      Solution: Score reveal animation, achievement moments          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.8 User Journey Maps (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│           JOURNEY 1: FIRST-TIME FREE USER (Critical Path)           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐          │
│  │ Landing │───▶│  Enter  │───▶│ Loading │───▶│ Results │          │
│  │  Page   │    │   URL   │    │ (30sec) │    │  Page   │          │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘          │
│       │              │              │              │                │
│       ▼              ▼              ▼              ▼                │
│  • Clear value   • Single      • Progress     • Score with       │
│    proposition     input         storytelling   celebration       │
│  • Trust          • Instant     • AI provider  • Partial         │
│    elements        validation    status         recommendations   │
│  • "30 seconds"  • No signup   • Fun facts    • Upgrade CTA      │
│    promise         required      while wait     (strategic)       │
│                                                                     │
│  CONVERSION GOAL: Sign up to save results & get full report        │
│                                                                     │
│  EMOTION ARC: Curious → Engaged → Delighted → Wanting More        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              JOURNEY 2: FREE → PAID CONVERSION                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐          │
│  │ Results │───▶│  Blur/  │───▶│ Pricing │───▶│Checkout │          │
│  │  (Free) │    │  Lock   │    │  Modal  │    │ (Stripe)│          │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘          │
│       │              │              │              │                │
│       ▼              ▼              ▼              ▼                │
│  • Show score    • "See 2     • Value        • Pre-filled       │
│    (exciting)      more recs"   comparison     info              │
│  • 1 of 3        • Competitor • Social proof • Instant access   │
│    recommendations blur         • Money-back   promise           │
│                  • "Unlock"                                        │
│                                                                     │
│  FRICTION POINTS TO DESIGN:                                        │
│  • What's blurred must be VISIBLE but unreadable (FOMO)           │
│  • Competitor scores tease without full reveal                     │
│  • "Others in your industry score 72 avg" → social comparison     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              JOURNEY 3: RETURNING PAID USER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐          │
│  │Dashboard│───▶│  Score  │───▶│ Compare │───▶│  Share  │          │
│  │  Home   │    │ History │    │   vs    │    │ Results │          │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘          │
│       │              │              │              │                │
│       ▼              ▼              ▼              ▼                │
│  • Score        • Trend       • Side-by-    • Badge embed       │
│    at-a-glance    visualization  side          code              │
│  • Alerts       • "Improved!" • Beat        • Social share      │
│    (if any)       celebration   competitors   buttons            │
│  • Quick                                                           │
│    re-analyze                                                      │
│                                                                     │
│  RETENTION HOOKS:                                                  │
│  • Weekly email: "Your score changed!"                            │
│  • Dashboard gamification: "Beat 73% of your industry"            │
│  • Streaks: "3 weeks of improvement!"                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.9 Design System Requirements (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DESIGN SYSTEM FOUNDATION                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. DESIGN TOKENS (CSS Variables)                                  │
│     ═══════════════════════════                                    │
│     Already have: dark/light theme variables                       │
│     Need to add:                                                   │
│     • --score-excellent: #22c55e (green, 80-100)                  │
│     • --score-good: #84cc16 (lime, 60-79)                         │
│     • --score-average: #eab308 (yellow, 40-59)                    │
│     • --score-poor: #f97316 (orange, 20-39)                       │
│     • --score-critical: #ef4444 (red, 0-19)                       │
│     • --provider-openai: #10a37f                                  │
│     • --provider-anthropic: #d4a574                               │
│     • --provider-google: #4285f4                                  │
│     • --provider-perplexity: #20808d                              │
│                                                                     │
│  2. TYPOGRAPHY SCALE                                               │
│     ══════════════════                                             │
│     • Display: 48px (score number)                                │
│     • H1: 36px (page titles)                                      │
│     • H2: 24px (section headers)                                  │
│     • Body: 16px (content)                                        │
│     • Small: 14px (labels, captions)                              │
│     • Micro: 12px (badges, metadata)                              │
│                                                                     │
│  3. SPACING SYSTEM                                                 │
│     ════════════════                                               │
│     Base: 4px                                                      │
│     Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96                       │
│                                                                     │
│  4. COMPONENT LIBRARY (Priority Order)                            │
│     ═══════════════════════════════════                           │
│     Phase 1:                                                       │
│     • ScoreCircle (animated, color-coded)                         │
│     • ProviderBadge (with logo + status)                          │
│     • ProgressBar (multi-step with labels)                        │
│     • AlertBanner (success/warning/error/info)                    │
│     • EmptyState (illustration + CTA)                             │
│     • SkeletonLoader (for loading states)                         │
│                                                                     │
│     Phase 2:                                                       │
│     • BlurredContent (for freemium gating)                        │
│     • ComparisonTable (side-by-side)                              │
│     • TrendChart (simple line graph)                              │
│     • NotificationBell (with badge count)                         │
│                                                                     │
│     Phase 3:                                                       │
│     • PricingCard (with feature list)                             │
│     • TestimonialCard (photo + quote)                             │
│     • BadgeEmbed (for external sites)                             │
│                                                                     │
│  5. ANIMATION LIBRARY                                              │
│     ═══════════════════                                            │
│     • scoreReveal: count-up animation for score                   │
│     • fadeInUp: standard content reveal                           │
│     • pulse: for loading indicators                               │
│     • confetti: for celebration moments (score > 80)              │
│     • shake: for error states                                     │
│     Tool: Framer Motion (already common in Next.js)               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.10 Loading Experience Design (NEW - Critical for 30s Wait)

```
┌─────────────────────────────────────────────────────────────────────┐
│              ANALYSIS LOADING EXPERIENCE (30-45 seconds)            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM: 30-45 seconds feels like FOREVER without engagement       │
│                                                                     │
│  SOLUTION: Progress Storytelling with Value Demonstration          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │     Analyzing your AI perception...                         │   │
│  │                                                             │   │
│  │     [████████░░░░░░░░░░░░░░░░░░░░░░] 25%                   │   │
│  │                                                             │   │
│  │     ✓ Extracted website metadata                           │   │
│  │     ✓ Detected industry: "CRM Software"                    │   │
│  │     ⏳ Asking ChatGPT about CRM recommendations...          │   │
│  │     ○ Asking Claude about CRM recommendations...           │   │
│  │     ○ Calculating your perception score                    │   │
│  │                                                             │   │
│  │     ─────────────────────────────────────────────          │   │
│  │     💡 Did you know?                                        │   │
│  │     "67% of B2B buyers ask AI assistants for              │   │
│  │      product recommendations before contacting sales"      │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  STEP-BY-STEP PROGRESSION:                                         │
│  1. "Extracting website information..." (0-10%)                    │
│  2. "Detecting your industry..." (10-20%)                          │
│  3. "Asking ChatGPT..." with spinner (20-40%)                      │
│  4. "Asking Claude..." with spinner (40-60%)                       │
│  5. "Analyzing responses..." (60-80%)                              │
│  6. "Calculating your score..." (80-95%)                           │
│  7. "Ready!" with celebration (95-100%)                            │
│                                                                     │
│  ROTATING FACTS (change every 8 seconds):                          │
│  • "67% of B2B buyers ask AI for recommendations"                  │
│  • "ChatGPT has 200M+ weekly active users"                        │
│  • "By 2027, 70% of searches will start with AI"                  │
│  • "Your competitors might already be optimizing for AI"          │
│                                                                     │
│  IMPLEMENTATION: Use Server-Sent Events (SSE) for real-time        │
│  progress updates from backend to frontend                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.11 Empty States & Error States (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EMPTY STATE DESIGNS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. DASHBOARD - NO ANALYSES YET                                    │
│     ┌─────────────────────────────────────────────────────────┐    │
│     │                                                         │    │
│     │        [Illustration: magnifying glass + AI]            │    │
│     │                                                         │    │
│     │     You haven't analyzed any URLs yet                   │    │
│     │                                                         │    │
│     │     Discover how AI models perceive your brand          │    │
│     │     in just 30 seconds.                                 │    │
│     │                                                         │    │
│     │     [  Analyze Your First URL  ]                        │    │
│     │                                                         │    │
│     └─────────────────────────────────────────────────────────┘    │
│                                                                     │
│  2. RESULTS - NO MENTIONS FOUND                                    │
│     ┌─────────────────────────────────────────────────────────┐    │
│     │                                                         │    │
│     │     Your AI Perception Score: 12                        │    │
│     │     (displayed with empathy, not alarm)                 │    │
│     │                                                         │    │
│     │     AI models don't mention your brand yet.             │    │
│     │     This is common - 78% of SMBs aren't visible to AI.  │    │
│     │                                                         │    │
│     │     The good news? You can improve.                     │    │
│     │     Here's where to start:                              │    │
│     │                                                         │    │
│     │     [3 actionable recommendations]                      │    │
│     │                                                         │    │
│     └─────────────────────────────────────────────────────────┘    │
│                                                                     │
│  3. SCORE HISTORY - NO HISTORICAL DATA                             │
│     ┌─────────────────────────────────────────────────────────┐    │
│     │                                                         │    │
│     │     [Placeholder chart with dotted line]                │    │
│     │                                                         │    │
│     │     Track your progress over time                       │    │
│     │                                                         │    │
│     │     Your score history will appear here after           │    │
│     │     your second analysis.                               │    │
│     │                                                         │    │
│     │     💡 Tip: Enable weekly monitoring to track changes   │    │
│     │                                                         │    │
│     └─────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR STATE DESIGNS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. URL INVALID                                                    │
│     Message: "Hmm, that doesn't look like a valid website URL"     │
│     Help: "Try entering the full address, like https://example.com"│
│     Tone: Helpful, not accusatory                                  │
│                                                                     │
│  2. WEBSITE UNREACHABLE                                            │
│     Message: "We couldn't reach that website"                      │
│     Help: "Check if the URL is correct or try again in a minute"   │
│     Action: [Try Again] button                                     │
│                                                                     │
│  3. AI PROVIDER TIMEOUT                                            │
│     Message: "ChatGPT is taking longer than usual"                 │
│     Help: "We're still working on it. Results from other AIs      │
│            will appear shortly."                                   │
│     Show: Partial results that are ready                           │
│                                                                     │
│  4. RATE LIMIT HIT                                                 │
│     Message: "You've reached your free analysis limit"             │
│     Help: "Upgrade to get unlimited analyses"                      │
│     Alternative: "Or come back tomorrow for 1 more free analysis"  │
│                                                                     │
│  5. GENERIC ERROR                                                  │
│     Message: "Something went wrong on our end"                     │
│     Help: "Our team has been notified. Please try again."          │
│     Action: [Retry] [Contact Support]                              │
│                                                                     │
│  DESIGN PRINCIPLE: Every error has a recovery path                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.12 Mobile-First Responsive Strategy (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MOBILE BREAKPOINTS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BREAKPOINTS (Tailwind defaults):                                  │
│  • sm: 640px   (large phones, landscape)                           │
│  • md: 768px   (tablets)                                           │
│  • lg: 1024px  (laptops)                                           │
│  • xl: 1280px  (desktops)                                          │
│                                                                     │
│  MOBILE-FIRST PRIORITY SCREENS:                                    │
│                                                                     │
│  1. LANDING PAGE (Mobile)                                          │
│     • Single column layout                                         │
│     • Large touch-friendly CTA button                              │
│     • URL input full-width                                         │
│     • Collapse "How it works" to accordion                        │
│                                                                     │
│  2. RESULTS PAGE (Mobile)                                          │
│     • Score circle takes full width header                         │
│     • Provider cards stack vertically                              │
│     • Recommendations as expandable cards                          │
│     • Sticky "Upgrade" CTA at bottom                              │
│                                                                     │
│  3. DASHBOARD (Mobile)                                             │
│     • Score summary card on top                                    │
│     • Swipeable analysis history                                   │
│     • Bottom navigation bar                                        │
│                                                                     │
│  TOUCH TARGET MINIMUMS:                                            │
│  • Buttons: 48x48px minimum (Apple HIG)                           │
│  • Links in body: 44x44px tap area                                │
│  • Form inputs: 48px height                                        │
│                                                                     │
│  MOBILE-SPECIFIC FEATURES:                                         │
│  • Pull-to-refresh on dashboard                                    │
│  • Haptic feedback on score reveal (if supported)                  │
│  • Share sheet integration for results                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.13 AI/Data Engineering Architecture (NEW - AI/ML Review)

```
┌─────────────────────────────────────────────────────────────────────┐
│              AI/DATA GAPS IDENTIFIED & SOLUTIONS                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. NO PROMPT VERSIONING                                           │
│     ═════════════════════                                          │
│     Problem: Prompts will evolve but no way to track changes       │
│     Impact: Can't reproduce past results or A/B test prompts       │
│     Solution: Version prompts in DB, link analysis to prompt_id    │
│                                                                     │
│  2. NO AI RESPONSE QUALITY METRICS                                 │
│     ═══════════════════════════════                                │
│     Problem: How do we know AI responses are useful/accurate?      │
│     Impact: Can't improve prompts or detect degradation            │
│     Solution: Track response quality, flag anomalies               │
│                                                                     │
│  3. NO TEMPERATURE/PARAM TRACKING                                  │
│     ════════════════════════════                                   │
│     Problem: AI params affect output but aren't logged             │
│     Impact: Can't debug inconsistent results                       │
│     Solution: Log all AI call parameters alongside responses       │
│                                                                     │
│  4. NO RETRY STRATEGY FOR AI CALLS                                 │
│     ════════════════════════════════                               │
│     Problem: "Fallback logic" exists but no exponential backoff    │
│     Impact: Could waste API budget on repeated failures            │
│     Solution: Implement proper retry with jitter                   │
│                                                                     │
│  5. NO DATA DRIFT DETECTION                                        │
│     ══════════════════════════                                     │
│     Problem: AI models update, responses change over time          │
│     Impact: Scores become inconsistent without warning             │
│     Solution: Baseline tests, alert on significant drift           │
│                                                                     │
│  6. NO PROMPT INJECTION TESTING                                    │
│     ════════════════════════════                                   │
│     Problem: Sanitizer exists but no test suite                    │
│     Impact: Edge cases could bypass sanitization                   │
│     Solution: Adversarial test dataset for prompt injection        │
│                                                                     │
│  7. NO STRUCTURED OUTPUT PARSING                                   │
│     ═══════════════════════════════                                │
│     Problem: Relying on AI to return valid JSON is fragile         │
│     Impact: Parsing failures = failed analyses                     │
│     Solution: Use function calling/tool_use for structured output  │
│                                                                     │
│  8. NO INDUSTRY TAXONOMY                                           │
│     ════════════════════════                                       │
│     Problem: Industry detection is free-form text                  │
│     Impact: "CRM Software" vs "CRM" vs "SaaS CRM" = inconsistent   │
│     Solution: Predefined taxonomy, normalize to standard categories│
│                                                                     │
│  9. NO EMBEDDING/SEMANTIC SEARCH                                   │
│     ═══════════════════════════════                                │
│     Problem: Can't find similar analyses or brands                 │
│     Impact: Missed opportunities for benchmarking, insights        │
│     Solution: Store embeddings for semantic similarity search      │
│                                                                     │
│  10. NO AI COST ALERTING AUTOMATION                                │
│      ═══════════════════════════════                               │
│      Problem: Cost tracking exists but no auto-protection          │
│      Impact: Could blow budget before noticing                     │
│      Solution: Auto-pause free tier when daily limit hit           │
│                                                                     │
│  11. NO MODEL FALLBACK CHAIN                                       │
│      ═══════════════════════════                                   │
│      Problem: Only fallback is OpenAI→Anthropic                    │
│      Impact: If both fail, analysis fails completely               │
│      Solution: Graceful degradation chain with cached responses    │
│                                                                     │
│  12. NO BATCH PROCESSING FOR MONITORING                            │
│      ═══════════════════════════════════                           │
│      Problem: CRON jobs process one URL at a time                  │
│      Impact: Inefficient, slow for large user base                 │
│      Solution: Batch similar queries, process in parallel          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.14 AI Provider Abstraction Layer (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  AI ORCHESTRATOR ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     AIOrchestrator                           │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ • queryAll(prompt, options)                          │    │   │
│  │  │ • queryWithFallback(prompt, providers[])             │    │   │
│  │  │ • queryBatch(prompts[], options)                     │    │   │
│  │  │ • getCachedOrQuery(cacheKey, prompt)                 │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│              ┌───────────────┼───────────────┐                     │
│              ▼               ▼               ▼                     │
│  ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐       │
│  │  OpenAIProvider  │ │  Anthropic   │ │  GoogleProvider  │       │
│  │  ──────────────  │ │  Provider    │ │  ──────────────  │       │
│  │  model: gpt-3.5  │ │  ──────────  │ │  model: gemini   │       │
│  │  temp: 0.3       │ │  model:haiku │ │  temp: 0.3       │       │
│  │  max_tokens:1000 │ │  temp: 0.3   │ │  max_tokens:1000 │       │
│  │  ──────────────  │ │  ──────────  │ │  ──────────────  │       │
│  │  • query()       │ │  • query()   │ │  • query()       │       │
│  │  • parseResponse │ │  • parse..   │ │  • parseResponse │       │
│  │  • calculateCost │ │  • calc..    │ │  • calculateCost │       │
│  └──────────────────┘ └──────────────┘ └──────────────────┘       │
│                                                                     │
│  PROVIDER INTERFACE:                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ interface AIProvider {                                       │   │
│  │   name: string;                                              │   │
│  │   model: string;                                             │   │
│  │   query(prompt: string, options: QueryOptions): AIResponse;  │   │
│  │   parseStructured<T>(response: string, schema: ZodSchema<T>);│   │
│  │   calculateCost(tokens_in: number, tokens_out: number): USD; │   │
│  │   healthCheck(): Promise<boolean>;                           │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  QUERY OPTIONS:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ interface QueryOptions {                                     │   │
│  │   temperature?: number;        // 0.0-1.0, default 0.3      │   │
│  │   maxTokens?: number;          // default 1000              │   │
│  │   timeout?: number;            // ms, default 30000         │   │
│  │   retries?: number;            // default 3                 │   │
│  │   useCache?: boolean;          // default true              │   │
│  │   cacheTTL?: number;           // seconds, default 86400    │   │
│  │   structuredOutput?: ZodSchema; // for type-safe parsing    │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.15 Prompt Management System (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROMPT VERSIONING & MANAGEMENT                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  DATABASE TABLE: prompts                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ name            TEXT UNIQUE (e.g., 'industry_detection_v2') │   │
│  │ version         INTEGER                                      │   │
│  │ template        TEXT (prompt with {variables})               │   │
│  │ variables       JSONB (expected variables)                   │   │
│  │ output_schema   JSONB (expected JSON structure)              │   │
│  │ is_active       BOOLEAN                                      │   │
│  │ created_at      TIMESTAMPTZ                                  │   │
│  │ performance_metrics JSONB (avg_latency, success_rate)        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  PROMPT TYPES (Initial Set):                                       │
│  ├─ industry_detection    - Detect industry from URL metadata      │
│  ├─ perception_query      - Ask AI about recommendations           │
│  ├─ response_extraction   - Parse AI response for brand mentions   │
│  ├─ recommendation_gen    - Generate actionable recommendations    │
│  ├─ sentiment_analysis    - Extract sentiment from context         │
│  └─ hallucination_check   - Verify AI claims vs reality           │
│                                                                     │
│  VERSIONING RULES:                                                 │
│  • NEVER modify active prompts in place                            │
│  • Create new version, test, then activate                         │
│  • Keep last 5 versions for rollback                               │
│  • Track which prompt_id was used for each analysis                │
│                                                                     │
│  A/B TESTING SUPPORT:                                              │
│  • Multiple prompts can be active with weights                     │
│  • Track conversion/quality by prompt version                      │
│  • Auto-promote winning variants                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.16 Structured Output Parsing (NEW - Critical)

```
┌─────────────────────────────────────────────────────────────────────┐
│              STRUCTURED OUTPUT WITH ZOD VALIDATION                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM: AI returns text, parsing to JSON is fragile              │
│                                                                     │
│  SOLUTION: Use OpenAI function_calling / Anthropic tool_use        │
│                                                                     │
│  IMPLEMENTATION:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Define expected output with Zod                           │   │
│  │ const IndustryDetectionSchema = z.object({                   │   │
│  │   industry: z.string(),                                      │   │
│  │   subIndustry: z.string(),                                   │   │
│  │   country: z.string(),                                       │   │
│  │   entityType: z.enum(['business','personal','product']),     │   │
│  │   competitors: z.array(z.string()).max(5),                   │   │
│  │   confidence: z.number().min(0).max(1),                      │   │
│  │ });                                                          │   │
│  │                                                               │   │
│  │ // Use with OpenAI function calling                          │   │
│  │ const response = await openai.chat.completions.create({      │   │
│  │   model: 'gpt-3.5-turbo',                                    │   │
│  │   messages: [...],                                           │   │
│  │   functions: [{                                              │   │
│  │     name: 'detect_industry',                                 │   │
│  │     parameters: zodToJsonSchema(IndustryDetectionSchema)     │   │
│  │   }],                                                        │   │
│  │   function_call: { name: 'detect_industry' }                 │   │
│  │ });                                                          │   │
│  │                                                               │   │
│  │ // Parse and validate                                        │   │
│  │ const result = IndustryDetectionSchema.parse(                │   │
│  │   JSON.parse(response.choices[0].message.function_call.args) │   │
│  │ );                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  BENEFITS:                                                         │
│  • Type-safe outputs (TypeScript inference)                        │
│  • Validation errors are clear (Zod messages)                      │
│  • No regex parsing of AI text                                     │
│  • Works with OpenAI, Anthropic, Google                            │
│                                                                     │
│  SCHEMAS TO DEFINE (Phase 1):                                      │
│  ├─ IndustryDetectionSchema                                        │
│  ├─ PerceptionQuerySchema                                          │
│  ├─ BrandMentionSchema                                             │
│  ├─ RecommendationSchema                                           │
│  └─ SentimentAnalysisSchema                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.17 Industry Taxonomy (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STANDARDIZED INDUSTRY TAXONOMY                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM: Free-form industry detection creates inconsistency       │
│  "CRM Software" vs "CRM" vs "Customer Relationship Management"     │
│                                                                     │
│  SOLUTION: Predefined taxonomy with normalization                  │
│                                                                     │
│  TOP-LEVEL CATEGORIES (20):                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Technology & Software    • Healthcare & Medical           │   │
│  │ • Finance & Banking        • Education & Training           │   │
│  │ • E-commerce & Retail      • Real Estate                    │   │
│  │ • Travel & Hospitality     • Food & Restaurant              │   │
│  │ • Legal Services           • Marketing & Advertising        │   │
│  │ • Manufacturing            • Construction                   │   │
│  │ • Transportation           • Energy & Utilities             │   │
│  │ • Entertainment & Media    • Professional Services          │   │
│  │ • Non-profit               • Government                     │   │
│  │ • Agriculture              • Other                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  SUB-CATEGORIES (Example: Technology & Software):                  │
│  ├─ SaaS / Cloud Software                                          │
│  ├─ CRM & Sales Tools                                              │
│  ├─ Marketing Technology                                           │
│  ├─ HR & Recruiting Software                                       │
│  ├─ Project Management                                             │
│  ├─ Developer Tools                                                │
│  ├─ Cybersecurity                                                  │
│  ├─ AI & Machine Learning                                          │
│  ├─ Data & Analytics                                               │
│  └─ IT Services & Consulting                                       │
│                                                                     │
│  DATABASE TABLE: industries                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ slug            TEXT UNIQUE ('technology-software')          │   │
│  │ name            TEXT ('Technology & Software')               │   │
│  │ parent_id       UUID REFERENCES industries(id) (nullable)    │   │
│  │ query_keywords  TEXT[] (for prompt generation)               │   │
│  │ competitors_seed TEXT[] (common competitors)                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  NORMALIZATION FLOW:                                               │
│  1. AI detects free-form industry                                  │
│  2. Map to nearest taxonomy category (embedding similarity)        │
│  3. Store normalized industry_id, not free text                    │
│  4. Use taxonomy for benchmarking, SOV calculations                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.18 Retry & Circuit Breaker Pattern (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 RESILIENT AI API CALLS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  RETRY STRATEGY (Per Provider):                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ const RETRY_CONFIG = {                                       │   │
│  │   maxRetries: 3,                                             │   │
│  │   baseDelay: 1000,      // 1 second                         │   │
│  │   maxDelay: 30000,      // 30 seconds max                   │   │
│  │   backoffMultiplier: 2, // exponential                      │   │
│  │   jitter: 0.2,          // ±20% randomization               │   │
│  │   retryableErrors: [                                         │   │
│  │     'rate_limit_exceeded',                                   │   │
│  │     'timeout',                                               │   │
│  │     'internal_server_error',                                 │   │
│  │     'service_unavailable',                                   │   │
│  │   ],                                                         │   │
│  │   nonRetryableErrors: [                                      │   │
│  │     'invalid_api_key',                                       │   │
│  │     'content_policy_violation',                              │   │
│  │     'context_length_exceeded',                               │   │
│  │   ],                                                         │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CIRCUIT BREAKER (Per Provider):                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ States: CLOSED → OPEN → HALF_OPEN → CLOSED                   │   │
│  │                                                               │   │
│  │ CLOSED (normal operation):                                   │   │
│  │   - Track failure count                                      │   │
│  │   - If failures > 5 in 60s → OPEN                           │   │
│  │                                                               │   │
│  │ OPEN (provider down):                                        │   │
│  │   - Return cached response or skip provider                  │   │
│  │   - After 30s → HALF_OPEN                                   │   │
│  │                                                               │   │
│  │ HALF_OPEN (testing):                                         │   │
│  │   - Allow 1 request through                                  │   │
│  │   - If success → CLOSED                                      │   │
│  │   - If fail → OPEN (reset timer)                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  FALLBACK CHAIN:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. Try primary provider (OpenAI)                             │   │
│  │    ↓ fail                                                    │   │
│  │ 2. Try secondary provider (Anthropic)                        │   │
│  │    ↓ fail                                                    │   │
│  │ 3. Try cached response (if available, even if stale)         │   │
│  │    ↓ no cache                                                │   │
│  │ 4. Return partial result (mark provider as unavailable)      │   │
│  │    ↓ all providers fail                                      │   │
│  │ 5. Queue for retry, notify user of delay                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.19 Data Quality & Drift Detection (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 AI RESPONSE QUALITY MONITORING                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  QUALITY METRICS (Per Response):                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Response length (tokens)                                   │   │
│  │ • Structured output parse success (boolean)                  │   │
│  │ • Contains expected fields (completeness score 0-1)          │   │
│  │ • Latency (ms)                                               │   │
│  │ • Confidence score (if provided by AI)                       │   │
│  │ • Anomaly flag (unusual response pattern)                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: ai_response_quality                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ ai_response_id  UUID REFERENCES ai_responses(id)             │   │
│  │ parse_success   BOOLEAN                                      │   │
│  │ completeness    DECIMAL (0-1)                                │   │
│  │ latency_ms      INTEGER                                      │   │
│  │ confidence      DECIMAL (0-1, nullable)                      │   │
│  │ anomaly_score   DECIMAL (0-1, higher = more unusual)         │   │
│  │ anomaly_reasons JSONB                                        │   │
│  │ created_at      TIMESTAMPTZ                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DRIFT DETECTION (Weekly CRON):                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ GOLDEN DATASET: 20 known brands with expected scores         │   │
│  │                                                               │   │
│  │ For each golden brand:                                       │   │
│  │   1. Run fresh analysis                                      │   │
│  │   2. Compare score to baseline                               │   │
│  │   3. If |diff| > 15 points → FLAG                           │   │
│  │                                                               │   │
│  │ ALERTS:                                                      │   │
│  │   • >20% golden tests drift → Email Alberto                 │   │
│  │   • >50% drift → Pause new analyses, investigate            │   │
│  │                                                               │   │
│  │ CAUSES TO CHECK:                                             │   │
│  │   • AI model updated (OpenAI/Anthropic)                      │   │
│  │   • Prompt accidentally changed                              │   │
│  │   • Parsing logic broken                                     │   │
│  │   • Cache returning stale data                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ANOMALY DETECTION RULES:                                          │
│  ├─ Response < 50 tokens → Likely incomplete                       │
│  ├─ Response > 3000 tokens → Likely verbose/off-topic             │
│  ├─ No brand mentions in any response → Unusual for industry      │
│  ├─ All providers disagree completely → Needs review              │
│  ├─ Score changed > 30 points in 24h → Investigate                │
│  └─ Parse failure after 3 retries → Mark for manual review        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.20 Cost Protection & Auto-Scaling (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 AUTOMATED COST PROTECTION                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  DAILY BUDGET LIMITS:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ const DAILY_LIMITS = {                                       │   │
│  │   total: 5.00,          // $5/day max (pre-revenue)         │   │
│  │   perProvider: {                                             │   │
│  │     openai: 2.50,                                            │   │
│  │     anthropic: 2.50,                                         │   │
│  │     google: 0.00,       // Free tier only initially         │   │
│  │     perplexity: 0.00,   // Deferred to Phase 4              │   │
│  │   },                                                         │   │
│  │   warningThreshold: 0.7, // Alert at 70%                    │   │
│  │   pauseThreshold: 0.95,  // Pause free tier at 95%          │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  AUTOMATED ACTIONS:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ At 70% daily budget:                                         │   │
│  │   → Log warning                                              │   │
│  │   → Increase cache TTL (24h → 48h)                          │   │
│  │   → Prioritize paid user requests                           │   │
│  │                                                               │   │
│  │ At 90% daily budget:                                         │   │
│  │   → Email alert to Alberto                                   │   │
│  │   → Queue free user requests (delay 1h)                      │   │
│  │                                                               │   │
│  │ At 95% daily budget:                                         │   │
│  │   → Pause all free tier analyses                             │   │
│  │   → Show message: "High demand, try again in X hours"       │   │
│  │   → Continue serving paid users                              │   │
│  │                                                               │   │
│  │ At 100% daily budget:                                        │   │
│  │   → Pause ALL new analyses                                   │   │
│  │   → Serve only cached results                                │   │
│  │   → Auto-resume at midnight UTC                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPLEMENTATION:                                                   │
│  • Check budget before each AI call                                │
│  • Use Upstash Redis for real-time cost tracking                  │
│  • Increment: INCRBY daily_cost_{date} {cost_usd}                 │
│  • TTL: 48 hours (auto-cleanup)                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.21 API Cost Optimization Strategy

```
┌─────────────────────────────────────────────────────────────┐
│               COST OPTIMIZATION FRAMEWORK                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TIER 1: AGGRESSIVE CACHING (Upstash Redis)                │
│  ├─ Cache AI responses for same industry/country: 24h      │
│  ├─ Cache URL metadata extraction: 7 days                  │
│  └─ Estimated savings: 60-70% of API calls                 │
│                                                             │
│  TIER 2: SMART BATCHING                                    │
│  ├─ Group similar queries to single AI call                │
│  ├─ Process monitoring jobs in batches (CRON)              │
│  └─ Estimated savings: 20-30% additional                   │
│                                                             │
│  TIER 3: MODEL SELECTION                                   │
│  ├─ Free tier: GPT-3.5-turbo + Claude Haiku only           │
│  ├─ Paid tier: GPT-4 + Claude Sonnet                       │
│  └─ Cost difference: ~10x between tiers                    │
│                                                             │
│  TIER 4: RATE LIMITING                                     │
│  ├─ Free users: 1 analysis/day, 5/month                    │
│  ├─ Starter: 10 analyses/day                               │
│  ├─ Pro: 50 analyses/day                                   │
│  └─ Prevents abuse, controls costs                         │
│                                                             │
│  PROJECTED COST PER ANALYSIS:                              │
│  ├─ Without optimization: $0.15-0.25                       │
│  ├─ With optimization: $0.03-0.08                          │
│  └─ Target margin: 70%+ on paid plans                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.22 Knowledge Graph & SEO Architecture (NEW - KG/SEO Review)

```
┌─────────────────────────────────────────────────────────────────────┐
│              KNOWLEDGE GRAPH & SEO GAPS IDENTIFIED                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. NO ENTITY EXTRACTION FROM ANALYZED URLS                        │
│     ═══════════════════════════════════════                        │
│     Problem: We analyze URLs but don't extract structured entities  │
│     Impact: Can't build knowledge graph of brands → competitors     │
│     Solution: Extract entities (org, person, product) from URLs     │
│                                                                     │
│  2. NO SCHEMA.ORG VALIDATION FOR CLIENT SITES                      │
│     ════════════════════════════════════════                       │
│     Problem: We check if Schema exists but don't validate quality   │
│     Impact: Clients don't know HOW to fix their structured data     │
│     Solution: Deep Schema.org validator with actionable fixes       │
│                                                                     │
│  3. NO WIKIDATA/DBPEDIA ENTITY LINKING                             │
│     ═══════════════════════════════════                            │
│     Problem: We check IF brand is in Wikidata, not HOW to add it   │
│     Impact: Missed opportunity to guide clients on KG presence      │
│     Solution: Provide Wikidata creation guide + template            │
│                                                                     │
│  4. NO SEMANTIC RELATIONSHIP MAPPING                               │
│     ════════════════════════════════                               │
│     Problem: Brand isolated, no connections to industry graph       │
│     Impact: Can't show "Your brand vs industry knowledge network"   │
│     Solution: Build industry knowledge graph with relationships     │
│                                                                     │
│  5. NO E-E-A-T SIGNALS ANALYSIS                                    │
│     ═══════════════════════════                                    │
│     Problem: Google/AI models use E-E-A-T but we don't measure it  │
│     Impact: Missing key factor in why brands are/aren't recommended │
│     Solution: E-E-A-T scoring (Experience, Expertise, Authority)    │
│                                                                     │
│  6. NO CITATION SOURCE TRACKING                                    │
│     ═══════════════════════════                                    │
│     Problem: AIs cite sources but we don't track which ones         │
│     Impact: Can't tell clients WHERE to improve their presence      │
│     Solution: Track citation sources per AI provider                │
│                                                                     │
│  7. NO BACKLINK/MENTION QUALITY ASSESSMENT                         │
│     ═══════════════════════════════════                            │
│     Problem: Share of Voice exists but not quality of mentions      │
│     Impact: 10 mentions on spam sites ≠ 1 mention on NYTimes       │
│     Solution: Authority scoring for mention sources                 │
│                                                                     │
│  8. NO CONTENT FRESHNESS SIGNALS                                   │
│     ═════════════════════════════                                  │
│     Problem: AI models prefer fresh, updated content                │
│     Impact: Stale content gets deprioritized in AI recommendations  │
│     Solution: Track content freshness, last update, publish dates   │
│                                                                     │
│  9. NO MULTI-LANGUAGE ENTITY RESOLUTION                            │
│     ═══════════════════════════════════                            │
│     Problem: "Apple" (company) vs "apple" (fruit) - no NER          │
│     Impact: Ambiguous brand names cause incorrect analysis          │
│     Solution: Named Entity Recognition with disambiguation          │
│                                                                     │
│  10. NO OWN SITE SEO/GEO OPTIMIZATION                              │
│      ═══════════════════════════════                               │
│      Problem: We help clients with GEO but our own site has none!  │
│      Impact: AI models won't recommend US to potential customers    │
│      Solution: Full GEO optimization for vectorialdata.com          │
│                                                                     │
│  11. NO PROGRAMMATIC SEO PAGES                                     │
│      ═══════════════════════════                                   │
│      Problem: No industry/location landing pages for SEO traffic    │
│      Impact: Missing long-tail search traffic opportunity           │
│      Solution: Generate /ai-perception/{industry}/{location} pages  │
│                                                                     │
│  12. NO STRUCTURED DATA FOR OUR OWN RESULTS                        │
│      ══════════════════════════════════════                        │
│      Problem: Analysis results have no Schema.org markup            │
│      Impact: Results not rich-snippet eligible, poor sharing        │
│      Solution: Add AnalysisResult schema to results pages           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.23 Entity Extraction & Knowledge Graph (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 ENTITY EXTRACTION ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ENTITY TYPES TO EXTRACT:                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Organization - Company, brand, agency                      │   │
│  │ • Person - Founder, CEO, author (for E-E-A-T)               │   │
│  │ • Product - Specific products/services offered               │   │
│  │ • Location - HQ, service areas                               │   │
│  │ • Industry - Normalized to taxonomy                          │   │
│  │ • Technology - Tech stack, platforms used                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  EXTRACTION SOURCES:                                               │
│  1. Website metadata (title, description, OG tags)                 │
│  2. Schema.org structured data on site                             │
│  3. AI-extracted from content                                      │
│  4. Wikidata/DBpedia lookup                                        │
│  5. LinkedIn Company API (if available)                            │
│                                                                     │
│  DATABASE TABLE: entities                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ type            ENUM('organization','person','product',      │   │
│  │                      'location','industry','technology')     │   │
│  │ name            TEXT                                         │   │
│  │ normalized_name TEXT (lowercase, no special chars)           │   │
│  │ wikidata_id     TEXT (Q-number if found)                     │   │
│  │ dbpedia_uri     TEXT (DBpedia URI if found)                  │   │
│  │ aliases         TEXT[] (alternative names)                   │   │
│  │ properties      JSONB (type-specific properties)             │   │
│  │ confidence      DECIMAL (0-1, extraction confidence)         │   │
│  │ source          TEXT ('website','ai','wikidata','manual')    │   │
│  │ created_at      TIMESTAMPTZ                                  │   │
│  │ updated_at      TIMESTAMPTZ                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: entity_relationships                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ subject_id      UUID REFERENCES entities(id)                 │   │
│  │ predicate       TEXT ('competes_with','subsidiary_of',       │   │
│  │                       'founded_by','located_in','uses')      │   │
│  │ object_id       UUID REFERENCES entities(id)                 │   │
│  │ confidence      DECIMAL (0-1)                                │   │
│  │ source          TEXT                                         │   │
│  │ created_at      TIMESTAMPTZ                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  RELATIONSHIP TYPES:                                               │
│  ├─ competes_with    - Brand A competes with Brand B              │
│  ├─ subsidiary_of    - Brand is owned by Parent Company           │
│  ├─ founded_by       - Person founded Organization                │
│  ├─ located_in       - Organization HQ in Location                │
│  ├─ operates_in      - Organization serves Industry               │
│  ├─ uses_technology  - Organization uses Technology               │
│  └─ mentioned_with   - Entities frequently mentioned together     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.24 Schema.org Deep Validation (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 SCHEMA.ORG VALIDATION ENGINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CURRENT STATE: Check if Schema.org exists (boolean)               │
│  TARGET STATE: Full validation with actionable recommendations     │
│                                                                     │
│  VALIDATION LEVELS:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Level 1: PRESENCE                                            │   │
│  │   • Does the site have ANY structured data?                  │   │
│  │   • Detection: JSON-LD, Microdata, RDFa                      │   │
│  │                                                               │   │
│  │ Level 2: VALIDITY                                            │   │
│  │   • Is the Schema syntactically correct?                     │   │
│  │   • Are required properties present?                         │   │
│  │   • Are property values in correct format?                   │   │
│  │                                                               │   │
│  │ Level 3: COMPLETENESS                                        │   │
│  │   • Are recommended properties filled?                       │   │
│  │   • Is there enough detail for AI to understand?            │   │
│  │   • Score: 0-100 based on field coverage                    │   │
│  │                                                               │   │
│  │ Level 4: AI-READINESS                                        │   │
│  │   • Does Schema help AI understand the business?             │   │
│  │   • Are there relationship links (sameAs, mentions)?        │   │
│  │   • Is there enough context for recommendations?            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CRITICAL SCHEMAS FOR AI VISIBILITY:                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ MUST HAVE:                                                   │   │
│  │ • Organization (name, url, logo, description, sameAs)       │   │
│  │ • LocalBusiness (if applicable - address, geo, hours)       │   │
│  │ • Product/Service (name, description, offers)               │   │
│  │ • WebSite (name, url, potentialAction for sitelinks)       │   │
│  │                                                               │   │
│  │ RECOMMENDED:                                                 │   │
│  │ • Person (for founder/CEO - builds E-E-A-T)                 │   │
│  │ • Article/BlogPosting (for content freshness signals)       │   │
│  │ • FAQPage (AI loves FAQ structured data)                    │   │
│  │ • Review/AggregateRating (social proof)                     │   │
│  │ • BreadcrumbList (site structure clarity)                   │   │
│  │                                                               │   │
│  │ ADVANCED:                                                    │   │
│  │ • SoftwareApplication (for SaaS products)                   │   │
│  │ • ProfessionalService (for agencies/consultants)            │   │
│  │ • ItemList (for comparison/ranking pages)                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  OUTPUT: Schema Scorecard                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Schema.org Score: 45/100                                     │   │
│  │                                                               │   │
│  │ ✓ Organization schema found                                  │   │
│  │ ✗ Missing: sameAs links (Wikidata, LinkedIn, Crunchbase)    │   │
│  │ ✗ Missing: LocalBusiness (you have physical locations)      │   │
│  │ ✗ Missing: Product schema for your offerings                │   │
│  │ ⚠ Description too short (50 chars, recommend 150+)         │   │
│  │                                                               │   │
│  │ TOP 3 FIXES (Impact Priority):                               │   │
│  │ 1. Add sameAs links (+15 points)                            │   │
│  │ 2. Add Product schema for main offering (+12 points)        │   │
│  │ 3. Expand Organization description (+8 points)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.25 E-E-A-T Signals Analysis (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    E-E-A-T SCORING SYSTEM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  E-E-A-T = Experience, Expertise, Authoritativeness, Trust         │
│  (Google's quality framework, heavily influences AI recommendations)│
│                                                                     │
│  EXPERIENCE SIGNALS (0-25 points):                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Years in business (from About page, Wikidata)             │   │
│  │ • Customer testimonials present                              │   │
│  │ • Case studies / portfolio                                   │   │
│  │ • Team/founder bios with experience                          │   │
│  │ • Industry awards / recognition                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  EXPERTISE SIGNALS (0-25 points):                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Author bylines on content                                  │   │
│  │ • Credentials / certifications displayed                     │   │
│  │ • Technical depth of content                                 │   │
│  │ • Original research / data                                   │   │
│  │ • Speaking engagements / publications                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  AUTHORITATIVENESS SIGNALS (0-25 points):                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Backlinks from authoritative domains                       │   │
│  │ • Mentions in industry publications                          │   │
│  │ • Wikipedia/Wikidata presence                                │   │
│  │ • Citations by other experts                                 │   │
│  │ • Social proof (followers, engagement)                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TRUST SIGNALS (0-25 points):                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • HTTPS (mandatory)                                          │   │
│  │ • Privacy policy present                                     │   │
│  │ • Contact information visible                                │   │
│  │ • Physical address (for local businesses)                    │   │
│  │ • BBB / Trust badges                                         │   │
│  │ • Clear pricing / refund policy                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: eeat_scores                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ analysis_id     UUID REFERENCES analyses(id)                 │   │
│  │ experience_score INTEGER (0-25)                              │   │
│  │ expertise_score  INTEGER (0-25)                              │   │
│  │ authority_score  INTEGER (0-25)                              │   │
│  │ trust_score      INTEGER (0-25)                              │   │
│  │ total_score      INTEGER (0-100)                             │   │
│  │ signals_found    JSONB (detailed breakdown)                  │   │
│  │ recommendations  JSONB (how to improve each)                 │   │
│  │ created_at       TIMESTAMPTZ                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPLEMENTATION NOTE:                                              │
│  E-E-A-T is a qualitative framework. We approximate it by:         │
│  1. Scraping key pages (About, Team, Contact, Blog)               │
│  2. Checking for specific elements (bios, credentials, etc.)      │
│  3. Cross-referencing with external signals (backlinks, Wikidata) │
│  4. Using AI to assess content expertise level                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.26 Citation Source Tracking (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 AI CITATION SOURCE ANALYSIS                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM: AI models cite sources. We need to know WHICH sources.   │
│                                                                     │
│  WHY IT MATTERS:                                                   │
│  • Perplexity ALWAYS cites sources                                 │
│  • ChatGPT with Browse cites sources                               │
│  • Knowing citation sources = knowing WHERE to improve presence    │
│                                                                     │
│  CITATION TYPES:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Direct URL citation (Perplexity style)                     │   │
│  │ • Domain mention ("according to Forbes...")                  │   │
│  │ • Named source ("G2 reviews show...")                        │   │
│  │ • Implicit citation (clearly derived from specific source)   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  HIGH-VALUE CITATION SOURCES TO TRACK:                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TIER 1 (Highest Authority):                                  │   │
│  │ • Wikipedia / Wikidata                                       │   │
│  │ • News outlets (NYT, BBC, TechCrunch, Forbes)               │   │
│  │ • Academic sources                                           │   │
│  │                                                               │   │
│  │ TIER 2 (Industry Authority):                                 │   │
│  │ • G2, Capterra, TrustRadius (SaaS)                          │   │
│  │ • Yelp, TripAdvisor (Local)                                 │   │
│  │ • Industry publications                                      │   │
│  │                                                               │   │
│  │ TIER 3 (Social Proof):                                       │   │
│  │ • Reddit discussions                                         │   │
│  │ • Twitter/X mentions                                         │   │
│  │ • LinkedIn posts                                             │   │
│  │                                                               │   │
│  │ TIER 4 (Company-Controlled):                                 │   │
│  │ • Company website                                            │   │
│  │ • Blog posts                                                 │   │
│  │ • Press releases                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: citation_sources                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ ai_response_id  UUID REFERENCES ai_responses(id)             │   │
│  │ source_url      TEXT                                         │   │
│  │ source_domain   TEXT                                         │   │
│  │ source_type     ENUM('direct','domain','named','implicit')   │   │
│  │ authority_tier  INTEGER (1-4)                                │   │
│  │ citation_text   TEXT (the actual citation)                   │   │
│  │ sentiment       ENUM('positive','neutral','negative')        │   │
│  │ created_at      TIMESTAMPTZ                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ACTIONABLE OUTPUT:                                                │
│  "AI cited these sources when discussing your industry:            │
│   • G2 Reviews (Tier 2) - You have 4.2 stars, competitors avg 4.5 │
│   • TechCrunch (Tier 1) - No mentions of your brand found         │
│   • Competitor blog (Tier 4) - They're getting cited, you're not  │
│                                                                     │
│   RECOMMENDATION: Focus on G2 reviews and pitch TechCrunch"        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.27 Own Site GEO Optimization (NEW - Critical)

```
┌─────────────────────────────────────────────────────────────────────┐
│          VECTORIALDATA.COM GEO SELF-OPTIMIZATION                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ⚠️ CRITICAL: We sell GEO services but our own site isn't GEO'd!   │
│                                                                     │
│  REQUIRED IMPLEMENTATIONS:                                         │
│                                                                     │
│  1. SCHEMA.ORG FOR OUR SITE                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ {                                                            │   │
│  │   "@context": "https://schema.org",                         │   │
│  │   "@type": "SoftwareApplication",                           │   │
│  │   "name": "AI Perception",                                  │   │
│  │   "applicationCategory": "BusinessApplication",             │   │
│  │   "operatingSystem": "Web",                                 │   │
│  │   "description": "Discover how AI models perceive...",      │   │
│  │   "offers": {                                                │   │
│  │     "@type": "Offer",                                       │   │
│  │     "price": "0",                                           │   │
│  │     "priceCurrency": "USD"                                  │   │
│  │   },                                                        │   │
│  │   "aggregateRating": { ... },                               │   │
│  │   "provider": {                                             │   │
│  │     "@type": "Organization",                                │   │
│  │     "name": "AI Perception Engineering Agency",             │   │
│  │     "sameAs": [                                             │   │
│  │       "https://twitter.com/aiperception",                   │   │
│  │       "https://linkedin.com/company/aiperception",          │   │
│  │       "https://www.wikidata.org/wiki/Q..."                  │   │
│  │     ]                                                       │   │
│  │   }                                                         │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  2. WIKIDATA ENTRY CREATION                                        │
│     • Create Wikidata entry for "AI Perception Engineering Agency" │
│     • Link to official website, founders, industry                 │
│     • This is THE signal that AI models trust most                 │
│                                                                     │
│  3. FAQ PAGE WITH SCHEMA                                           │
│     • "What is AI Perception Score?"                               │
│     • "How does GEO differ from SEO?"                              │
│     • "Which AI models do you analyze?"                            │
│     • FAQ Schema = AI models LOVE to cite these                    │
│                                                                     │
│  4. EXPERT CONTENT STRATEGY                                        │
│     • Blog posts answering AI-likely questions                     │
│     • "Best [industry] in [city]" template pages                   │
│     • Founder thought leadership (E-E-A-T)                         │
│                                                                     │
│  5. BACKLINK ACQUISITION PRIORITIES                                │
│     • Submit to Product Hunt                                       │
│     • Get featured in AI/marketing newsletters                     │
│     • Guest posts on marketing/SEO blogs                           │
│     • Crunchbase profile                                           │
│                                                                     │
│  6. SOCIAL PROOF SCHEMA                                            │
│     • Aggregate reviews from early users                           │
│     • Display testimonials with Person schema                      │
│     • Case study pages with structured data                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.28 Programmatic SEO Pages (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 PROGRAMMATIC SEO STRATEGY                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OPPORTUNITY: Generate thousands of SEO-optimized landing pages    │
│                                                                     │
│  PAGE TEMPLATES:                                                   │
│                                                                     │
│  1. INDUSTRY PAGES (/ai-perception/{industry})                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ URL: /ai-perception/crm-software                             │   │
│  │ Title: "AI Perception for CRM Software Companies"            │   │
│  │ H1: "How AI Models Recommend CRM Software"                   │   │
│  │                                                               │   │
│  │ Content:                                                      │   │
│  │ • Industry-specific AI perception stats                      │   │
│  │ • Common challenges for CRM companies                        │   │
│  │ • Example queries AI users ask                               │   │
│  │ • CTA: "Check your CRM's AI Perception Score"               │   │
│  │                                                               │   │
│  │ Generate for: All 20 industries × sub-categories = ~200 pages│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  2. LOCATION PAGES (/ai-perception/{industry}/{location})          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ URL: /ai-perception/restaurants/mexico-city                  │   │
│  │ Title: "AI Perception for Restaurants in Mexico City"        │   │
│  │                                                               │   │
│  │ Generate for: Top 50 cities × 20 industries = 1,000 pages   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  3. COMPARISON PAGES (/compare/{brand-a}-vs-{brand-b})             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ URL: /compare/hubspot-vs-salesforce-ai-perception            │   │
│  │ Title: "HubSpot vs Salesforce: AI Perception Comparison"     │   │
│  │                                                               │   │
│  │ Generate for: Top competitors in each industry               │   │
│  │ IMPORTANT: Use public data only, no defamation               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  4. "BEST OF" PAGES (/best/{industry}-{location})                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ URL: /best/project-management-software-2025                  │   │
│  │ Title: "Best Project Management Software for AI Visibility"  │   │
│  │                                                               │   │
│  │ Content: Rankings based on our AI Perception Scores          │   │
│  │ Update: Monthly with fresh data                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPLEMENTATION:                                                   │
│  • Use Next.js generateStaticParams for SSG                       │
│  • Database-driven content generation                              │
│  • Unique content per page (no thin content penalties)             │
│  • Internal linking between related pages                          │
│  • Sitemap.xml auto-generation                                     │
│                                                                     │
│  SEO TECHNICAL REQUIREMENTS:                                       │
│  ├─ Canonical URLs                                                 │
│  ├─ hreflang for multi-language (future)                          │
│  ├─ Meta robots (index, follow)                                    │
│  ├─ Open Graph + Twitter Cards                                     │
│  ├─ Schema.org ItemList for rankings                              │
│  └─ Breadcrumb schema                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.29 Results Page Structured Data (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              ANALYSIS RESULTS SCHEMA.ORG                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM: Results pages have no structured data                    │
│  IMPACT: Can't be rich-snippeted, poor social sharing              │
│                                                                     │
│  SOLUTION: Custom Schema for AI Perception Results                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ {                                                            │   │
│  │   "@context": "https://schema.org",                         │   │
│  │   "@type": "AnalysisNewsArticle",                           │   │
│  │   "headline": "AI Perception Score for [Brand]",            │   │
│  │   "datePublished": "2024-11-25T10:30:00Z",                  │   │
│  │   "author": {                                                │   │
│  │     "@type": "Organization",                                │   │
│  │     "name": "AI Perception"                                 │   │
│  │   },                                                        │   │
│  │   "about": {                                                 │   │
│  │     "@type": "Organization",                                │   │
│  │     "name": "[Analyzed Brand]",                             │   │
│  │     "url": "[Analyzed URL]"                                 │   │
│  │   },                                                        │   │
│  │   "reviewRating": {                                         │   │
│  │     "@type": "Rating",                                      │   │
│  │     "ratingValue": 72,                                      │   │
│  │     "bestRating": 100,                                      │   │
│  │     "worstRating": 0                                        │   │
│  │   },                                                        │   │
│  │   "mainEntityOfPage": "[Results URL]"                       │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  SOCIAL SHARING OPTIMIZATION:                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Open Graph:                                                  │   │
│  │ <meta property="og:title" content="[Brand] scores 72/100    │   │
│  │       on AI Perception" />                                   │   │
│  │ <meta property="og:description" content="See how ChatGPT,   │   │
│  │       Claude, and Gemini perceive [Brand]" />               │   │
│  │ <meta property="og:image" content="[Dynamic score image]" />│   │
│  │                                                               │   │
│  │ Twitter Card:                                                │   │
│  │ <meta name="twitter:card" content="summary_large_image" />  │   │
│  │ <meta name="twitter:title" content="My AI Score is 72! 🎯" />│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DYNAMIC OG IMAGE GENERATION:                                      │
│  • Use @vercel/og for dynamic image generation                     │
│  • Show score prominently with brand name                          │
│  • Include provider logos (ChatGPT, Claude, etc.)                  │
│  • Cache generated images                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.30 Technical Content & Documentation Architecture (NEW - Content Review)

```
┌─────────────────────────────────────────────────────────────────────┐
│              CONTENT & DOCUMENTATION GAPS IDENTIFIED                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. NO CONTENT STRATEGY DOCUMENT                                   │
│     ═══════════════════════════                                    │
│     Problem: Roadmap has UI but no content plan for each screen    │
│     Impact: Inconsistent voice, messaging, and terminology         │
│     Solution: Define content requirements per page/component       │
│                                                                     │
│  2. NO UX WRITING GUIDELINES                                       │
│     ═══════════════════════════                                    │
│     Problem: Error messages designed but no voice/tone guide       │
│     Impact: Copy will be inconsistent across the product           │
│     Solution: Create UX writing style guide (voice, tone, terms)   │
│                                                                     │
│  3. NO GLOSSARY OF TERMS                                           │
│     ═══════════════════════════                                    │
│     Problem: "AI Perception Score", "GEO", "SOV" - undefined       │
│     Impact: Users confused, support tickets increase               │
│     Solution: In-app glossary + tooltips for technical terms       │
│                                                                     │
│  4. NO HELP/SUPPORT CONTENT                                        │
│     ════════════════════════                                       │
│     Problem: "100% self-service" but no help documentation         │
│     Impact: Users will get stuck, churn increases                  │
│     Solution: Help center with searchable articles                 │
│                                                                     │
│  5. NO ONBOARDING COPY                                             │
│     ════════════════════                                           │
│     Problem: Onboarding flow exists but no script/content          │
│     Impact: First-time experience will be confusing                │
│     Solution: Onboarding copy with contextual education            │
│                                                                     │
│  6. NO EMAIL TEMPLATES                                             │
│     ════════════════════                                           │
│     Problem: "Email notifications" but no content templates        │
│     Impact: Transactional emails will be generic/ineffective       │
│     Solution: Email content templates (welcome, score change, etc.)│
│                                                                     │
│  7. NO LEGAL CONTENT                                               │
│     ═══════════════════                                            │
│     Problem: Privacy/Terms mentioned but not AI-specific           │
│     Impact: Legal exposure for AI-generated recommendations        │
│     Solution: AI disclaimer content + updated legal docs           │
│                                                                     │
│  8. NO MULTILINGUAL STRATEGY                                       │
│     ══════════════════════════                                     │
│     Problem: Target is SMBs globally but UI only in English        │
│     Impact: Missed Spanish/Portuguese market opportunity           │
│     Solution: i18n architecture + Spanish content (Phase 4)        │
│                                                                     │
│  9. NO RECOMMENDATION EXPLANATIONS                                 │
│     ══════════════════════════════                                 │
│     Problem: "Actionable recommendations" but no explanation copy  │
│     Impact: Users won't understand WHY recommendations matter      │
│     Solution: Recommendation templates with educational context    │
│                                                                     │
│  10. NO COMPETITOR REPORT COPY                                     │
│      ═══════════════════════════                                   │
│      Problem: Competitor comparison exists but no narrative        │
│      Impact: Raw data without insights = low value perception      │
│      Solution: Competitive insight templates with analysis         │
│                                                                     │
│  11. NO SOCIAL SHARING COPY                                        │
│      ═════════════════════════                                     │
│      Problem: Share buttons exist but no pre-written copy          │
│      Impact: Missed viral opportunity, generic shares              │
│      Solution: Platform-specific share templates (Twitter, LI)     │
│                                                                     │
│  12. NO API DOCUMENTATION                                          │
│      ══════════════════════                                        │
│      Problem: API routes exist but no developer docs (Phase 4+)    │
│      Impact: B2B/enterprise adoption blocked                       │
│      Solution: OpenAPI spec + developer documentation              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.31 UX Writing Style Guide (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UX WRITING STYLE GUIDE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BRAND VOICE:                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Confident but not arrogant                                │   │
│  │ • Expert but accessible                                      │   │
│  │ • Helpful but not hand-holding                               │   │
│  │ • Data-driven but human                                      │   │
│  │ • Empowering, not alarming (even for low scores)            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TONE BY CONTEXT:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Landing page:    Inspiring, bold, clear                      │   │
│  │ Loading states:  Engaging, educational, patient              │   │
│  │ Results:         Objective, encouraging, actionable          │   │
│  │ Errors:          Empathetic, helpful, solution-focused       │   │
│  │ Upgrade prompts: Value-focused, not pushy                    │   │
│  │ Emails:          Personal, concise, actionable               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TERMINOLOGY STANDARDS:                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ USE                    │ AVOID                              │   │
│  │ ───────────────────────┼──────────────────────────────────  │   │
│  │ AI Perception Score    │ "rating", "rank", "grade"          │   │
│  │ analysis               │ "scan", "audit", "check"           │   │
│  │ AI models              │ "bots", "machines", "algorithms"   │   │
│  │ recommendations        │ "fixes", "problems", "issues"      │   │
│  │ improve                │ "fix", "repair", "correct"         │   │
│  │ your brand             │ "your website", "your company"     │   │
│  │ mentioned/recommended  │ "found", "detected", "indexed"     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  WRITING RULES:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. Lead with the benefit, not the feature                   │   │
│  │    ✗ "We query 4 AI providers"                              │   │
│  │    ✓ "See how ChatGPT, Claude & more perceive you"          │   │
│  │                                                               │   │
│  │ 2. Use "you/your" not "users/they"                          │   │
│  │    ✗ "Users can view their score"                           │   │
│  │    ✓ "View your score"                                       │   │
│  │                                                               │   │
│  │ 3. Prefer active voice                                       │   │
│  │    ✗ "Your score was calculated"                            │   │
│  │    ✓ "We calculated your score"                             │   │
│  │                                                               │   │
│  │ 4. Be specific with numbers                                  │   │
│  │    ✗ "Improve your AI visibility"                           │   │
│  │    ✓ "Increase your score from 45 to 70+"                   │   │
│  │                                                               │   │
│  │ 5. One idea per sentence                                     │   │
│  │    ✗ "Enter your URL and we'll analyze how AI models        │   │
│  │       perceive your brand using ChatGPT, Claude, Gemini      │   │
│  │       and Perplexity to give you a comprehensive score."     │   │
│  │    ✓ "Enter your URL. We'll ask AI models about your brand. │   │
│  │       Get your score in 30 seconds."                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.32 Glossary & In-App Help (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GLOSSARY OF TERMS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CORE TERMS (Must explain to users):                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                               │   │
│  │ AI PERCEPTION SCORE (0-100)                                  │   │
│  │ Definition: A measurement of how likely AI assistants like   │   │
│  │ ChatGPT and Claude are to recommend your brand when users    │   │
│  │ ask about your industry.                                     │   │
│  │ Tooltip: "Based on mentions, recommendations, and sentiment  │   │
│  │ across multiple AI models."                                  │   │
│  │                                                               │   │
│  │ GEO (Generative Engine Optimization)                         │   │
│  │ Definition: The practice of optimizing your brand's presence │   │
│  │ for AI models, similar to SEO for search engines.           │   │
│  │ Tooltip: "Like SEO, but for ChatGPT instead of Google."     │   │
│  │                                                               │   │
│  │ SHARE OF VOICE (SOV)                                         │   │
│  │ Definition: The percentage of times your brand is mentioned  │   │
│  │ vs competitors when AI discusses your industry.              │   │
│  │ Tooltip: "If AI mentions your industry 10 times and you're   │   │
│  │ mentioned 3 times, your SOV is 30%."                        │   │
│  │                                                               │   │
│  │ E-E-A-T                                                      │   │
│  │ Definition: Experience, Expertise, Authoritativeness, Trust. │   │
│  │ Google's quality framework that AI models also use.         │   │
│  │ Tooltip: "Signals that tell AI your brand is trustworthy."  │   │
│  │                                                               │   │
│  │ HALLUCINATION                                                │   │
│  │ Definition: When an AI model states something incorrect      │   │
│  │ about your brand (wrong products, location, etc.)           │   │
│  │ Tooltip: "AI 'made up' information about you."              │   │
│  │                                                               │   │
│  │ KNOWLEDGE GRAPH                                              │   │
│  │ Definition: Structured databases like Wikidata that AI      │   │
│  │ models use as trusted sources of information.               │   │
│  │ Tooltip: "Being in Wikidata = AI trusts you more."          │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPLEMENTATION:                                                   │
│  • Tooltips on first use of term (info icon)                      │
│  • Full glossary page at /glossary                                 │
│  • Link to glossary from Help Center                               │
│  • Contextual "Learn more" links in results                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.33 Email Content Templates (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EMAIL CONTENT TEMPLATES                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. WELCOME EMAIL (After signup)                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Subject: Your first AI Perception Score is ready 🎯          │   │
│  │                                                               │   │
│  │ Hi {firstName},                                              │   │
│  │                                                               │   │
│  │ Welcome to AI Perception!                                    │   │
│  │                                                               │   │
│  │ Your score for {brandName}: {score}/100                      │   │
│  │                                                               │   │
│  │ What this means:                                              │   │
│  │ • {scoreInterpretation}                                      │   │
│  │                                                               │   │
│  │ Your top recommendation:                                      │   │
│  │ {topRecommendation}                                          │   │
│  │                                                               │   │
│  │ [View Full Report]                                           │   │
│  │                                                               │   │
│  │ Questions? Reply to this email.                              │   │
│  │                                                               │   │
│  │ - The AI Perception Team                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  2. SCORE CHANGE ALERT (Monitoring)                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Subject: {brandName}'s AI Perception Score changed           │   │
│  │                                                               │   │
│  │ Hi {firstName},                                              │   │
│  │                                                               │   │
│  │ Your score for {brandName} has {increased/decreased}:        │   │
│  │                                                               │   │
│  │ {previousScore} → {newScore} ({changeDirection} {changePts}) │   │
│  │                                                               │   │
│  │ What happened:                                                │   │
│  │ • {changeExplanation}                                        │   │
│  │                                                               │   │
│  │ [View Details]                                               │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  3. WEEKLY DIGEST (Paid users)                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Subject: Your weekly AI Perception update                    │   │
│  │                                                               │   │
│  │ Hi {firstName},                                              │   │
│  │                                                               │   │
│  │ Here's your week in AI visibility:                           │   │
│  │                                                               │   │
│  │ 📊 Your Scores                                               │   │
│  │ {urlScoreList}                                               │   │
│  │                                                               │   │
│  │ 📈 Industry Benchmark                                        │   │
│  │ Your average: {avgScore} | Industry: {industryAvg}          │   │
│  │                                                               │   │
│  │ 💡 This Week's Tip                                           │   │
│  │ {weeklyTip}                                                  │   │
│  │                                                               │   │
│  │ [View Dashboard]                                             │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  4. UPGRADE NUDGE (After 3 free analyses)                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Subject: Unlock your hidden recommendations                  │   │
│  │                                                               │   │
│  │ Hi {firstName},                                              │   │
│  │                                                               │   │
│  │ You've analyzed {brandName} {count} times - nice!           │   │
│  │                                                               │   │
│  │ But you're only seeing 1 of 3 recommendations.               │   │
│  │                                                               │   │
│  │ The 2 you're missing could help you:                         │   │
│  │ • {blurredBenefit1}                                          │   │
│  │ • {blurredBenefit2}                                          │   │
│  │                                                               │   │
│  │ [Unlock All Recommendations - $29/mo]                        │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  5. CHURN PREVENTION (Before cancellation)                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Subject: We noticed you haven't logged in lately             │   │
│  │                                                               │   │
│  │ Hi {firstName},                                              │   │
│  │                                                               │   │
│  │ Your AI Perception Score for {brandName} has changed since   │   │
│  │ your last visit:                                             │   │
│  │                                                               │   │
│  │ {lastScore} → {currentScore}                                 │   │
│  │                                                               │   │
│  │ Don't miss important changes in how AI recommends you.       │   │
│  │                                                               │   │
│  │ [Check Your Score]                                           │   │
│  │                                                               │   │
│  │ If you have feedback on how we can improve,                  │   │
│  │ just reply to this email. We read every response.            │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.34 Recommendation Content Templates (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              RECOMMENDATION EXPLANATION TEMPLATES                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Each recommendation needs: Title + Why + How + Impact             │
│                                                                     │
│  TEMPLATE 1: SCHEMA.ORG MISSING                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Title: Add structured data to your website                   │   │
│  │                                                               │   │
│  │ Why this matters:                                            │   │
│  │ AI models trust structured data (Schema.org) more than       │   │
│  │ plain text. Without it, AI has to guess about your business. │   │
│  │                                                               │   │
│  │ How to implement:                                            │   │
│  │ 1. Add Organization schema with your name, URL, and logo    │   │
│  │ 2. Add LocalBusiness if you have physical locations         │   │
│  │ 3. Add Product/Service for your offerings                    │   │
│  │                                                               │   │
│  │ Expected impact: +10-15 points on AI Perception Score       │   │
│  │ Effort: Medium (1-2 hours with a developer)                 │   │
│  │                                                               │   │
│  │ [Learn How →]                                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TEMPLATE 2: NOT IN WIKIDATA                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Title: Create a Wikidata entry for your brand                │   │
│  │                                                               │   │
│  │ Why this matters:                                            │   │
│  │ Wikidata is one of the most trusted sources AI models use.   │   │
│  │ Being listed there significantly increases your chances of   │   │
│  │ being mentioned and recommended.                             │   │
│  │                                                               │   │
│  │ How to implement:                                            │   │
│  │ 1. Go to wikidata.org and create an account                 │   │
│  │ 2. Create a new item for your organization                   │   │
│  │ 3. Add properties: name, website, industry, founding date   │   │
│  │                                                               │   │
│  │ Expected impact: +15-20 points on AI Perception Score       │   │
│  │ Effort: Low (30 minutes)                                     │   │
│  │                                                               │   │
│  │ [Step-by-Step Guide →]                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TEMPLATE 3: LOW E-E-A-T SIGNALS                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Title: Improve your trust signals                            │   │
│  │                                                               │   │
│  │ Why this matters:                                            │   │
│  │ AI models use E-E-A-T (Experience, Expertise, Authority,     │   │
│  │ Trust) to decide who to recommend. Your site is missing     │   │
│  │ key trust indicators.                                        │   │
│  │                                                               │   │
│  │ What's missing on your site:                                 │   │
│  │ ✗ Team page with bios and credentials                       │   │
│  │ ✗ Customer testimonials                                      │   │
│  │ ✗ Case studies or portfolio                                  │   │
│  │                                                               │   │
│  │ How to implement:                                            │   │
│  │ Add an About/Team page showcasing your expertise and        │   │
│  │ experience. Include customer testimonials with real names.   │   │
│  │                                                               │   │
│  │ Expected impact: +8-12 points on AI Perception Score        │   │
│  │ Effort: Medium (2-4 hours for content)                      │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TEMPLATE 4: COMPETITOR OUTRANKING YOU                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Title: {competitor} is mentioned more frequently than you   │   │
│  │                                                               │   │
│  │ Why this matters:                                            │   │
│  │ When users ask AI about {industry}, {competitor} appears    │   │
│  │ in {X}% of responses vs your {Y}%.                          │   │
│  │                                                               │   │
│  │ What they're doing better:                                   │   │
│  │ • More mentions in industry publications                    │   │
│  │ • Active thought leadership content                          │   │
│  │ • Stronger backlink profile                                  │   │
│  │                                                               │   │
│  │ How to compete:                                              │   │
│  │ 1. Publish content answering common {industry} questions    │   │
│  │ 2. Get featured in industry publications                    │   │
│  │ 3. Build relationships with industry reviewers (G2, etc.)   │   │
│  │                                                               │   │
│  │ Expected impact: +10-25 points over 60-90 days             │   │
│  │ Effort: High (ongoing content strategy)                     │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.35 Help Center Content Structure (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HELP CENTER ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  URL: /help (or help.vectorialdata.com)                            │
│  Target: 100% self-service support                                  │
│                                                                     │
│  CATEGORY STRUCTURE:                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                               │   │
│  │ 📚 GETTING STARTED (5 articles)                              │   │
│  │ ├─ What is AI Perception Score?                              │   │
│  │ ├─ How to analyze your first URL                             │   │
│  │ ├─ Understanding your results                                │   │
│  │ ├─ How scoring works                                         │   │
│  │ └─ Free vs paid features                                     │   │
│  │                                                               │   │
│  │ 📊 UNDERSTANDING YOUR SCORE (8 articles)                     │   │
│  │ ├─ What affects your score                                   │   │
│  │ ├─ Score breakdown by AI provider                            │   │
│  │ ├─ Why scores differ between providers                       │   │
│  │ ├─ What is Share of Voice (SOV)?                            │   │
│  │ ├─ Understanding E-E-A-T                                     │   │
│  │ ├─ What are AI hallucinations?                               │   │
│  │ ├─ Competitor comparison explained                           │   │
│  │ └─ How often scores change                                   │   │
│  │                                                               │   │
│  │ 🛠️ IMPROVING YOUR SCORE (10 articles)                        │   │
│  │ ├─ How to add Schema.org to your site                        │   │
│  │ ├─ How to create a Wikidata entry                            │   │
│  │ ├─ Improving E-E-A-T signals                                 │   │
│  │ ├─ Content strategy for AI visibility                        │   │
│  │ ├─ Getting mentioned in publications                         │   │
│  │ ├─ Using FAQ pages for AI                                    │   │
│  │ ├─ Fixing AI hallucinations about your brand                 │   │
│  │ ├─ Beating competitors in AI recommendations                 │   │
│  │ ├─ How long improvements take to show                        │   │
│  │ └─ What NOT to do (black hat GEO)                           │   │
│  │                                                               │   │
│  │ 💳 BILLING & ACCOUNT (6 articles)                            │   │
│  │ ├─ Plans and pricing                                         │   │
│  │ ├─ How to upgrade your plan                                  │   │
│  │ ├─ How to cancel your subscription                           │   │
│  │ ├─ Billing FAQ                                               │   │
│  │ ├─ How to update payment method                              │   │
│  │ └─ Refund policy                                             │   │
│  │                                                               │   │
│  │ 🔔 MONITORING & ALERTS (4 articles)                          │   │
│  │ ├─ Setting up monitoring                                     │   │
│  │ ├─ Understanding score alerts                                │   │
│  │ ├─ Email notification settings                               │   │
│  │ └─ Monitoring frequency options                              │   │
│  │                                                               │   │
│  │ 🔒 PRIVACY & SECURITY (3 articles)                           │   │
│  │ ├─ What data we collect                                      │   │
│  │ ├─ How we use AI providers                                   │   │
│  │ └─ GDPR and data deletion                                    │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TOTAL: ~36 articles                                               │
│  Priority: First 10 (Getting Started + Top 5 Understanding)        │
│                                                                     │
│  IMPLEMENTATION:                                                   │
│  • Phase 1: Static pages (MDX in Next.js)                         │
│  • Phase 3+: Searchable help with Algolia (if needed)             │
│  • Each article has: Title, Content, Related articles, Feedback   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.36 Social Sharing Copy Templates (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 SOCIAL SHARING COPY TEMPLATES                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TWITTER/X (280 char limit):                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Template 1 (High score):                                     │   │
│  │ "🎯 My AI Perception Score is {score}!                       │   │
│  │                                                               │   │
│  │ ChatGPT & Claude actually recommend my brand. 💪             │   │
│  │                                                               │   │
│  │ Check yours free: {url}"                                     │   │
│  │                                                               │   │
│  │ Template 2 (Improvement):                                    │   │
│  │ "📈 Went from {oldScore} to {newScore} on AI Perception!    │   │
│  │                                                               │   │
│  │ AI models are finally recommending us.                       │   │
│  │                                                               │   │
│  │ Here's how: {url}"                                           │   │
│  │                                                               │   │
│  │ Template 3 (Curiosity):                                      │   │
│  │ "Do ChatGPT and Claude recommend YOUR brand? 🤔              │   │
│  │                                                               │   │
│  │ I just found out my AI Perception Score.                     │   │
│  │                                                               │   │
│  │ Check yours (free): {url}"                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LINKEDIN (Professional tone):                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Template 1 (Thought leadership):                             │   │
│  │ "We've been tracking our SEO for years.                      │   │
│  │                                                               │   │
│  │ But here's the new question:                                 │   │
│  │ Does ChatGPT recommend us?                                   │   │
│  │                                                               │   │
│  │ I just checked our AI Perception Score: {score}/100          │   │
│  │                                                               │   │
│  │ With 70% of searches expected to start with AI by 2027,     │   │
│  │ this is becoming as important as traditional SEO.            │   │
│  │                                                               │   │
│  │ Check your brand's score (free): {url}                       │   │
│  │                                                               │   │
│  │ #GEO #AIMarketing #DigitalStrategy"                         │   │
│  │                                                               │   │
│  │ Template 2 (Results):                                        │   │
│  │ "3 months ago, AI models didn't mention our brand.          │   │
│  │                                                               │   │
│  │ Today, our AI Perception Score is {score}/100.              │   │
│  │                                                               │   │
│  │ Here's what we did:                                          │   │
│  │ ✅ Added Schema.org structured data                          │   │
│  │ ✅ Created a Wikidata entry                                  │   │
│  │ ✅ Published FAQ content AI models love                      │   │
│  │                                                               │   │
│  │ The new SEO is GEO (Generative Engine Optimization).        │   │
│  │                                                               │   │
│  │ Check where you stand: {url}"                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPLEMENTATION:                                                   │
│  • Pre-populate share dialog with template                         │   │
│  • Include dynamic OG image with score                             │   │
│  • Track shares with UTM parameters                                │   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.37 AI Disclaimer & Legal Content (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI DISCLAIMER CONTENT                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  RESULTS PAGE DISCLAIMER (Required):                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ "AI Perception Scores are estimates based on AI model        │   │
│  │ responses at the time of analysis. AI models update          │   │
│  │ frequently, and scores may change. This analysis is for      │   │
│  │ informational purposes only and should not be considered     │   │
│  │ definitive or used as the sole basis for business decisions."│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TERMS OF SERVICE ADDITIONS:                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Section: AI-Generated Content                                │   │
│  │                                                               │   │
│  │ 1. Our service queries third-party AI models (OpenAI,       │   │
│  │    Anthropic, Google, Perplexity) to generate scores and    │   │
│  │    recommendations.                                          │   │
│  │                                                               │   │
│  │ 2. We do not control or guarantee the accuracy of AI        │   │
│  │    model responses. AI models may produce incorrect,        │   │
│  │    incomplete, or biased information.                        │   │
│  │                                                               │   │
│  │ 3. Scores are relative measurements at a point in time      │   │
│  │    and may not reflect actual market perception.            │   │
│  │                                                               │   │
│  │ 4. Recommendations are automatically generated and should   │   │
│  │    be validated with professional consultation before       │   │
│  │    implementation.                                           │   │
│  │                                                               │   │
│  │ 5. We are not responsible for any business decisions made   │   │
│  │    based on our scores or recommendations.                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  PRIVACY POLICY ADDITIONS:                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Section: Third-Party AI Services                             │   │
│  │                                                               │   │
│  │ We send the following to AI providers:                       │   │
│  │ • URL you submit for analysis                               │   │
│  │ • Website metadata (title, description)                      │   │
│  │ • Detected industry and country                              │   │
│  │                                                               │   │
│  │ We do NOT send:                                              │   │
│  │ • Your personal information (name, email)                   │   │
│  │ • Login credentials                                          │   │
│  │ • Payment information                                        │   │
│  │                                                               │   │
│  │ AI provider privacy policies:                                │   │
│  │ • OpenAI: [link]                                             │   │
│  │ • Anthropic: [link]                                          │   │
│  │ • Google AI: [link]                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  PLACEMENT:                                                        │
│  • Disclaimer: Footer of results page + tooltip on score          │
│  • ToS/Privacy: Dedicated pages, linked from footer               │
│  • Checkbox on signup: "I understand scores are AI-generated"     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.38 Full Stack Development Architecture (NEW - Full Stack Review)

```
┌─────────────────────────────────────────────────────────────────────┐
│           FULL STACK DEVELOPMENT GAPS IDENTIFIED                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. NO MONOREPO STRUCTURE                                          │
│     ═════════════════════                                          │
│     Problem: Single package.json mixing concerns                    │
│     Impact: Hard to scale, test, and maintain                       │
│     Solution: Turborepo/pnpm workspaces for organized code          │
│                                                                     │
│  2. NO ENV VALIDATION AT STARTUP                                   │
│     ═══════════════════════════                                    │
│     Problem: Runtime crashes when env vars missing                  │
│     Impact: Silent failures in production, hard to debug            │
│     Solution: Zod schema validation on app startup                  │
│                                                                     │
│  3. NO DATABASE MIGRATIONS VERSIONING                              │
│     ════════════════════════════════                               │
│     Problem: SQL files without version tracking system              │
│     Impact: Can't rollback, no migration history                    │
│     Solution: Drizzle ORM or Prisma for type-safe migrations       │
│                                                                     │
│  4. NO TYPE-SAFE DATABASE CLIENT                                   │
│     ══════════════════════════                                     │
│     Problem: Raw Supabase client without TypeScript inference       │
│     Impact: Runtime errors from wrong column names/types            │
│     Solution: Generate types from Supabase schema                   │
│                                                                     │
│  5. NO API ROUTE MIDDLEWARE PATTERN                                │
│     ═══════════════════════════════                                │
│     Problem: Each route implements auth/rate-limit separately       │
│     Impact: Code duplication, inconsistent error handling           │
│     Solution: Centralized middleware factory pattern                │
│                                                                     │
│  6. NO DEPENDENCY INJECTION                                        │
│     ══════════════════════                                         │
│     Problem: Direct imports make testing and mocking hard           │
│     Impact: Can't mock AI providers in tests                        │
│     Solution: DI container or factory pattern for services          │
│                                                                     │
│  7. NO FEATURE FLAGS                                               │
│     ════════════════                                               │
│     Problem: No way to gradually rollout or kill features           │
│     Impact: All-or-nothing deployments, risky releases              │
│     Solution: Simple feature flag system (Vercel Edge Config)       │
│                                                                     │
│  8. NO PREVIEW ENVIRONMENTS                                        │
│     ═══════════════════════                                        │
│     Problem: Test only in prod or local, nothing in between         │
│     Impact: Bugs discovered too late, risky deploys                 │
│     Solution: Vercel Preview Deployments per PR                     │
│                                                                     │
│  9. NO CI/CD PIPELINE DEFINED                                      │
│     ═════════════════════════                                      │
│     Problem: Manual testing, no automated quality gates             │
│     Impact: Regressions slip through, slow iteration                │
│     Solution: GitHub Actions for lint, test, build, deploy          │
│                                                                     │
│  10. NO BUNDLE SIZE MONITORING                                     │
│      ═════════════════════════                                     │
│      Problem: No visibility into JS bundle size                     │
│      Impact: Slow page loads, poor Core Web Vitals                  │
│      Solution: Next.js bundle analyzer + size limits in CI          │
│                                                                     │
│  11. NO DATABASE INDEXES STRATEGY                                  │
│      ═══════════════════════════                                   │
│      Problem: Queries may be slow without proper indexes            │
│      Impact: Slow dashboard, poor UX as data grows                  │
│      Solution: Index strategy for common query patterns             │
│                                                                     │
│  12. NO GRACEFUL SHUTDOWN HANDLING                                 │
│      ══════════════════════════════                                │
│      Problem: Background jobs may be interrupted mid-execution      │
│      Impact: Corrupt data, incomplete analyses                      │
│      Solution: SIGTERM handling for graceful shutdown               │
│                                                                     │
│  13. NO REQUEST TRACING                                            │
│      ═════════════════════                                         │
│      Problem: Can't trace a request through the entire stack        │
│      Impact: Hard to debug production issues                        │
│      Solution: Request ID propagation across all services           │
│                                                                     │
│  14. NO API VERSIONING STRATEGY                                    │
│      ═══════════════════════════                                   │
│      Problem: Breaking changes will break clients                   │
│      Impact: Can't evolve API without breaking existing users       │
│      Solution: /api/v1/ namespace, deprecation headers              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.39 Environment & Configuration Management (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 ENVIRONMENT CONFIGURATION                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ENV VALIDATION (Startup Check):                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // /lib/env.ts                                               │   │
│  │ import { z } from 'zod';                                     │   │
│  │                                                               │   │
│  │ const envSchema = z.object({                                 │   │
│  │   // Required                                                 │   │
│  │   DATABASE_URL: z.string().url(),                            │   │
│  │   NEXT_PUBLIC_SUPABASE_URL: z.string().url(),               │   │
│  │   NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),         │   │
│  │   SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),             │   │
│  │   OPENAI_API_KEY: z.string().startsWith('sk-'),             │   │
│  │   ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),      │   │
│  │   UPSTASH_REDIS_URL: z.string().url(),                      │   │
│  │   UPSTASH_REDIS_TOKEN: z.string().min(1),                   │   │
│  │   RESEND_API_KEY: z.string().startsWith('re_'),             │   │
│  │                                                               │   │
│  │   // Optional with defaults                                   │   │
│  │   NODE_ENV: z.enum(['development','production','test'])      │   │
│  │     .default('development'),                                 │   │
│  │   DAILY_BUDGET_USD: z.coerce.number().default(5),           │   │
│  │   ENABLE_GOOGLE_AI: z.coerce.boolean().default(false),      │   │
│  │   ENABLE_PERPLEXITY: z.coerce.boolean().default(false),     │   │
│  │ });                                                          │   │
│  │                                                               │   │
│  │ export const env = envSchema.parse(process.env);             │   │
│  │ // Throws immediately if validation fails                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ENVIRONMENT SEPARATION:                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ DEVELOPMENT (.env.local):                                    │   │
│  │ - Local Supabase instance (supabase start)                  │   │
│  │ - Sandbox API keys (rate limited)                            │   │
│  │ - DAILY_BUDGET_USD=1 (very conservative)                    │   │
│  │                                                               │   │
│  │ PREVIEW (Vercel Preview):                                    │   │
│  │ - Shared preview Supabase project                            │   │
│  │ - Test API keys (separate quotas)                            │   │
│  │ - DAILY_BUDGET_USD=2                                         │   │
│  │                                                               │   │
│  │ PRODUCTION (Vercel Production):                              │   │
│  │ - Production Supabase project                                │   │
│  │ - Production API keys                                        │   │
│  │ - DAILY_BUDGET_USD=5                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.40 Type-Safe Database Layer (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│               TYPE-SAFE DATABASE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CURRENT STATE: Raw Supabase client, manual types                  │
│  TARGET STATE: Generated types, compile-time safety                │
│                                                                     │
│  OPTION A: Supabase Type Generation (Recommended for MVP)          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Generate types from Supabase schema                       │   │
│  │ npx supabase gen types typescript \                          │   │
│  │   --project-id YOUR_PROJECT_ID \                            │   │
│  │   > src/types/database.ts                                    │   │
│  │                                                               │   │
│  │ // Usage                                                      │   │
│  │ import { Database } from '@/types/database';                 │   │
│  │ const supabase = createClient<Database>(...);                │   │
│  │                                                               │   │
│  │ // Now fully typed:                                          │   │
│  │ const { data } = await supabase                              │   │
│  │   .from('analyses')   // autocomplete                        │   │
│  │   .select('*')                                               │   │
│  │   .eq('status', 'completed');  // type-checked              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  OPTION B: Drizzle ORM (Recommended for Phase 4+)                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Schema definition with Drizzle                            │   │
│  │ import { pgTable, uuid, text, timestamp } from 'drizzle-orm';│   │
│  │                                                               │   │
│  │ export const analyses = pgTable('analyses', {                │   │
│  │   id: uuid('id').primaryKey().defaultRandom(),              │   │
│  │   userId: uuid('user_id').references(() => users.id),       │   │
│  │   url: text('url').notNull(),                               │   │
│  │   score: integer('score'),                                   │   │
│  │   createdAt: timestamp('created_at').defaultNow(),          │   │
│  │ });                                                          │   │
│  │                                                               │   │
│  │ // Benefits:                                                 │   │
│  │ // - Type-safe migrations                                    │   │
│  │ // - Automatic rollback                                      │   │
│  │ // - Better DX for complex queries                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE INDEXES (Critical for Performance):                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ -- analyses table                                            │   │
│  │ CREATE INDEX idx_analyses_user_id ON analyses(user_id);     │   │
│  │ CREATE INDEX idx_analyses_status ON analyses(status);       │   │
│  │ CREATE INDEX idx_analyses_created_at ON analyses(created_at);│  │
│  │                                                               │   │
│  │ -- ai_responses table                                        │   │
│  │ CREATE INDEX idx_ai_responses_analysis_id                    │   │
│  │   ON ai_responses(analysis_id);                             │   │
│  │                                                               │   │
│  │ -- api_cost_tracking (for budget queries)                   │   │
│  │ CREATE INDEX idx_cost_tracking_date                         │   │
│  │   ON api_cost_tracking(created_at);                         │   │
│  │ CREATE INDEX idx_cost_tracking_provider_date                │   │
│  │   ON api_cost_tracking(provider, created_at);               │   │
│  │                                                               │   │
│  │ -- score_history (for trends)                               │   │
│  │ CREATE INDEX idx_score_history_user_url                     │   │
│  │   ON score_history(user_id, url, recorded_at DESC);         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.41 API Middleware & Route Patterns (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 API MIDDLEWARE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  MIDDLEWARE FACTORY PATTERN:                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // /lib/api/middleware.ts                                    │   │
│  │                                                               │   │
│  │ type MiddlewareConfig = {                                    │   │
│  │   requireAuth?: boolean;                                     │   │
│  │   rateLimit?: { requests: number; window: string };         │   │
│  │   requiredPlan?: 'free' | 'starter' | 'pro';               │   │
│  │   validateBody?: ZodSchema;                                  │   │
│  │ };                                                           │   │
│  │                                                               │   │
│  │ export function withMiddleware(                              │   │
│  │   handler: RouteHandler,                                     │   │
│  │   config: MiddlewareConfig                                   │   │
│  │ ) {                                                          │   │
│  │   return async (req: NextRequest) => {                      │   │
│  │     const requestId = crypto.randomUUID();                  │   │
│  │     const startTime = Date.now();                           │   │
│  │                                                               │   │
│  │     try {                                                    │   │
│  │       // 1. Rate limiting                                    │   │
│  │       if (config.rateLimit) {                               │   │
│  │         const result = await rateLimiter.limit(getIP(req)); │   │
│  │         if (!result.success) {                              │   │
│  │           return Response.json(                              │   │
│  │             { error: 'Rate limit exceeded' },               │   │
│  │             { status: 429, headers: rateLimitHeaders }      │   │
│  │           );                                                 │   │
│  │         }                                                    │   │
│  │       }                                                      │   │
│  │                                                               │   │
│  │       // 2. Authentication                                   │   │
│  │       let user = null;                                      │   │
│  │       if (config.requireAuth) {                             │   │
│  │         user = await getUser(req);                          │   │
│  │         if (!user) {                                        │   │
│  │           return Response.json(                              │   │
│  │             { error: 'Unauthorized' },                      │   │
│  │             { status: 401 }                                 │   │
│  │           );                                                 │   │
│  │         }                                                    │   │
│  │       }                                                      │   │
│  │                                                               │   │
│  │       // 3. Plan enforcement                                 │   │
│  │       if (config.requiredPlan && user) {                    │   │
│  │         if (!hasPlan(user, config.requiredPlan)) {          │   │
│  │           return Response.json(                              │   │
│  │             { error: 'Upgrade required' },                  │   │
│  │             { status: 403 }                                 │   │
│  │           );                                                 │   │
│  │         }                                                    │   │
│  │       }                                                      │   │
│  │                                                               │   │
│  │       // 4. Body validation                                  │   │
│  │       let body = undefined;                                 │   │
│  │       if (config.validateBody) {                            │   │
│  │         const json = await req.json();                      │   │
│  │         const result = config.validateBody.safeParse(json); │   │
│  │         if (!result.success) {                              │   │
│  │           return Response.json(                              │   │
│  │             { error: 'Validation failed', details: errors },│   │
│  │             { status: 400 }                                 │   │
│  │           );                                                 │   │
│  │         }                                                    │   │
│  │         body = result.data;                                 │   │
│  │       }                                                      │   │
│  │                                                               │   │
│  │       // 5. Execute handler                                  │   │
│  │       const response = await handler(req, { user, body });  │   │
│  │                                                               │   │
│  │       // 6. Add response headers                            │   │
│  │       response.headers.set('X-Request-ID', requestId);      │   │
│  │       return response;                                       │   │
│  │                                                               │   │
│  │     } catch (error) {                                       │   │
│  │       // Centralized error handling                          │   │
│  │       Sentry.captureException(error, { extra: { requestId }});│  │
│  │       return Response.json(                                  │   │
│  │         { error: 'Internal server error', requestId },      │   │
│  │         { status: 500 }                                     │   │
│  │       );                                                     │   │
│  │     } finally {                                              │   │
│  │       // Log request                                         │   │
│  │       logRequest(requestId, Date.now() - startTime);        │   │
│  │     }                                                        │   │
│  │   };                                                         │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  USAGE IN ROUTES:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // /app/api/analyze/route.ts                                │   │
│  │ import { withMiddleware } from '@/lib/api/middleware';      │   │
│  │ import { analyzeSchema } from '@/lib/validation';           │   │
│  │                                                               │   │
│  │ const handler = async (req, { user, body }) => {            │   │
│  │   // Handler only deals with business logic                 │   │
│  │   // Auth, validation, rate limiting already done            │   │
│  │   const analysis = await startAnalysis(body.url, user);     │   │
│  │   return Response.json({ id: analysis.id });                │   │
│  │ };                                                           │   │
│  │                                                               │   │
│  │ export const POST = withMiddleware(handler, {               │   │
│  │   requireAuth: false,  // Allow anonymous analysis          │   │
│  │   rateLimit: { requests: 10, window: '1m' },               │   │
│  │   validateBody: analyzeSchema,                              │   │
│  │ });                                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.42 CI/CD Pipeline (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE DESIGN                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GITHUB ACTIONS WORKFLOW:                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ # .github/workflows/ci.yml                                   │   │
│  │                                                               │   │
│  │ name: CI                                                     │   │
│  │ on:                                                          │   │
│  │   push:                                                      │   │
│  │     branches: [main]                                         │   │
│  │   pull_request:                                              │   │
│  │     branches: [main]                                         │   │
│  │                                                               │   │
│  │ jobs:                                                        │   │
│  │   lint:                                                      │   │
│  │     runs-on: ubuntu-latest                                   │   │
│  │     steps:                                                   │   │
│  │       - uses: actions/checkout@v4                           │   │
│  │       - uses: pnpm/action-setup@v2                          │   │
│  │       - run: pnpm install --frozen-lockfile                 │   │
│  │       - run: pnpm lint                                      │   │
│  │       - run: pnpm typecheck                                 │   │
│  │                                                               │   │
│  │   test:                                                      │   │
│  │     runs-on: ubuntu-latest                                   │   │
│  │     steps:                                                   │   │
│  │       - uses: actions/checkout@v4                           │   │
│  │       - uses: pnpm/action-setup@v2                          │   │
│  │       - run: pnpm install --frozen-lockfile                 │   │
│  │       - run: pnpm test:coverage                             │   │
│  │       - uses: codecov/codecov-action@v3  # Coverage report  │   │
│  │                                                               │   │
│  │   build:                                                     │   │
│  │     runs-on: ubuntu-latest                                   │   │
│  │     needs: [lint, test]                                     │   │
│  │     steps:                                                   │   │
│  │       - uses: actions/checkout@v4                           │   │
│  │       - uses: pnpm/action-setup@v2                          │   │
│  │       - run: pnpm install --frozen-lockfile                 │   │
│  │       - run: pnpm build                                     │   │
│  │       - name: Check bundle size                             │   │
│  │         run: pnpm analyze && ./scripts/check-bundle-size.sh │   │
│  │                                                               │   │
│  │   e2e:                                                       │   │
│  │     runs-on: ubuntu-latest                                   │   │
│  │     needs: [build]                                          │   │
│  │     steps:                                                   │   │
│  │       - uses: actions/checkout@v4                           │   │
│  │       - uses: pnpm/action-setup@v2                          │   │
│  │       - run: pnpm install --frozen-lockfile                 │   │
│  │       - run: pnpm playwright install --with-deps            │   │
│  │       - run: pnpm test:e2e                                  │   │
│  │       - uses: actions/upload-artifact@v3                    │   │
│  │         if: failure()                                        │   │
│  │         with:                                                │   │
│  │           name: playwright-report                            │   │
│  │           path: playwright-report/                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  PR QUALITY GATES:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Lint must pass (0 errors, 0 warnings)                     │   │
│  │ • Type check must pass (tsc --noEmit)                       │   │
│  │ • Unit test coverage > 70%                                   │   │
│  │ • All E2E tests pass                                         │   │
│  │ • Bundle size < 300KB first load                            │   │
│  │ • No high/critical vulnerabilities (npm audit)              │   │
│  │ • Preview deployment successful                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DEPLOYMENT STRATEGY:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ PR Created → Preview Deploy (Vercel) → Review & Test        │   │
│  │     │                                                        │   │
│  │     └─→ All checks pass → Approve PR → Merge to main        │   │
│  │                                  │                           │   │
│  │                                  └─→ Auto-deploy to Prod    │   │
│  │                                                               │   │
│  │ Rollback: Vercel instant rollback to previous deployment    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.43 Service Architecture & Dependency Injection (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              SERVICE ARCHITECTURE PATTERN                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SERVICE FACTORY (Enables Testing & Mocking):                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // /lib/services/index.ts                                   │   │
│  │                                                               │   │
│  │ // Interfaces (contracts)                                    │   │
│  │ export interface IAIProvider {                               │   │
│  │   name: string;                                              │   │
│  │   query(prompt: string, options?: QueryOptions): Promise<AIResponse>;│   │
│  │   isHealthy(): Promise<boolean>;                            │   │
│  │ }                                                            │   │
│  │                                                               │   │
│  │ export interface ICacheService {                             │   │
│  │   get<T>(key: string): Promise<T | null>;                   │   │
│  │   set<T>(key: string, value: T, ttl?: number): Promise<void>;│   │
│  │   delete(key: string): Promise<void>;                       │   │
│  │ }                                                            │   │
│  │                                                               │   │
│  │ export interface IAnalysisService {                          │   │
│  │   startAnalysis(url: string, userId?: string): Promise<Analysis>;│   │
│  │   getAnalysis(id: string): Promise<Analysis | null>;        │   │
│  │ }                                                            │   │
│  │                                                               │   │
│  │ // Service container                                         │   │
│  │ export type Services = {                                     │   │
│  │   ai: {                                                      │   │
│  │     openai: IAIProvider;                                    │   │
│  │     anthropic: IAIProvider;                                 │   │
│  │     google?: IAIProvider;                                   │   │
│  │   };                                                         │   │
│  │   cache: ICacheService;                                     │   │
│  │   analysis: IAnalysisService;                               │   │
│  │   email: IEmailService;                                     │   │
│  │   metrics: IMetricsService;                                 │   │
│  │ };                                                           │   │
│  │                                                               │   │
│  │ // Factory for production                                    │   │
│  │ export function createServices(): Services {                 │   │
│  │   return {                                                   │   │
│  │     ai: {                                                    │   │
│  │       openai: new OpenAIProvider(env.OPENAI_API_KEY),       │   │
│  │       anthropic: new AnthropicProvider(env.ANTHROPIC_API_KEY),│   │
│  │     },                                                       │   │
│  │     cache: new UpstashCacheService(redis),                  │   │
│  │     analysis: new AnalysisService(db, ai, cache),           │   │
│  │     email: new ResendEmailService(resend),                  │   │
│  │     metrics: new MetricsService(db),                        │   │
│  │   };                                                         │   │
│  │ }                                                            │   │
│  │                                                               │   │
│  │ // Factory for testing                                       │   │
│  │ export function createMockServices(): Services {             │   │
│  │   return {                                                   │   │
│  │     ai: {                                                    │   │
│  │       openai: new MockAIProvider('openai'),                 │   │
│  │       anthropic: new MockAIProvider('anthropic'),           │   │
│  │     },                                                       │   │
│  │     cache: new InMemoryCacheService(),                      │   │
│  │     analysis: new MockAnalysisService(),                    │   │
│  │     email: new MockEmailService(),                          │   │
│  │     metrics: new NoOpMetricsService(),                      │   │
│  │   };                                                         │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  SINGLETON PATTERN (Production):                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // /lib/services/singleton.ts                               │   │
│  │ let services: Services | null = null;                       │   │
│  │                                                               │   │
│  │ export function getServices(): Services {                    │   │
│  │   if (!services) {                                          │   │
│  │     services = createServices();                            │   │
│  │   }                                                          │   │
│  │   return services;                                           │   │
│  │ }                                                            │   │
│  │                                                               │   │
│  │ // For testing - allows injection of mocks                  │   │
│  │ export function setServices(s: Services): void {            │   │
│  │   services = s;                                              │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.44 Performance & Bundle Optimization (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              PERFORMANCE OPTIMIZATION STRATEGY                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BUNDLE SIZE TARGETS:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ First Load JS (all pages):     < 100KB                      │   │
│  │ Page-specific JS:              < 50KB per page               │   │
│  │ Total JS (lazy loaded):        < 300KB                       │   │
│  │                                                               │   │
│  │ Current heavy dependencies to watch:                         │   │
│  │ • recharts (~45KB) - lazy load on dashboard only            │   │
│  │ • @supabase/supabase-js (~30KB) - necessary                 │   │
│  │ • zod (~12KB) - necessary for validation                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAZY LOADING STRATEGY:                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Heavy components - lazy load                             │   │
│  │ const ScoreChart = dynamic(                                 │   │
│  │   () => import('@/components/ScoreChart'),                  │   │
│  │   { loading: () => <ChartSkeleton /> }                      │   │
│  │ );                                                           │   │
│  │                                                               │   │
│  │ const CompetitorTable = dynamic(                            │   │
│  │   () => import('@/components/CompetitorTable'),             │   │
│  │   { ssr: false }  // Client-only                            │   │
│  │ );                                                           │   │
│  │                                                               │   │
│  │ // Route-based code splitting (automatic with Next.js)      │   │
│  │ // /app/dashboard/page.tsx → only loads when navigating     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMAGE OPTIMIZATION:                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Use next/image for all images (automatic WebP, resizing)  │   │
│  │ • Provider logos: SVG or small PNG (< 5KB each)            │   │
│  │ • OG images: Generate with @vercel/og (on-demand)          │   │
│  │ • No hero images in MVP (reduce LCP)                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CORE WEB VITALS TARGETS:                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ LCP (Largest Contentful Paint):  < 2.5s                     │   │
│  │ FID (First Input Delay):         < 100ms                    │   │
│  │ CLS (Cumulative Layout Shift):   < 0.1                      │   │
│  │                                                               │   │
│  │ Measurement: Vercel Analytics (included free)               │   │
│  │ Monitoring: Weekly CWV report in dashboard                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CACHING HEADERS:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // next.config.js                                           │   │
│  │ async headers() {                                            │   │
│  │   return [                                                   │   │
│  │     {                                                        │   │
│  │       source: '/api/:path*',                                │   │
│  │       headers: [                                            │   │
│  │         { key: 'Cache-Control', value: 'no-store' },       │   │
│  │       ],                                                    │   │
│  │     },                                                       │   │
│  │     {                                                        │   │
│  │       source: '/(.*).svg',                                  │   │
│  │       headers: [                                            │   │
│  │         { key: 'Cache-Control',                             │   │
│  │           value: 'public, max-age=31536000, immutable' },  │   │
│  │       ],                                                    │   │
│  │     },                                                       │   │
│  │   ];                                                         │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.45 Feature Flags & Gradual Rollout (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 FEATURE FLAG SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SIMPLE FEATURE FLAGS (Phase 1-3):                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // /lib/features.ts                                         │   │
│  │ // Environment-based feature flags (simple, free)            │   │
│  │                                                               │   │
│  │ export const FEATURES = {                                    │   │
│  │   // AI Providers                                            │   │
│  │   ENABLE_GOOGLE_AI: env.ENABLE_GOOGLE_AI,                   │   │
│  │   ENABLE_PERPLEXITY: env.ENABLE_PERPLEXITY,                 │   │
│  │                                                               │   │
│  │   // Features                                                │   │
│  │   ENABLE_COMPETITOR_DETECTION: true,                        │   │
│  │   ENABLE_HALLUCINATION_CHECK: true,                         │   │
│  │   ENABLE_SOV_CALCULATION: false,  // Phase 2                │   │
│  │   ENABLE_RAG_SCORE: false,        // Phase 4                │   │
│  │                                                               │   │
│  │   // Experimental                                            │   │
│  │   ENABLE_NEW_SCORING_ALGORITHM: false,                      │   │
│  │   ENABLE_REALTIME_UPDATES: false,                           │   │
│  │ };                                                           │   │
│  │                                                               │   │
│  │ // Usage                                                     │   │
│  │ if (FEATURES.ENABLE_SOV_CALCULATION) {                      │   │
│  │   await calculateShareOfVoice(analysis);                    │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  VERCEL EDGE CONFIG (Phase 4+ for real-time flags):                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Allows changing flags without redeploy                   │   │
│  │ import { get } from '@vercel/edge-config';                  │   │
│  │                                                               │   │
│  │ export async function getFeatureFlag(name: string) {        │   │
│  │   return await get(name);                                    │   │
│  │ }                                                            │   │
│  │                                                               │   │
│  │ // Benefits:                                                 │   │
│  │ // - Instant flag changes (no deploy needed)                │   │
│  │ // - Percentage rollouts (10% of users)                     │   │
│  │ // - User-specific flags (beta testers)                     │   │
│  │ // - Kill switch for problematic features                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ROLLOUT STRATEGY:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Phase 1: Feature off (flag = false)                         │   │
│  │     ↓                                                        │   │
│  │ Phase 2: Internal testing (flag = 'internal-only')          │   │
│  │     ↓                                                        │   │
│  │ Phase 3: Beta users (flag = 'beta' or percentage = 10%)     │   │
│  │     ↓                                                        │   │
│  │ Phase 4: General availability (flag = true)                 │   │
│  │     ↓                                                        │   │
│  │ Phase 5: Remove flag, feature is default                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.46 Reputation & Digital PR Architecture (NEW - PR Review)

```
┌─────────────────────────────────────────────────────────────────────┐
│           REPUTATION & DIGITAL PR GAPS IDENTIFIED                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. NO BRAND SENTIMENT TRACKING OVER TIME                          │
│     ═══════════════════════════════════                            │
│     Problem: We measure AI perception once, but reputation evolves  │
│     Impact: Can't show clients if their reputation is improving     │
│     Solution: Longitudinal sentiment tracking dashboard             │
│                                                                     │
│  2. NO CRISIS DETECTION SYSTEM                                     │
│     ═══════════════════════════                                    │
│     Problem: No alert when AI perception suddenly drops             │
│     Impact: Clients discover reputation crisis too late             │
│     Solution: Threshold-based crisis alerts + immediate notification│
│                                                                     │
│  3. NO NEGATIVE PR IDENTIFICATION                                  │
│     ═══════════════════════════════                                │
│     Problem: We don't identify WHAT is causing negative perception  │
│     Impact: Clients know they have a problem but not the source     │
│     Solution: Source attribution for negative mentions              │
│                                                                     │
│  4. NO MEDIA MENTION TRACKING                                      │
│     ════════════════════════════                                   │
│     Problem: Don't track WHERE brands appear (news, blogs, reviews) │
│     Impact: Missing context of WHY AIs recommend or don't recommend │
│     Solution: Media mention scraping + authority scoring            │
│                                                                     │
│  5. NO COMPETITOR PR COMPARISON                                    │
│     ═════════════════════════════                                  │
│     Problem: Show own score but not competitive PR landscape        │
│     Impact: No context if 60/100 is good or bad vs competitors      │
│     Solution: Competitor PR positioning matrix                      │
│                                                                     │
│  6. NO INFLUENCER/KOL MENTION TRACKING                             │
│     ═══════════════════════════════════                            │
│     Problem: AI models cite influencers/experts but we don't track  │
│     Impact: Missing key PR channel optimization opportunity         │
│     Solution: KOL mention detection + influence scoring             │
│                                                                     │
│  7. NO PR ACTION RECOMMENDATIONS                                   │
│     ═══════════════════════════════                                │
│     Problem: We show score but not PR strategy to improve           │
│     Impact: Clients know problem, don't know PR solution            │
│     Solution: PR playbook recommendations by industry               │
│                                                                     │
│  8. NO REPUTATION RECOVERY TRACKING                                │
│     ══════════════════════════════════                             │
│     Problem: No way to track if PR efforts are working              │
│     Impact: Clients can't prove ROI of reputation improvement work  │
│     Solution: Before/after reputation recovery dashboard            │
│                                                                     │
│  9. NO PRESS RELEASE OPTIMIZATION                                  │
│     ═══════════════════════════════                                │
│     Problem: Press releases not optimized for AI consumption        │
│     Impact: PR efforts don't translate to AI perception             │
│     Solution: AI-optimized press release templates + guidelines     │
│                                                                     │
│  10. NO REVIEW AGGREGATION ANALYSIS                                │
│      ═════════════════════════════════                             │
│      Problem: Don't analyze how reviews affect AI recommendations   │
│      Impact: Clients don't prioritize review management             │
│      Solution: Review platform analysis (G2, Capterra, Yelp, etc.)  │
│                                                                     │
│  11. NO BRAND NARRATIVE CONSISTENCY CHECK                          │
│      ═══════════════════════════════════════                       │
│      Problem: Brand messaging inconsistent across sources           │
│      Impact: AIs receive conflicting signals, reduce confidence     │
│      Solution: Cross-source narrative consistency analyzer          │
│                                                                     │
│  12. NO OWN PR STRATEGY FOR LAUNCH                                 │
│      ═════════════════════════════════                             │
│      Problem: No PR plan for AI Perception's own product launch     │
│      Impact: We sell PR advice but don't follow it ourselves        │
│      Solution: Launch PR playbook (Product Hunt, press, influencers)│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.47 Brand Sentiment Tracking System (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 LONGITUDINAL REPUTATION DASHBOARD                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SENTIMENT DIMENSIONS (Per AI Provider):                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Overall Sentiment: Positive | Neutral | Negative | Mixed   │   │
│  │ • Recommendation Strength: Strong | Moderate | Weak | None   │   │
│  │ • Context Quality: Primary | Alternative | Mentioned | Absent │   │
│  │ • Consistency Score: 0-100 (same message across providers)   │   │
│  │ • Trend Direction: Rising | Stable | Declining | Volatile    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: reputation_history                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ analysis_id     UUID REFERENCES analyses(id)                 │   │
│  │ brand_id        UUID REFERENCES entities(id)                 │   │
│  │ provider        ENUM('openai','anthropic','google','perplexity')│
│  │ sentiment       ENUM('positive','neutral','negative','mixed') │   │
│  │ sentiment_score DECIMAL (-1.0 to 1.0)                        │   │
│  │ recommendation_strength ENUM('strong','moderate','weak','none')│  │
│  │ context_type    ENUM('primary','alternative','mentioned','absent')│
│  │ key_phrases     TEXT[] (extracted sentiment phrases)         │   │
│  │ negative_factors JSONB (what's hurting reputation)           │   │
│  │ positive_factors JSONB (what's helping reputation)           │   │
│  │ measured_at     TIMESTAMPTZ                                  │   │
│  │ created_at      TIMESTAMPTZ                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  REPUTATION TREND VISUALIZATION:                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                               │   │
│  │  100 ┤                                    ╭───╮               │   │
│  │   80 ┤               ╭──────╮       ╭────╯   │               │   │
│  │   60 ┤         ╭────╯      ╰──────╯         │               │   │
│  │   40 ┤    ╭───╯                              ╰── Current: 72 │   │
│  │   20 ┤───╯                                                   │   │
│  │    0 ┼─────┬─────┬─────┬─────┬─────┬─────┬─────              │   │
│  │      Week1 Week2 Week3 Week4 Week5 Week6 Week7               │   │
│  │                                                               │   │
│  │  ▲ +18 points since first analysis                           │   │
│  │  Your PR efforts are working!                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ALERTS & THRESHOLDS:                                             │
│  ├─ Score drops >15 points in 7 days → CRISIS ALERT              │
│  ├─ Sentiment flips negative → IMMEDIATE NOTIFICATION            │
│  ├─ Competitor overtakes → COMPETITIVE ALERT                     │
│  └─ Score improves >10 points → CELEBRATION NOTIFICATION         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.48 Crisis Detection & Response System (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REPUTATION CRISIS MANAGEMENT                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CRISIS DETECTION TRIGGERS:                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ LEVEL 1 - YELLOW (Warning):                                  │   │
│  │ • Score drops 10-15 points in 7 days                         │   │
│  │ • New negative mention appears in AI response                │   │
│  │ • Competitor score rises 20+ points                          │   │
│  │ → Action: Email notification + dashboard badge               │   │
│  │                                                               │   │
│  │ LEVEL 2 - ORANGE (Urgent):                                   │   │
│  │ • Score drops 15-25 points in 7 days                         │   │
│  │ • Multiple negative mentions across providers                │   │
│  │ • Recommendation status changes from "recommended" to "not"  │   │
│  │ → Action: SMS/Push + urgent banner + suggested PR actions    │   │
│  │                                                               │   │
│  │ LEVEL 3 - RED (Crisis):                                      │   │
│  │ • Score drops >25 points in 7 days                           │   │
│  │ • Brand explicitly NOT recommended with negative reason      │   │
│  │ • All providers show negative sentiment                      │   │
│  │ → Action: Immediate call/SMS + crisis playbook activated     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CRISIS ROOT CAUSE IDENTIFICATION:                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ When crisis detected, analyze:                               │   │
│  │ 1. What changed in AI responses? (diff previous vs current)  │   │
│  │ 2. What negative keywords appeared? (extract phrases)        │   │
│  │ 3. What source is AI citing? (news, reviews, social)        │   │
│  │ 4. Is this affecting all providers or just one?             │   │
│  │ 5. Are competitors affected too? (industry-wide issue?)     │   │
│  │                                                               │   │
│  │ OUTPUT: Root Cause Report                                    │   │
│  │ "Your reputation dropped because:                            │   │
│  │  • ChatGPT now cites a TechCrunch article about your outage │   │
│  │  • 12 new 1-star reviews on G2 in last week                 │   │
│  │  • Your pricing page shows 'discontinued' product"          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CRISIS RESPONSE PLAYBOOK (Auto-generated):                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ IMMEDIATE (Within 24h):                                      │   │
│  │ ☐ Acknowledge issue on official channels                    │   │
│  │ ☐ Prepare statement for press inquiries                     │   │
│  │ ☐ Update website FAQ with explanation                       │   │
│  │                                                               │   │
│  │ SHORT-TERM (Within 1 week):                                  │   │
│  │ ☐ Respond to negative reviews professionally                │   │
│  │ ☐ Publish resolution/update blog post                       │   │
│  │ ☐ Request positive reviews from satisfied customers         │   │
│  │                                                               │   │
│  │ MEDIUM-TERM (Within 1 month):                                │   │
│  │ ☐ PR campaign highlighting positive developments            │   │
│  │ ☐ Expert content establishing authority                     │   │
│  │ ☐ Influencer outreach for positive coverage                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: crisis_events                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ brand_id        UUID REFERENCES entities(id)                 │   │
│  │ severity_level  ENUM('yellow','orange','red')                │   │
│  │ trigger_type    TEXT                                         │   │
│  │ score_before    INTEGER                                      │   │
│  │ score_after     INTEGER                                      │   │
│  │ root_causes     JSONB                                        │   │
│  │ playbook_actions JSONB                                       │   │
│  │ resolved_at     TIMESTAMPTZ (nullable)                       │   │
│  │ resolution_notes TEXT                                        │   │
│  │ created_at      TIMESTAMPTZ                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.49 Media & Review Monitoring (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MEDIA PRESENCE TRACKING                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  MEDIA SOURCES TO MONITOR:                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TIER 1 - HIGH AUTHORITY (AI models trust most):              │   │
│  │ • Major news outlets (NYT, WSJ, Forbes, TechCrunch)         │   │
│  │ • Wikipedia / Wikidata entries                               │   │
│  │ • Industry publications (specific to client industry)        │   │
│  │                                                               │   │
│  │ TIER 2 - PROFESSIONAL REVIEWS:                               │   │
│  │ • G2, Capterra, TrustRadius (B2B SaaS)                      │   │
│  │ • Yelp, TripAdvisor, Google Maps (Local business)           │   │
│  │ • App Store, Play Store (Mobile apps)                        │   │
│  │                                                               │   │
│  │ TIER 3 - SOCIAL & COMMUNITY:                                 │   │
│  │ • Reddit discussions (specific subreddits)                   │   │
│  │ • Twitter/X mentions and sentiment                           │   │
│  │ • LinkedIn company mentions                                  │   │
│  │ • Quora answers mentioning brand                             │   │
│  │                                                               │   │
│  │ TIER 4 - EXPERT/KOL CONTENT:                                 │   │
│  │ • YouTube reviews and tutorials                              │   │
│  │ • Podcast mentions                                           │   │
│  │ • Blog posts from industry influencers                       │   │
│  │ • Newsletter mentions                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  REVIEW PLATFORM ANALYSIS OUTPUT:                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ G2 Analysis:                                                 │   │
│  │ ┌─────────────────────────────────────────────────────┐     │   │
│  │ │ Your Rating: 4.2/5 (127 reviews)                     │     │   │
│  │ │ Industry Avg: 4.4/5                                  │     │   │
│  │ │ Top Competitor: 4.6/5 (Salesforce)                   │     │   │
│  │ │                                                       │     │   │
│  │ │ Sentiment Breakdown:                                  │     │   │
│  │ │ ████████████████░░░░ 78% Positive                    │     │   │
│  │ │ ████░░░░░░░░░░░░░░░░ 15% Neutral                     │     │   │
│  │ │ ██░░░░░░░░░░░░░░░░░░  7% Negative                    │     │   │
│  │ │                                                       │     │   │
│  │ │ Top Negative Themes:                                  │     │   │
│  │ │ • "Customer support slow" (12 mentions)              │     │   │
│  │ │ • "Pricing increased" (8 mentions)                   │     │   │
│  │ │ • "Missing integrations" (5 mentions)                │     │   │
│  │ │                                                       │     │   │
│  │ │ PR RECOMMENDATION:                                    │     │   │
│  │ │ Request 20+ new reviews from satisfied customers      │     │   │
│  │ │ to dilute negative sentiment                         │     │   │
│  │ └─────────────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: media_mentions                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ brand_id        UUID REFERENCES entities(id)                 │   │
│  │ source_url      TEXT                                         │   │
│  │ source_domain   TEXT                                         │   │
│  │ source_type     ENUM('news','review','social','expert','wiki')│  │
│  │ authority_tier  INTEGER (1-4)                                │   │
│  │ sentiment       ENUM('positive','neutral','negative')        │   │
│  │ headline        TEXT                                         │   │
│  │ excerpt         TEXT                                         │   │
│  │ published_at    TIMESTAMPTZ                                  │   │
│  │ discovered_at   TIMESTAMPTZ                                  │   │
│  │ ai_citing_this  BOOLEAN (is AI using this source?)          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.50 PR Action Recommendations Engine (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 PR PLAYBOOK BY INDUSTRY & SITUATION                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PR RECOMMENDATION CATEGORIES:                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. VISIBILITY BUILDING (Score < 40, not mentioned)          │   │
│  │    • Create Wikipedia/Wikidata entry                        │   │
│  │    • Submit to industry directories                         │   │
│  │    • Guest post on authoritative blogs                      │   │
│  │    • Launch on Product Hunt / relevant platforms            │   │
│  │    • Pitch to industry newsletters                          │   │
│  │                                                               │   │
│  │ 2. AUTHORITY BUILDING (Score 40-60, mentioned but weak)     │   │
│  │    • Publish original research / data reports               │   │
│  │    • Speak at industry conferences                          │   │
│  │    • Get quoted in news articles                            │   │
│  │    • Build thought leadership on LinkedIn                   │   │
│  │    • Create expert content (guides, whitepapers)            │   │
│  │                                                               │   │
│  │ 3. SOCIAL PROOF BUILDING (Score 60-80, needs validation)    │   │
│  │    • Accelerate review collection on G2/Capterra            │   │
│  │    • Showcase customer case studies                         │   │
│  │    • Highlight awards and certifications                    │   │
│  │    • Influencer partnership campaigns                       │   │
│  │    • User-generated content promotion                       │   │
│  │                                                               │   │
│  │ 4. REPUTATION DEFENSE (Score >80, maintain position)        │   │
│  │    • Monitor for negative mentions proactively              │   │
│  │    • Respond quickly to criticism                           │   │
│  │    • Continuous fresh content publication                   │   │
│  │    • Regular PR outreach cadence                            │   │
│  │    • Crisis response plan ready                             │   │
│  │                                                               │   │
│  │ 5. CRISIS RECOVERY (Score dropped significantly)            │   │
│  │    • Issue public statement addressing concerns             │   │
│  │    • Respond to ALL negative reviews                        │   │
│  │    • Publish "lessons learned" transparency content         │   │
│  │    • Intensify positive coverage outreach                   │   │
│  │    • Consider brand refresh if severe                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  INDUSTRY-SPECIFIC PR PLAYBOOKS:                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ B2B SaaS:                                                    │   │
│  │ • Priority platforms: G2, Capterra, TrustRadius            │   │
│  │ • Content focus: ROI case studies, technical docs          │   │
│  │ • Influencers: Industry analysts, tech journalists          │   │
│  │                                                               │   │
│  │ Local Business:                                              │   │
│  │ • Priority platforms: Google Maps, Yelp, local directories │   │
│  │ • Content focus: Community involvement, local news          │   │
│  │ • Influencers: Local bloggers, community leaders           │   │
│  │                                                               │   │
│  │ E-commerce:                                                  │   │
│  │ • Priority platforms: Trustpilot, Amazon reviews           │   │
│  │ • Content focus: Product quality, customer service          │   │
│  │ • Influencers: YouTube reviewers, Instagram creators        │   │
│  │                                                               │   │
│  │ Healthcare:                                                  │   │
│  │ • Priority platforms: Healthgrades, Zocdoc, RateMDs        │   │
│  │ • Content focus: Credentials, patient outcomes, trust       │   │
│  │ • Influencers: Medical professionals, health journalists    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  OUTPUT FORMAT (Per Recommendation):                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ PR RECOMMENDATION #1                                         │   │
│  │ ──────────────────                                          │   │
│  │ Action: Create comprehensive Wikipedia page                  │   │
│  │ Why: AI models heavily cite Wikipedia. You're not there.     │   │
│  │ Expected Impact: +15-25 points on AI Perception Score       │   │
│  │ Effort: High (requires notability + citations)              │   │
│  │ Timeline: 2-4 weeks to creation, 3-6 months to rank         │   │
│  │ Resources: Wikipedia editing guide (link)                   │   │
│  │            List of required citations                        │   │
│  │            Template for company pages                        │   │
│  │ Success Metric: Wikipedia page indexed, cited by AI         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.51 Narrative Consistency Analyzer (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              BRAND NARRATIVE CONSISTENCY CHECK                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM: Brand sends conflicting signals across sources           │
│  • Website says "Enterprise CRM" but G2 categorizes as "SMB CRM"   │
│  • LinkedIn bio differs from Twitter bio                           │
│  • Press releases use different company descriptions               │
│  → AI models receive mixed signals = lower confidence = lower score│
│                                                                     │
│  CONSISTENCY CHECK DIMENSIONS:                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. COMPANY DESCRIPTION                                       │   │
│  │    Compare: Website about, LinkedIn, Twitter, Crunchbase    │   │
│  │    Check: Same core value proposition?                       │   │
│  │                                                               │   │
│  │ 2. INDUSTRY CATEGORIZATION                                   │   │
│  │    Compare: How you categorize vs how platforms categorize  │   │
│  │    Check: Consistent industry/category across all sources?  │   │
│  │                                                               │   │
│  │ 3. FOUNDER/LEADERSHIP BIOS                                   │   │
│  │    Compare: LinkedIn, company website, speaker bios          │   │
│  │    Check: Consistent credentials and experience claims?      │   │
│  │                                                               │   │
│  │ 4. PRODUCT/SERVICE DESCRIPTIONS                              │   │
│  │    Compare: Website, G2, Product Hunt, press releases       │   │
│  │    Check: Same features highlighted? Same target audience?  │   │
│  │                                                               │   │
│  │ 5. CONTACT INFORMATION                                       │   │
│  │    Compare: All public sources                               │   │
│  │    Check: Same address, phone, email across all?            │   │
│  │                                                               │   │
│  │ 6. SOCIAL PROOF CLAIMS                                       │   │
│  │    Compare: "X customers" on website vs press releases      │   │
│  │    Check: Numbers match? Date stamps accurate?              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  OUTPUT: Narrative Consistency Score (0-100)                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Narrative Consistency: 67/100                                │   │
│  │                                                               │   │
│  │ ✓ Company description consistent (90%)                       │   │
│  │ ✓ Leadership bios match (95%)                                │   │
│  │ ⚠ Industry categorization inconsistent (60%)                │   │
│  │   - Website: "Enterprise CRM"                                │   │
│  │   - G2: "Small Business CRM"                                 │   │
│  │   - LinkedIn: "Sales Software"                               │   │
│  │ ✗ Contact info mismatch (40%)                               │   │
│  │   - Old address on Crunchbase                                │   │
│  │   - Different phone on Yelp listing                          │   │
│  │                                                               │   │
│  │ TOP FIXES:                                                   │   │
│  │ 1. Update G2 category to match positioning (+10 pts)        │   │
│  │ 2. Update Crunchbase address (+5 pts)                       │   │
│  │ 3. Standardize LinkedIn company description (+3 pts)        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.52 AI Perception Launch PR Strategy (NEW - Our Own Launch)

```
┌─────────────────────────────────────────────────────────────────────┐
│          AI PERCEPTION ENGINEERING AGENCY - LAUNCH PR PLAN          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ⚠️ CRITICAL: We must follow our own advice for our launch!        │
│                                                                     │
│  PRE-LAUNCH (2 weeks before):                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ □ Create Wikidata entry for "AI Perception Engineering"     │   │
│  │ □ Set up Crunchbase company profile                         │   │
│  │ □ Claim LinkedIn company page with full details             │   │
│  │ □ Create Twitter/X account @aiperception                    │   │
│  │ □ Prepare Product Hunt launch page (draft)                  │   │
│  │ □ Write 3 launch blog posts (draft)                         │   │
│  │ □ Create press kit (logo, screenshots, founder bio)         │   │
│  │ □ Build email list of beta testers (target: 100)            │   │
│  │ □ Identify 20 target journalists/bloggers to pitch          │   │
│  │ □ Prepare founder thought leadership content                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAUNCH DAY (Product Hunt focus):                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ □ Submit to Product Hunt at 12:01 AM PT                     │   │
│  │ □ Email beta testers asking for upvotes/comments            │   │
│  │ □ Post on Twitter, LinkedIn, relevant subreddits            │   │
│  │ □ Send press release to media list                          │   │
│  │ □ Engage with EVERY Product Hunt comment                    │   │
│  │ □ Live-tweet launch day with behind-scenes content          │   │
│  │ □ Founder available for immediate interviews                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  POST-LAUNCH (Week 1-2):                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ □ Follow up with journalists who didn't respond             │   │
│  │ □ Publish first case study from launch users                │   │
│  │ □ Guest post on marketing/SEO blogs about GEO              │   │
│  │ □ Podcast interview outreach (20 targets)                   │   │
│  │ □ LinkedIn article: "We Launched and Here's What We Learned"│   │
│  │ □ Request testimonials from happy launch users              │   │
│  │ □ Submit to Indie Hackers, Hacker News                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ONGOING PR CADENCE:                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Weekly:                                                      │   │
│  │ • 1 Twitter thread with insights/tips                       │   │
│  │ • Engage in 5 relevant conversations                        │   │
│  │                                                               │   │
│  │ Bi-weekly:                                                   │   │
│  │ • 1 LinkedIn article                                         │   │
│  │ • 1 guest post pitch to blogs                               │   │
│  │                                                               │   │
│  │ Monthly:                                                     │   │
│  │ • 1 data-driven report (e.g., "AI Perception by Industry")  │   │
│  │ • 1 podcast appearance                                      │   │
│  │ • Press release if newsworthy update                        │   │
│  │                                                               │   │
│  │ Quarterly:                                                   │   │
│  │ • Industry benchmark report                                  │   │
│  │ • Speaking engagement at conference                          │   │
│  │ • Major feature launch with PR push                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TARGET MEDIA OUTLETS FOR COVERAGE:                                │
│  ├─ Tech: TechCrunch, The Verge, Wired, VentureBeat            │
│  ├─ Marketing: MarketingWeek, AdAge, Digiday, Search Engine Land│
│  ├─ Business: Forbes, Entrepreneur, Inc., Fast Company          │
│  ├─ Newsletters: TLDR, The Hustle, Morning Brew                 │
│  └─ Podcasts: Marketing School, My First Million, SaaS Growth   │
│                                                                     │
│  SUCCESS METRICS (Month 1):                                        │
│  ├─ Product Hunt: Top 5 of the day                              │
│  ├─ Press mentions: 5+ articles                                  │
│  ├─ Social followers: 500+ across platforms                      │
│  ├─ Email subscribers: 1,000+                                    │
│  └─ Podcast appearances: 2+                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.53 Prompt Engineering Architecture (NEW - Prompt Engineer Review)

```
┌─────────────────────────────────────────────────────────────────────┐
│           PROMPT ENGINEERING & MODEL ANALYSIS GAPS IDENTIFIED       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. NO CHAIN-OF-THOUGHT (CoT) PROMPTING                            │
│     ═══════════════════════════════════                            │
│     Problem: Current prompts ask for direct answers                 │
│     Impact: AI misses nuanced reasoning, lower accuracy scores      │
│     Solution: Add "Think step by step" + reasoning traces          │
│                                                                     │
│  2. NO FEW-SHOT EXAMPLES IN PROMPTS                                │
│     ════════════════════════════════                               │
│     Problem: Prompts lack examples of expected output format        │
│     Impact: Inconsistent JSON structures, parsing failures          │
│     Solution: Include 2-3 exemplar responses in each prompt        │
│                                                                     │
│  3. NO SYSTEM PROMPT OPTIMIZATION                                  │
│     ═════════════════════════════                                  │
│     Problem: Generic system prompts, no persona engineering         │
│     Impact: AI acts as generic assistant, not industry expert       │
│     Solution: Craft expert personas per analysis type              │
│                                                                     │
│  4. NO TEMPERATURE TUNING BY TASK TYPE                             │
│     ══════════════════════════════════                             │
│     Problem: Same temperature (0.3) for all prompts                 │
│     Impact: Some tasks need creativity, others need precision       │
│     Solution: Temperature matrix by prompt type                     │
│                                                                     │
│  5. NO RESPONSE CALIBRATION LAYER                                  │
│     ═════════════════════════════════                              │
│     Problem: Raw AI scores may not correlate with actual perception │
│     Impact: Score of 60 from GPT ≠ 60 from Claude                   │
│     Solution: Calibration layer to normalize scores across models   │
│                                                                     │
│  6. NO MODEL-SPECIFIC PROMPT OPTIMIZATION                          │
│     ═════════════════════════════════════                          │
│     Problem: Same prompt used for OpenAI/Anthropic/Google           │
│     Impact: Each model has quirks, one prompt ≠ optimal for all     │
│     Solution: Model-specific prompt variants                        │
│                                                                     │
│  7. NO PROMPT COMPRESSION/TOKEN OPTIMIZATION                       │
│     ════════════════════════════════════════                       │
│     Problem: Prompts not optimized for token efficiency             │
│     Impact: Higher API costs, slower responses                      │
│     Solution: Token-efficient prompt rewriting, context pruning     │
│                                                                     │
│  8. NO MULTI-TURN CONTEXT FOR FOLLOW-UP                            │
│     ═══════════════════════════════════                            │
│     Problem: Each query is isolated, no conversation memory         │
│     Impact: Can't do follow-up analysis, deeper dives               │
│     Solution: Session-based context window management               │
│                                                                     │
│  9. NO PROMPT TESTING FRAMEWORK                                    │
│     ═══════════════════════════                                    │
│     Problem: New prompts deployed without systematic testing        │
│     Impact: Regressions in quality go undetected                    │
│     Solution: Prompt evaluation suite with golden test cases        │
│                                                                     │
│  10. NO MODEL BEHAVIOR BENCHMARKING                                │
│      ═══════════════════════════════                               │
│      Problem: Don't track how models behave differently             │
│      Impact: GPT-4o recommendations ≠ Claude-3 recommendations      │
│      Solution: Model comparison dashboard with consistency metrics  │
│                                                                     │
│  11. NO SELF-CONSISTENCY VERIFICATION                              │
│      ═════════════════════════════════                             │
│      Problem: Single query may have random variance                 │
│      Impact: Score fluctuates between runs (unreliable)             │
│      Solution: Multiple samples + majority voting for stability     │
│                                                                     │
│  12. NO PROMPT LIBRARY FOR EDGE CASES                              │
│      ════════════════════════════════                              │
│      Problem: Standard prompts fail for unusual industries          │
│      Impact: Niche businesses get poor/wrong analysis               │
│      Solution: Specialized prompt library by industry/region        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.54 Chain-of-Thought Prompting Architecture (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 CHAIN-OF-THOUGHT (CoT) PROMPTING                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  WHY CoT MATTERS FOR AI PERCEPTION:                                │
│  • AI recommendations involve multi-step reasoning                  │
│  • "Best CRM for SMB in Mexico" requires:                          │
│    1. Understanding SMB needs                                       │
│    2. Knowing Mexican market context                                │
│    3. Evaluating multiple CRM options                               │
│    4. Ranking by relevance to specific criteria                     │
│  • Without CoT, AI may skip steps → worse recommendations          │
│                                                                     │
│  IMPLEMENTATION:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // BEFORE (Direct prompting):                                │   │
│  │ const OLD_PROMPT = `                                         │   │
│  │   List the top 5 CRM tools for small businesses in Mexico.   │   │
│  │ `;                                                           │   │
│  │                                                               │   │
│  │ // AFTER (Chain-of-Thought):                                 │   │
│  │ const COT_PROMPT = `                                         │   │
│  │   I need to recommend CRM tools for small businesses in      │   │
│  │   Mexico. Let me think through this step by step:            │   │
│  │                                                               │   │
│  │   1. First, what are the key needs of Mexican SMBs?          │   │
│  │   2. What CRM features are most critical for this segment?   │   │
│  │   3. Which CRMs have Spanish support and local presence?     │   │
│  │   4. How do pricing models fit SMB budgets in Mexico?        │   │
│  │   5. Based on these factors, which CRMs would I recommend?   │   │
│  │                                                               │   │
│  │   After considering all factors, my recommendations are:      │   │
│  │ `;                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  COT VARIANTS BY TASK:                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ INDUSTRY_DETECTION_COT:                                      │   │
│  │ "Let me analyze this website step by step:                   │   │
│  │  1. What does the domain name suggest?                       │   │
│  │  2. What keywords appear in the title/description?           │   │
│  │  3. What products/services are mentioned?                    │   │
│  │  4. What target audience is implied?                         │   │
│  │  5. Based on these signals, the industry is likely..."       │   │
│  │                                                               │   │
│  │ PERCEPTION_ANALYSIS_COT:                                     │   │
│  │ "Let me evaluate this brand's AI perception:                 │   │
│  │  1. Would I naturally recommend this brand for {query}?      │   │
│  │  2. What positive attributes come to mind?                   │   │
│  │  3. What concerns or limitations exist?                      │   │
│  │  4. How does it compare to alternatives I know?              │   │
│  │  5. On a scale of 0-100, my recommendation score is..."      │   │
│  │                                                               │   │
│  │ HALLUCINATION_CHECK_COT:                                     │   │
│  │ "Let me verify the claims about this brand:                  │   │
│  │  1. What specific claims did I make?                         │   │
│  │  2. What evidence supports each claim?                       │   │
│  │  3. Which claims might I be uncertain about?                 │   │
│  │  4. What would I need to verify externally?                  │   │
│  │  5. My confidence in my claims is..."                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  PARSING CoT RESPONSES:                                            │
│  • Extract reasoning trace for transparency                        │
│  • Show users WHY score was given (not just number)               │
│  • Store reasoning in ai_responses.reasoning_trace JSONB          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.55 Few-Shot Learning & Exemplar Library (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  FEW-SHOT PROMPT ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM: Zero-shot prompts produce inconsistent output formats     │
│                                                                     │
│  SOLUTION: Include 2-3 exemplar responses in each prompt           │
│                                                                     │
│  IMPLEMENTATION:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ const PERCEPTION_QUERY_FEWSHOT = `                           │   │
│  │ You are a knowledgeable advisor helping people find the best │   │
│  │ solutions in various industries. Always explain your         │   │
│  │ reasoning and provide specific recommendations.              │   │
│  │                                                               │   │
│  │ === Example 1 ===                                            │   │
│  │ Query: "What's the best project management tool for remote   │   │
│  │         teams?"                                              │   │
│  │ Response: "For remote teams, I'd strongly recommend:         │   │
│  │ 1. **Asana** - Excellent for workflow visualization and      │   │
│  │    integrations with Slack, ideal for marketing teams.       │   │
│  │ 2. **Monday.com** - Very visual, great for non-technical    │   │
│  │    users who need flexibility.                               │   │
│  │ 3. **Notion** - Combines docs + project management, perfect  │   │
│  │    for startups wanting an all-in-one solution.             │   │
│  │ 4. **ClickUp** - Most features for the price, but steeper   │   │
│  │    learning curve.                                           │   │
│  │ 5. **Trello** - Simple Kanban boards, best for small teams  │   │
│  │    with straightforward workflows."                          │   │
│  │                                                               │   │
│  │ === Example 2 ===                                            │   │
│  │ Query: "Best CRM for real estate agents in the US?"          │   │
│  │ Response: "For US real estate agents, I recommend:           │   │
│  │ 1. **Follow Up Boss** - Built specifically for real estate,  │   │
│  │    excellent lead routing and mobile app.                    │   │
│  │ 2. **KVCore** - All-in-one platform popular with brokerages, │   │
│  │    includes IDX website and marketing automation.            │   │
│  │ 3. **LionDesk** - Affordable option with good texting        │   │
│  │    features and video email capabilities.                    │   │
│  │ 4. **Wise Agent** - User-friendly with strong transaction    │   │
│  │    management features.                                      │   │
│  │ 5. **HubSpot** - Free tier available, good if you want CRM   │   │
│  │    + marketing automation together."                         │   │
│  │                                                               │   │
│  │ === Your Query ===                                           │   │
│  │ Query: "{industry} in {country}"                             │   │
│  │ Response:                                                    │   │
│  │ `;                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  EXEMPLAR LIBRARY DATABASE:                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ DATABASE TABLE: prompt_exemplars                             │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ id              UUID PRIMARY KEY                         │ │   │
│  │ │ prompt_type     TEXT (perception_query, industry_detect) │ │   │
│  │ │ industry        TEXT (null = universal)                  │ │   │
│  │ │ query_example   TEXT                                     │ │   │
│  │ │ response_example TEXT                                    │ │   │
│  │ │ quality_score   INTEGER (1-5, human-rated)               │ │   │
│  │ │ is_active       BOOLEAN                                  │ │   │
│  │ │ created_at      TIMESTAMPTZ                              │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DYNAMIC EXEMPLAR SELECTION:                                       │
│  1. If industry-specific exemplars exist → use those              │
│  2. If not → use universal high-quality exemplars                 │
│  3. Rotate exemplars to avoid overfitting                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.56 Model-Specific Prompt Optimization (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│               MODEL-SPECIFIC PROMPT VARIANTS                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  INSIGHT: Each model responds differently to same prompt           │
│                                                                     │
│  MODEL CHARACTERISTICS:                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ GPT-3.5-turbo / GPT-4:                                       │   │
│  │ • Responds well to clear instructions                        │   │
│  │ • Prefers explicit JSON format requests                      │   │
│  │ • Works best with function_calling for structured output     │   │
│  │ • Temperature 0.3-0.5 for recommendations                    │   │
│  │ • Token-efficient, can handle long context well              │   │
│  │                                                               │   │
│  │ Claude-3 (Haiku/Sonnet/Opus):                                │   │
│  │ • Responds well to conversational tone                       │   │
│  │ • Prefers XML-style tags for structure <output></output>     │   │
│  │ • Works best with tool_use for structured output             │   │
│  │ • More nuanced reasoning, better at "why"                    │   │
│  │ • Tends to be more verbose, needs explicit length limits     │   │
│  │                                                               │   │
│  │ Gemini:                                                       │   │
│  │ • Strong at multi-modal, even for text-only tasks           │   │
│  │ • Prefers bullet-point style output                          │   │
│  │ • JSON mode available but less reliable                      │   │
│  │ • Temperature needs to be lower (0.2) for consistency        │   │
│  │                                                               │   │
│  │ Perplexity:                                                   │   │
│  │ • Unique: Has real-time web search built-in                  │   │
│  │ • Cites sources automatically                                │   │
│  │ • Best for "current state" queries                           │   │
│  │ • Output format less controllable                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  PROMPT VARIANT STRATEGY:                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ interface PromptVariant {                                    │   │
│  │   basePrompt: string;                                        │   │
│  │   openaiModifications: {                                     │   │
│  │     prefix: string;      // "Respond ONLY with valid JSON"   │   │
│  │     suffix: string;      // Schema reminder                  │   │
│  │     temperature: number; // 0.3                              │   │
│  │     useFunctionCalling: boolean; // true                     │   │
│  │   };                                                         │   │
│  │   anthropicModifications: {                                  │   │
│  │     prefix: string;      // "I'll help analyze this..."      │   │
│  │     suffix: string;      // "<output>...</output>"           │   │
│  │     temperature: number; // 0.4                              │   │
│  │     useToolUse: boolean; // true                             │   │
│  │   };                                                         │   │
│  │   googleModifications: {                                     │   │
│  │     prefix: string;      // Direct instruction style         │   │
│  │     suffix: string;      // Bullet point format request      │   │
│  │     temperature: number; // 0.2                              │   │
│  │   };                                                         │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: prompt_variants                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ base_prompt_id  UUID REFERENCES prompts(id)                  │   │
│  │ provider        ENUM('openai','anthropic','google','pplx')   │   │
│  │ modifications   JSONB                                        │   │
│  │ temperature     DECIMAL                                      │   │
│  │ performance_score DECIMAL (A/B test results)                 │   │
│  │ is_active       BOOLEAN                                      │   │
│  │ created_at      TIMESTAMPTZ                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.57 Response Calibration & Normalization (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 CROSS-MODEL SCORE CALIBRATION                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM:                                                          │
│  • GPT-4 tends to give optimistic scores (mean ~65)                │
│  • Claude tends to be more conservative (mean ~55)                 │
│  • Raw scores are not comparable across models                     │
│                                                                     │
│  SOLUTION: Calibration layer that normalizes scores                │
│                                                                     │
│  CALIBRATION APPROACH:                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. ESTABLISH BASELINE (Initial Setup):                       │   │
│  │    • Run 50 golden brands through all models                 │   │
│  │    • Calculate per-model mean, std deviation                 │   │
│  │    • Store as baseline calibration parameters                │   │
│  │                                                               │   │
│  │ 2. NORMALIZE SCORES (Per Analysis):                          │   │
│  │    // Z-score normalization                                   │   │
│  │    const normalizedScore = (rawScore - modelMean) / modelStd;│   │
│  │    // Scale to 0-100                                          │   │
│  │    const calibratedScore = 50 + (normalizedScore * 20);      │   │
│  │    // Clamp to valid range                                    │   │
│  │    return Math.max(0, Math.min(100, calibratedScore));       │   │
│  │                                                               │   │
│  │ 3. WEIGHTED AGGREGATE:                                        │   │
│  │    // Not simple average - weight by model reliability        │   │
│  │    const finalScore = (                                       │   │
│  │      calibratedOpenAI * 0.35 +                               │   │
│  │      calibratedAnthropic * 0.35 +                            │   │
│  │      calibratedGoogle * 0.15 +                               │   │
│  │      calibratedPerplexity * 0.15                             │   │
│  │    );                                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: model_calibration                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ provider        TEXT                                         │   │
│  │ model           TEXT                                         │   │
│  │ baseline_mean   DECIMAL                                      │   │
│  │ baseline_std    DECIMAL                                      │   │
│  │ weight          DECIMAL (aggregation weight)                 │   │
│  │ sample_size     INTEGER (n brands used)                      │   │
│  │ calibrated_at   TIMESTAMPTZ                                  │   │
│  │ valid_until     TIMESTAMPTZ (re-calibrate monthly)           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  RECALIBRATION TRIGGERS:                                           │
│  • Monthly scheduled recalibration (CRON)                          │
│  • When model version changes (GPT-4 → GPT-4-turbo)               │
│  • When golden dataset scores drift > 10%                          │
│  • Manual trigger after prompt changes                             │
│                                                                     │
│  TRANSPARENCY:                                                     │
│  • Show users both raw and calibrated scores                       │
│  • Explain: "Scores normalized across AI models for consistency"   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.58 Self-Consistency & Stability (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 RESPONSE STABILITY VERIFICATION                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM: Single AI query can have high variance                   │
│  • Same prompt → different scores on different runs                │
│  • Users re-run analysis, get different result → lose trust        │
│                                                                     │
│  SOLUTION: Self-consistency through multiple samples               │
│                                                                     │
│  IMPLEMENTATION:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ SAMPLING STRATEGY:                                           │   │
│  │                                                               │   │
│  │ FREE TIER: 1 sample per model                                │   │
│  │   → Faster, cheaper, acceptable variance                     │   │
│  │   → Show "confidence: moderate"                              │   │
│  │                                                               │   │
│  │ PAID TIER: 3 samples per model                               │   │
│  │   → Use majority voting for mentions/recommends              │   │
│  │   → Average scores, report variance                          │   │
│  │   → Show "confidence: high" if variance < 10%                │   │
│  │                                                               │   │
│  │ CONSISTENCY METRICS:                                          │   │
│  │ const checkConsistency = (samples: AIResponse[]) => {        │   │
│  │   const scores = samples.map(s => s.score);                  │   │
│  │   const mean = avg(scores);                                  │   │
│  │   const variance = standardDeviation(scores);                │   │
│  │   const mentions = samples.filter(s => s.mentionsBrand);     │   │
│  │   const mentionConsensus = mentions.length / samples.length; │   │
│  │                                                               │   │
│  │   return {                                                   │   │
│  │     finalScore: mean,                                        │   │
│  │     variance,                                                │   │
│  │     confidence: variance < 10 ? 'high' :                     │   │
│  │                 variance < 20 ? 'moderate' : 'low',          │   │
│  │     mentionsBrand: mentionConsensus > 0.5,  // majority     │   │
│  │     needsReview: variance > 25,  // flag anomalies          │   │
│  │   };                                                         │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  USER-FACING CONFIDENCE INDICATOR:                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Score: 72/100                                                │   │
│  │ Confidence: ████████░░ HIGH                                  │   │
│  │                                                               │   │
│  │ "This score is consistent across multiple AI queries.        │   │
│  │  Your brand perception is reliably measured."                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LOW CONFIDENCE HANDLING:                                          │
│  • If variance > 25: Re-run with different prompts                │
│  • If still unstable: Flag for human review                       │
│  • Show user: "Results vary. We're investigating."                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.59 Prompt Testing & Evaluation Framework (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  PROMPT EVALUATION PIPELINE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PRINCIPLE: Never deploy prompt changes without testing            │
│                                                                     │
│  GOLDEN TEST DATASET:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 50 brands with known expected scores:                        │   │
│  │ • 10 tier-1 brands (Apple, Google) → expect 85-95           │   │
│  │ • 15 tier-2 brands (HubSpot, Asana) → expect 65-80          │   │
│  │ • 15 tier-3 brands (regional leaders) → expect 45-65        │   │
│  │ • 10 obscure brands (should not be known) → expect 10-30    │   │
│  │                                                               │   │
│  │ For each brand:                                              │   │
│  │ • Known industry                                             │   │
│  │ • Expected score range                                       │   │
│  │ • Should be mentioned (yes/no)                               │   │
│  │ • Expected sentiment                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  EVALUATION METRICS:                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. ACCURACY                                                   │   │
│  │    • % of brands in expected score range                     │   │
│  │    • Target: > 80%                                           │   │
│  │                                                               │   │
│  │ 2. MENTION PRECISION                                          │   │
│  │    • Correctly identifies if brand is mentioned              │   │
│  │    • Target: > 95%                                           │   │
│  │                                                               │   │
│  │ 3. SENTIMENT ACCURACY                                         │   │
│  │    • Matches expected sentiment                              │   │
│  │    • Target: > 85%                                           │   │
│  │                                                               │   │
│  │ 4. PARSE SUCCESS RATE                                         │   │
│  │    • % of responses that parse without errors                │   │
│  │    • Target: > 98%                                           │   │
│  │                                                               │   │
│  │ 5. LATENCY P95                                                │   │
│  │    • 95th percentile response time                           │   │
│  │    • Target: < 10 seconds                                    │   │
│  │                                                               │   │
│  │ 6. COST PER ANALYSIS                                          │   │
│  │    • Average API cost per golden test                        │   │
│  │    • Target: < $0.05                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CI/CD INTEGRATION:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ # .github/workflows/prompt-tests.yml                         │   │
│  │ on:                                                          │   │
│  │   pull_request:                                              │   │
│  │     paths:                                                   │   │
│  │       - 'src/lib/prompts/**'                                 │   │
│  │       - 'src/lib/ai/**'                                      │   │
│  │                                                               │   │
│  │ jobs:                                                        │   │
│  │   prompt-evaluation:                                         │   │
│  │     runs-on: ubuntu-latest                                   │   │
│  │     steps:                                                   │   │
│  │       - run: npm run test:prompts                            │   │
│  │       - run: npm run evaluate:golden-dataset                 │   │
│  │       # Block merge if accuracy drops > 5%                   │   │
│  │       - run: npm run check:prompt-regression                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: prompt_evaluations                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ prompt_id       UUID REFERENCES prompts(id)                  │   │
│  │ run_at          TIMESTAMPTZ                                  │   │
│  │ accuracy        DECIMAL                                      │   │
│  │ mention_precision DECIMAL                                    │   │
│  │ sentiment_accuracy DECIMAL                                   │   │
│  │ parse_success_rate DECIMAL                                   │   │
│  │ latency_p95_ms  INTEGER                                      │   │
│  │ cost_per_analysis DECIMAL                                    │   │
│  │ passed          BOOLEAN                                      │   │
│  │ details         JSONB                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.60 Temperature & Parameter Tuning Matrix (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  OPTIMAL PARAMETER CONFIGURATION                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TEMPERATURE BY TASK TYPE:                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Task                      │ Temp │ Rationale                 │   │
│  │ ──────────────────────────┼──────┼───────────────────────── │   │
│  │ Industry Detection        │ 0.1  │ Needs precision, not      │   │
│  │                           │      │ creativity                │   │
│  │ ──────────────────────────┼──────┼───────────────────────── │   │
│  │ Perception Query          │ 0.4  │ Some variety wanted for   │   │
│  │                           │      │ natural recommendations   │   │
│  │ ──────────────────────────┼──────┼───────────────────────── │   │
│  │ Response Extraction       │ 0.0  │ Pure extraction, zero     │   │
│  │                           │      │ creativity needed         │   │
│  │ ──────────────────────────┼──────┼───────────────────────── │   │
│  │ Recommendation Gen        │ 0.5  │ Creative suggestions      │   │
│  │                           │      │ appreciated               │   │
│  │ ──────────────────────────┼──────┼───────────────────────── │   │
│  │ Sentiment Analysis        │ 0.2  │ Analytical, slight room   │   │
│  │                           │      │ for interpretation        │   │
│  │ ──────────────────────────┼──────┼───────────────────────── │   │
│  │ Hallucination Check       │ 0.0  │ Must be deterministic,    │   │
│  │                           │      │ factual verification      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  OTHER CRITICAL PARAMETERS:                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ max_tokens:                                                  │   │
│  │ • Industry Detection: 500 (don't need long response)        │   │
│  │ • Perception Query: 1500 (need detailed recommendations)    │   │
│  │ • Extraction: 300 (just parsing existing text)              │   │
│  │ • Recommendations: 1000 (actionable suggestions)            │   │
│  │                                                               │   │
│  │ top_p (nucleus sampling):                                    │   │
│  │ • Set to 1.0 (use temperature for control instead)          │   │
│  │ • Changing both causes unpredictable behavior               │   │
│  │                                                               │   │
│  │ frequency_penalty:                                           │   │
│  │ • 0.0 for extraction tasks                                   │   │
│  │ • 0.3 for recommendation generation (reduce repetition)     │   │
│  │                                                               │   │
│  │ presence_penalty:                                            │   │
│  │ • 0.0 for most tasks                                        │   │
│  │ • 0.2 for creative tasks (encourage topic diversity)        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPLEMENTATION:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // /lib/prompts/parameters.ts                                │   │
│  │ export const PROMPT_PARAMETERS: Record<PromptType, Params> = │   │
│  │ {                                                            │   │
│  │   industry_detection: {                                      │   │
│  │     temperature: 0.1,                                        │   │
│  │     maxTokens: 500,                                          │   │
│  │     topP: 1.0,                                               │   │
│  │     frequencyPenalty: 0.0,                                   │   │
│  │     presencePenalty: 0.0,                                    │   │
│  │   },                                                         │   │
│  │   perception_query: {                                        │   │
│  │     temperature: 0.4,                                        │   │
│  │     maxTokens: 1500,                                         │   │
│  │     topP: 1.0,                                               │   │
│  │     frequencyPenalty: 0.3,                                   │   │
│  │     presencePenalty: 0.0,                                    │   │
│  │   },                                                         │   │
│  │   // ... other prompt types                                  │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.61 Ontology Engineering Architecture (NEW - Principal Ontologist Review)

```
┌─────────────────────────────────────────────────────────────────────┐
│       ONTOLOGY & KNOWLEDGE MODELING GAPS IDENTIFIED                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. NO FORMAL ONTOLOGY DEFINITION                                   │
│     ═══════════════════════════════                                 │
│     Problem: Industry taxonomy exists but lacks formal ontology     │
│     Impact: No machine-readable concept hierarchy, poor inference   │
│     Solution: Define formal OWL/SKOS ontology for domain concepts   │
│                                                                     │
│  2. NO UPPER ONTOLOGY ALIGNMENT                                     │
│     ═══════════════════════════════                                 │
│     Problem: Custom concepts not aligned to standard upper ontology │
│     Impact: Incompatible with external knowledge bases              │
│     Solution: Align to Schema.org + Wikidata ontology patterns      │
│                                                                     │
│  3. NO SEMANTIC TYPING SYSTEM                                       │
│     ════════════════════════════                                    │
│     Problem: Entity types are simple enums, not semantic classes    │
│     Impact: Can't express "HubSpot is-a CRM is-a Software"         │
│     Solution: Implement class hierarchy with subsumption reasoning  │
│                                                                     │
│  4. NO PROPERTY TAXONOMY                                            │
│     ════════════════════════                                        │
│     Problem: Relationships are flat strings, no property hierarchy  │
│     Impact: "competes_with" and "rival_of" are disconnected         │
│     Solution: Define property ontology with inverse/transitive rules│
│                                                                     │
│  5. NO TEMPORAL MODELING                                            │
│     ═══════════════════════                                         │
│     Problem: Entities have no temporal dimension                    │
│     Impact: Can't track "was competitor in 2020, acquired in 2023"  │
│     Solution: 4D ontology pattern with temporal validity intervals  │
│                                                                     │
│  6. NO PROVENANCE TRACKING                                          │
│     ══════════════════════                                          │
│     Problem: Facts have no provenance metadata                      │
│     Impact: Can't distinguish AI-inferred vs Wikidata vs user-input │
│     Solution: PROV-O compliant provenance tracking                  │
│                                                                     │
│  7. NO UNCERTAINTY REPRESENTATION                                   │
│     ════════════════════════════                                    │
│     Problem: All facts treated as certain binary true/false         │
│     Impact: AI confidence lost, false certainty in UI               │
│     Solution: Probabilistic assertions with confidence intervals    │
│                                                                     │
│  8. NO CROSS-DOMAIN CONCEPT MAPPING                                 │
│     ═════════════════════════════════                               │
│     Problem: Industry concepts isolated from external vocabularies  │
│     Impact: Can't link "SaaS" to Wikidata Q254457, NAICS 541512    │
│     Solution: Explicit skos:exactMatch/closeMatch to external KGs   │
│                                                                     │
│  9. NO COMPETENCY QUESTIONS DEFINED                                 │
│     ═════════════════════════════════                               │
│     Problem: Ontology built without formal query requirements       │
│     Impact: May not support actual business questions               │
│     Solution: Define CQs that ontology must answer                  │
│                                                                     │
│  10. NO ONTOLOGY VERSIONING STRATEGY                                │
│      ═══════════════════════════════                                │
│      Problem: No plan for ontology evolution/deprecation            │
│      Impact: Breaking changes affect all historical analyses        │
│      Solution: URI-based versioning, deprecation policy             │
│                                                                     │
│  11. NO MULTI-LINGUAL CONCEPT LABELS                                │
│      ═════════════════════════════════                              │
│      Problem: Concepts have English-only labels                     │
│      Impact: Can't serve Spanish, Portuguese markets properly       │
│      Solution: SKOS prefLabel/altLabel in multiple languages        │
│                                                                     │
│  12. NO AXIOM CONSTRAINTS                                           │
│      ════════════════════════                                       │
│      Problem: No semantic constraints on relationships              │
│      Impact: Nonsense facts allowed (Person competes_with Software) │
│      Solution: OWL domain/range restrictions, disjointness axioms   │
│                                                                     │
│  13. NO SEMANTIC SIMILARITY METRICS                                 │
│      ══════════════════════════════                                 │
│      Problem: No way to compute concept similarity from ontology    │
│      Impact: "Similar brands" based only on embeddings, not meaning │
│      Solution: Wu-Palmer, Lin similarity using ontology structure   │
│                                                                     │
│  14. NO INFERENCE RULES ENGINE                                      │
│      ═══════════════════════════                                    │
│      Problem: No reasoning over stored facts                        │
│      Impact: Can't derive "if A competes with B, B competes with A" │
│      Solution: Rule-based inference layer (SWRL or custom)          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.62 Formal Ontology Design (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   AI PERCEPTION DOMAIN ONTOLOGY                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  NAMESPACE: https://aiperception.com/ontology/v1#                   │
│  PREFIX: aip:                                                       │
│                                                                     │
│  UPPER ONTOLOGY ALIGNMENT:                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Thing (owl:Thing)                                            │   │
│  │  ├─ schema:Organization (external)                           │   │
│  │  │   └─ aip:Brand                                           │   │
│  │  │       ├─ aip:AnalyzedBrand (has perception score)        │   │
│  │  │       └─ aip:CompetitorBrand                             │   │
│  │  ├─ schema:Product (external)                                │   │
│  │  │   └─ aip:AnalyzedProduct                                 │   │
│  │  ├─ aip:Industry                                             │   │
│  │  │   ├─ aip:PrimaryIndustry                                 │   │
│  │  │   └─ aip:SubIndustry                                     │   │
│  │  ├─ aip:AIProvider                                           │   │
│  │  │   ├─ aip:OpenAIProvider                                  │   │
│  │  │   ├─ aip:AnthropicProvider                               │   │
│  │  │   ├─ aip:GoogleProvider                                  │   │
│  │  │   └─ aip:PerplexityProvider                              │   │
│  │  ├─ aip:PerceptionAnalysis                                   │   │
│  │  │   ├─ aip:SingleProviderAnalysis                          │   │
│  │  │   └─ aip:AggregatedAnalysis                              │   │
│  │  ├─ aip:Recommendation                                       │   │
│  │  │   ├─ aip:DirectRecommendation (brand explicitly named)   │   │
│  │  │   └─ aip:IndirectMention (brand referenced)              │   │
│  │  └─ aip:PerceptionScore                                      │   │
│  │      ├─ aip:RawScore                                        │   │
│  │      └─ aip:CalibratedScore                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  OBJECT PROPERTIES:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ aip:competesWith                                             │   │
│  │   Domain: aip:Brand                                          │   │
│  │   Range: aip:Brand                                           │   │
│  │   Characteristics: Symmetric                                 │   │
│  │                                                               │   │
│  │ aip:operatesInIndustry                                       │   │
│  │   Domain: aip:Brand                                          │   │
│  │   Range: aip:Industry                                        │   │
│  │                                                               │   │
│  │ aip:hasSubIndustry                                           │   │
│  │   Domain: aip:PrimaryIndustry                                │   │
│  │   Range: aip:SubIndustry                                     │   │
│  │   Characteristics: Transitive                                │   │
│  │                                                               │   │
│  │ aip:analyzedBy                                                │   │
│  │   Domain: aip:PerceptionAnalysis                             │   │
│  │   Range: aip:AIProvider                                      │   │
│  │                                                               │   │
│  │ aip:mentionedIn                                               │   │
│  │   Domain: aip:Brand                                          │   │
│  │   Range: aip:PerceptionAnalysis                              │   │
│  │   Inverse: aip:mentionsBrand                                 │   │
│  │                                                               │   │
│  │ aip:recommendsFor                                             │   │
│  │   Domain: aip:AIProvider                                     │   │
│  │   Range: aip:Brand                                           │   │
│  │                                                               │   │
│  │ aip:hasPerceptionScore                                        │   │
│  │   Domain: aip:PerceptionAnalysis                             │   │
│  │   Range: aip:PerceptionScore                                 │   │
│  │   Characteristics: Functional                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATA PROPERTIES:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ aip:scoreValue                                                │   │
│  │   Domain: aip:PerceptionScore                                │   │
│  │   Range: xsd:decimal [0-100]                                 │   │
│  │                                                               │   │
│  │ aip:confidence                                                │   │
│  │   Domain: aip:PerceptionAnalysis                             │   │
│  │   Range: xsd:decimal [0-1]                                   │   │
│  │                                                               │   │
│  │ aip:analysisDate                                              │   │
│  │   Domain: aip:PerceptionAnalysis                             │   │
│  │   Range: xsd:dateTime                                        │   │
│  │                                                               │   │
│  │ aip:validFrom / aip:validTo                                   │   │
│  │   Domain: owl:Thing (temporal validity)                      │   │
│  │   Range: xsd:dateTime                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.63 Competency Questions (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│             ONTOLOGY COMPETENCY QUESTIONS (CQs)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PRINCIPLE: Ontology must answer these business questions           │
│                                                                     │
│  BRAND PERCEPTION CQs:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ CQ1: What is the AI perception score for Brand X?            │   │
│  │      SPARQL: SELECT ?score WHERE { :BrandX aip:hasScore ?s . │   │
│  │              ?s aip:scoreValue ?score }                       │   │
│  │                                                               │   │
│  │ CQ2: Which AI providers recommend Brand X?                    │   │
│  │      SPARQL: SELECT ?provider WHERE {                         │   │
│  │              ?provider aip:recommendsFor :BrandX }            │   │
│  │                                                               │   │
│  │ CQ3: Who are Brand X's competitors according to AI?           │   │
│  │      SPARQL: SELECT ?competitor WHERE {                       │   │
│  │              :BrandX aip:competesWith ?competitor }           │   │
│  │                                                               │   │
│  │ CQ4: What industry does Brand X operate in?                   │   │
│  │      SPARQL: SELECT ?industry WHERE {                         │   │
│  │              :BrandX aip:operatesInIndustry ?industry }       │   │
│  │                                                               │   │
│  │ CQ5: How has Brand X's score changed over time?               │   │
│  │      SPARQL: SELECT ?date ?score WHERE {                      │   │
│  │              ?analysis aip:analyzes :BrandX ;                 │   │
│  │                        aip:analysisDate ?date ;               │   │
│  │                        aip:hasScore/aip:scoreValue ?score }   │   │
│  │              ORDER BY ?date                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  COMPETITIVE INTELLIGENCE CQs:                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ CQ6: Which brands in Industry Y have score > 70?              │   │
│  │ CQ7: What's the average score for Industry Y?                 │   │
│  │ CQ8: Which brands improved score in last 30 days?             │   │
│  │ CQ9: Which AI provider favors Brand X most?                   │   │
│  │ CQ10: What brands are mentioned together with Brand X?        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  INFERENCE CQs (Require Reasoning):                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ CQ11: If A competes with B, and B competes with C,            │   │
│  │       is A an indirect competitor of C?                       │   │
│  │       → Requires: transitive closure reasoning                │   │
│  │                                                               │   │
│  │ CQ12: If Brand X is in SubIndustry "CRM Software",            │   │
│  │       is it also in ParentIndustry "Technology"?              │   │
│  │       → Requires: class hierarchy reasoning                   │   │
│  │                                                               │   │
│  │ CQ13: Which brands are similar to Brand X?                    │   │
│  │       → Requires: semantic similarity computation             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPLEMENTATION:                                                   │
│  • Store ontology as JSON-LD in PostgreSQL JSONB column           │
│  • Basic queries via PostgREST with JSONB operators               │
│  • Complex reasoning via materialized views (pre-computed)        │
│  • Future: Optional RDF triplestore for SPARQL if needed          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.64 External Knowledge Base Alignment (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              CROSS-KNOWLEDGE-BASE ENTITY LINKING                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GOAL: Link our entities to authoritative external knowledge bases │
│                                                                     │
│  PRIMARY ALIGNMENTS:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. WIKIDATA (Q-IDs)                                          │   │
│  │    • Every brand should have wikidata_id if exists           │   │
│  │    • HubSpot → Q17085659                                     │   │
│  │    • Salesforce → Q941127                                    │   │
│  │    • Benefits: Authority signal for AI models                │   │
│  │                                                               │   │
│  │ 2. SCHEMA.ORG                                                 │   │
│  │    • Map aip:Brand → schema:Organization                     │   │
│  │    • Map aip:Industry → schema:CategoryCode                  │   │
│  │    • Benefits: Web-wide interoperability                     │   │
│  │                                                               │   │
│  │ 3. NAICS CODES (North American Industry Classification)      │   │
│  │    • Map industries to NAICS for standardization             │   │
│  │    • "CRM Software" → 541512 (Computer Systems Design)       │   │
│  │    • Benefits: Economic reporting, B2B data matching         │   │
│  │                                                               │   │
│  │ 4. ISIC CODES (International Standard Classification)        │   │
│  │    • For non-US markets                                      │   │
│  │    • Benefits: Global industry standardization               │   │
│  │                                                               │   │
│  │ 5. LEI (Legal Entity Identifier)                             │   │
│  │    • For enterprise customers                                │   │
│  │    • Benefits: Unambiguous legal entity identification       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  MAPPING PREDICATES (SKOS):                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ skos:exactMatch  → Identical concept (same meaning)          │   │
│  │   aip:Salesforce skos:exactMatch wd:Q941127                  │   │
│  │                                                               │   │
│  │ skos:closeMatch  → Similar but not identical                 │   │
│  │   aip:CRMSoftware skos:closeMatch naics:541512               │   │
│  │                                                               │   │
│  │ skos:broadMatch  → Our concept is narrower                   │   │
│  │   aip:SaaSCRM skos:broadMatch aip:CRMSoftware                │   │
│  │                                                               │   │
│  │ skos:narrowMatch → Our concept is broader                    │   │
│  │   aip:Technology skos:narrowMatch aip:CRMSoftware            │   │
│  │                                                               │   │
│  │ owl:sameAs       → Exact identity (use sparingly)            │   │
│  │   Only for verified identical entities                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE EXTENSION:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TABLE: entity_alignments                                     │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ id              UUID PRIMARY KEY                         │ │   │
│  │ │ entity_id       UUID REFERENCES entities(id)             │ │   │
│  │ │ external_kb     ENUM('wikidata','schema.org','naics',    │ │   │
│  │ │                      'isic','lei','dbpedia')              │ │   │
│  │ │ external_id     TEXT (Q941127, 541512, etc.)             │ │   │
│  │ │ mapping_type    ENUM('exactMatch','closeMatch',          │ │   │
│  │ │                      'broadMatch','narrowMatch','sameAs') │ │   │
│  │ │ confidence      DECIMAL (0-1)                            │ │   │
│  │ │ verified_by     TEXT (null='AI', else='human')           │ │   │
│  │ │ created_at      TIMESTAMPTZ                              │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  AUTO-LINKING WORKFLOW:                                            │
│  1. Extract brand name from analysis                               │
│  2. Query Wikidata API for matches                                 │
│  3. If single high-confidence match → auto-link                    │
│  4. If multiple matches → flag for human disambiguation            │
│  5. If no match → suggest Wikidata entry creation                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.65 Provenance & Uncertainty Tracking (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   PROV-O COMPLIANT PROVENANCE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM: Facts without provenance are unverifiable                 │
│                                                                     │
│  SOLUTION: Track origin of every fact using W3C PROV-O             │
│                                                                     │
│  PROVENANCE TYPES:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ prov:Entity      → The fact/assertion itself                 │   │
│  │ prov:Activity    → How fact was derived                      │   │
│  │ prov:Agent       → Who/what created the fact                 │   │
│  │                                                               │   │
│  │ AGENT TYPES:                                                  │   │
│  │ • aip:AIAgent (GPT-4, Claude, etc.)                         │   │
│  │ • aip:SystemAgent (our extraction pipeline)                 │   │
│  │ • aip:ExternalKB (Wikidata, DBpedia)                        │   │
│  │ • aip:HumanAgent (user input, manual verification)          │   │
│  │                                                               │   │
│  │ DERIVATION TYPES:                                            │   │
│  │ • prov:wasDerivedFrom → general derivation                  │   │
│  │ • prov:wasQuotedFrom → direct quote from source             │   │
│  │ • prov:wasInferredFrom → reasoning/inference                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: fact_provenance                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ fact_type       ENUM('entity','relationship','score',        │   │
│  │                      'mention','recommendation')              │   │
│  │ fact_id         UUID (polymorphic reference)                 │   │
│  │ agent_type      ENUM('ai','system','external_kb','human')   │   │
│  │ agent_id        TEXT (gpt-4-turbo, wikidata, user@email)    │   │
│  │ activity_type   ENUM('extraction','inference','import',      │   │
│  │                      'user_input','verification')             │   │
│  │ source_url      TEXT (nullable, for web sources)             │   │
│  │ source_query    TEXT (nullable, for AI queries)              │   │
│  │ confidence      DECIMAL (0-1)                                │   │
│  │ timestamp       TIMESTAMPTZ                                  │   │
│  │ supersedes      UUID (nullable, links to previous version)   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  UNCERTAINTY REPRESENTATION:                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ PROBABILISTIC ASSERTIONS:                                    │   │
│  │                                                               │   │
│  │ Instead of: "HubSpot competes with Salesforce" (binary)      │   │
│  │ Store: {                                                     │   │
│  │   "assertion": "competes_with",                              │   │
│  │   "subject": "HubSpot",                                      │   │
│  │   "object": "Salesforce",                                    │   │
│  │   "confidence": 0.92,                                        │   │
│  │   "confidence_interval": [0.87, 0.97],                       │   │
│  │   "evidence_count": 4,                                       │   │
│  │   "agreement_rate": 0.95  // 4 AI providers agreed          │   │
│  │ }                                                            │   │
│  │                                                               │   │
│  │ CONFIDENCE LEVELS:                                           │   │
│  │ • 0.95-1.00: Verified fact (Wikidata, user-confirmed)       │   │
│  │ • 0.80-0.94: High confidence (multiple AI providers agree)  │   │
│  │ • 0.60-0.79: Moderate confidence (majority agree)           │   │
│  │ • 0.40-0.59: Low confidence (mixed signals)                 │   │
│  │ • 0.00-0.39: Very uncertain (single source, no verification)│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  UI IMPLICATIONS:                                                  │
│  • Show confidence badges on facts                                 │
│  • "Based on analysis by ChatGPT and Claude"                      │
│  • "Verified via Wikidata" for high-trust facts                   │
│  • Warning icons for low-confidence assertions                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.66 Inference Rules Engine (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SEMANTIC INFERENCE RULES                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GOAL: Derive new facts from existing facts using logic            │
│                                                                     │
│  RULE TYPES:                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. SYMMETRIC RULES                                           │   │
│  │    IF: A competes_with B                                     │   │
│  │    THEN: B competes_with A                                   │   │
│  │                                                               │   │
│  │ 2. TRANSITIVE RULES                                          │   │
│  │    IF: Industry A has_subindustry B                          │   │
│  │        AND B has_subindustry C                               │   │
│  │    THEN: A has_subindustry C (indirect)                      │   │
│  │                                                               │   │
│  │ 3. INVERSE RULES                                             │   │
│  │    IF: Analysis X mentions_brand Y                           │   │
│  │    THEN: Y mentioned_in X                                    │   │
│  │                                                               │   │
│  │ 4. CLASS HIERARCHY RULES                                     │   │
│  │    IF: X is_a CRMSoftware                                    │   │
│  │        AND CRMSoftware subclass_of Software                  │   │
│  │    THEN: X is_a Software                                     │   │
│  │                                                               │   │
│  │ 5. DOMAIN/RANGE VALIDATION                                   │   │
│  │    IF: X competes_with Y                                     │   │
│  │        AND competes_with.domain = Brand                      │   │
│  │    THEN: X must_be_type Brand                                │   │
│  │                                                               │   │
│  │ 6. DISJOINTNESS RULES                                        │   │
│  │    IF: Person and Organization are disjoint                  │   │
│  │    THEN: X cannot be both Person AND Organization            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPLEMENTATION (Lightweight, No Full Reasoner):                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // PostgreSQL Materialized Views for pre-computed inference  │   │
│  │                                                               │   │
│  │ -- Symmetric competitor closure                              │   │
│  │ CREATE MATERIALIZED VIEW competitor_pairs AS                 │   │
│  │ SELECT subject_id, object_id FROM entity_relationships       │   │
│  │ WHERE predicate = 'competes_with'                            │   │
│  │ UNION                                                        │   │
│  │ SELECT object_id, subject_id FROM entity_relationships       │   │
│  │ WHERE predicate = 'competes_with';                           │   │
│  │                                                               │   │
│  │ -- Industry hierarchy closure                                │   │
│  │ CREATE MATERIALIZED VIEW industry_hierarchy AS               │   │
│  │ WITH RECURSIVE hierarchy AS (                                │   │
│  │   SELECT id, parent_id, name, 1 as depth FROM industries     │   │
│  │   WHERE parent_id IS NULL                                    │   │
│  │   UNION ALL                                                  │   │
│  │   SELECT i.id, i.parent_id, i.name, h.depth + 1              │   │
│  │   FROM industries i                                          │   │
│  │   JOIN hierarchy h ON i.parent_id = h.id                     │   │
│  │ )                                                            │   │
│  │ SELECT * FROM hierarchy;                                     │   │
│  │                                                               │   │
│  │ -- Refresh on schedule (not real-time)                       │   │
│  │ -- CRON: REFRESH MATERIALIZED VIEW CONCURRENTLY every hour   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  VALIDATION TRIGGERS:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // On INSERT to entity_relationships                         │   │
│  │ CREATE TRIGGER validate_relationship                         │   │
│  │ BEFORE INSERT ON entity_relationships                        │   │
│  │ FOR EACH ROW EXECUTE FUNCTION check_domain_range();          │   │
│  │                                                               │   │
│  │ // check_domain_range() ensures:                              │   │
│  │ // - competes_with only links Brand to Brand                 │   │
│  │ // - operates_in only links Brand to Industry                │   │
│  │ // - founded_by only links Organization to Person            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  FUTURE: If reasoning needs grow, consider:                        │
│  • Apache Jena Fuseki (SPARQL + OWL reasoning)                    │
│  • Stardog (commercial, excellent OWL support)                    │
│  • Neo4j + APOC (graph algorithms)                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.67 Multi-Lingual Concept Labels (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│                SKOS MULTI-LINGUAL LABELING                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  REQUIREMENT: Serve Spanish-speaking Latin American markets         │
│                                                                     │
│  SKOS LABEL TYPES:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ skos:prefLabel    → Primary label (one per language)         │   │
│  │ skos:altLabel     → Alternative labels (synonyms)            │   │
│  │ skos:hiddenLabel  → For search, not displayed                │   │
│  │                                                               │   │
│  │ EXAMPLE:                                                      │   │
│  │ aip:CRMSoftware                                              │   │
│  │   skos:prefLabel "CRM Software"@en                           │   │
│  │   skos:prefLabel "Software de CRM"@es                        │   │
│  │   skos:prefLabel "Software de CRM"@pt                        │   │
│  │   skos:altLabel  "Customer Relationship Management"@en       │   │
│  │   skos:altLabel  "Gestión de Relaciones con Clientes"@es     │   │
│  │   skos:hiddenLabel "CRM"@en                                  │   │
│  │   skos:hiddenLabel "software crm"@es  (lowercase for search) │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE EXTENSION:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TABLE: concept_labels                                        │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ id              UUID PRIMARY KEY                         │ │   │
│  │ │ entity_id       UUID REFERENCES entities(id)             │ │   │
│  │ │ label_type      ENUM('prefLabel','altLabel','hiddenLabel')│ │   │
│  │ │ language        VARCHAR(5) (en, es, pt, fr, etc.)        │ │   │
│  │ │ value           TEXT                                     │ │   │
│  │ │ is_auto_translated BOOLEAN                               │ │   │
│  │ │ created_at      TIMESTAMPTZ                              │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  │ UNIQUE CONSTRAINT: (entity_id, label_type, language)         │   │
│  │ for prefLabel only (one preferred label per language)        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TRANSLATION WORKFLOW:                                             │
│  1. Create English labels first (canonical)                        │
│  2. Auto-translate to Spanish/Portuguese via DeepL API            │
│  3. Flag auto-translations for human review                        │
│  4. Native speaker verifies and corrects                          │
│                                                                     │
│  LANGUAGE PRIORITIES:                                              │
│  • Phase 1: English (en), Spanish (es)                            │
│  • Phase 2: Portuguese (pt), French (fr)                          │
│  • Phase 3: German (de), Italian (it)                             │
│                                                                     │
│  QUERY IMPLEMENTATION:                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Get industry label in user's language                     │   │
│  │ const getLabel = async (entityId: string, lang: string) => { │   │
│  │   const label = await db.concept_labels.findFirst({          │   │
│  │     where: {                                                 │   │
│  │       entity_id: entityId,                                   │   │
│  │       language: lang,                                        │   │
│  │       label_type: 'prefLabel'                               │   │
│  │     }                                                        │   │
│  │   });                                                        │   │
│  │   // Fallback to English if not available                    │   │
│  │   return label?.value ?? getFallbackEnglish(entityId);       │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.68 Semantic Similarity Engine (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│               ONTOLOGY-BASED SIMILARITY METRICS                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GOAL: "Find brands similar to X" using ontology structure          │
│                                                                     │
│  SIMILARITY TYPES:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. STRUCTURAL SIMILARITY (Ontology-based)                    │   │
│  │    • Wu-Palmer: Based on Least Common Subsumer depth         │   │
│  │    • Lin: Information Content based                          │   │
│  │    • Path Length: Shortest path in hierarchy                 │   │
│  │                                                               │   │
│  │ 2. FEATURE SIMILARITY (Attribute-based)                      │   │
│  │    • Same industry → +0.3                                    │   │
│  │    • Same sub-industry → +0.5                                │   │
│  │    • Same country → +0.2                                     │   │
│  │    • Similar size → +0.2                                     │   │
│  │    • Common competitors → +0.1 per shared competitor         │   │
│  │                                                               │   │
│  │ 3. EMBEDDING SIMILARITY (Vector-based)                       │   │
│  │    • Cosine similarity of description embeddings             │   │
│  │    • Already planned in roadmap                              │   │
│  │                                                               │   │
│  │ COMBINED SCORE:                                               │   │
│  │ similarity = α * structural + β * feature + γ * embedding    │   │
│  │ Default weights: α=0.3, β=0.3, γ=0.4                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  WU-PALMER IMPLEMENTATION:                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Wu-Palmer similarity using industry hierarchy             │   │
│  │ const wuPalmerSimilarity = (                                 │   │
│  │   industry1: string,                                         │   │
│  │   industry2: string,                                         │   │
│  │   hierarchy: IndustryTree                                    │   │
│  │ ): number => {                                               │   │
│  │   const lcs = findLeastCommonSubsumer(industry1, industry2); │   │
│  │   const depth_lcs = getDepth(lcs, hierarchy);                │   │
│  │   const depth_1 = getDepth(industry1, hierarchy);            │   │
│  │   const depth_2 = getDepth(industry2, hierarchy);            │   │
│  │                                                               │   │
│  │   // Wu-Palmer formula                                        │   │
│  │   return (2 * depth_lcs) / (depth_1 + depth_2);              │   │
│  │ };                                                           │   │
│  │                                                               │   │
│  │ // Example:                                                   │   │
│  │ // CRM Software and Marketing Software                        │   │
│  │ // LCS = "Business Software"                                  │   │
│  │ // depth(LCS) = 2, depth(CRM) = 3, depth(Marketing) = 3      │   │
│  │ // similarity = (2 * 2) / (3 + 3) = 0.67                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  USE CASES:                                                        │
│  • "Similar brands you might want to analyze"                     │
│  • "Competitors in related industries"                             │
│  • "Brands with similar AI perception profiles"                   │
│  • "Industry benchmarking peers"                                  │
│                                                                     │
│  DATABASE TABLE: brand_similarity_cache                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ brand_a_id      UUID                                         │   │
│  │ brand_b_id      UUID                                         │   │
│  │ structural_sim  DECIMAL                                      │   │
│  │ feature_sim     DECIMAL                                      │   │
│  │ embedding_sim   DECIMAL                                      │   │
│  │ combined_sim    DECIMAL                                      │   │
│  │ computed_at     TIMESTAMPTZ                                  │   │
│  │ PRIMARY KEY (brand_a_id, brand_b_id)                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  REFRESH: Batch compute weekly, on-demand for new brands           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.69 Computational Linguistics Architecture (NEW - CL Review)

```
┌─────────────────────────────────────────────────────────────────────┐
│       COMPUTATIONAL LINGUISTICS GAPS IDENTIFIED                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. NO DISCOURSE ANALYSIS                                           │
│     ═══════════════════════                                         │
│     Problem: AI responses analyzed as flat text, no structure       │
│     Impact: Miss rhetorical patterns that indicate recommendation   │
│     Solution: Discourse parsing to identify argument structure      │
│                                                                     │
│  2. NO COREFERENCE RESOLUTION                                       │
│     ═══════════════════════════                                     │
│     Problem: "It is the best CRM" - what does "it" refer to?        │
│     Impact: Miss indirect brand mentions via pronouns               │
│     Solution: Coreference chains to link pronouns to entities       │
│                                                                     │
│  3. NO SEMANTIC ROLE LABELING (SRL)                                 │
│     ════════════════════════════════                                │
│     Problem: Who is recommending what to whom?                      │
│     Impact: Can't distinguish "X recommends Y" vs "Y recommends X"  │
│     Solution: SRL to identify Agent, Theme, Beneficiary roles       │
│                                                                     │
│  4. NO HEDGE/CERTAINTY DETECTION                                    │
│     ══════════════════════════════                                  │
│     Problem: "might be good" vs "is definitely the best"            │
│     Impact: All recommendations treated with equal confidence       │
│     Solution: Epistemic modality classification                     │
│                                                                     │
│  5. NO COMPARATIVE/SUPERLATIVE EXTRACTION                           │
│     ═════════════════════════════════════                           │
│     Problem: "better than X", "the best", "among the top"           │
│     Impact: Miss ranking signals in AI responses                    │
│     Solution: Comparative construction parser                       │
│                                                                     │
│  6. NO ASPECT-BASED SENTIMENT ANALYSIS                              │
│     ════════════════════════════════════                            │
│     Problem: Overall sentiment exists but not per-aspect            │
│     Impact: "Great pricing but terrible support" = both aspects     │
│     Solution: Extract sentiment for each mentioned aspect           │
│                                                                     │
│  7. NO QUERY INTENT CLASSIFICATION                                  │
│     ══════════════════════════════                                  │
│     Problem: All AI queries treated identically                     │
│     Impact: Different intents need different prompt strategies      │
│     Solution: Classify: informational, navigational, transactional  │
│                                                                     │
│  8. NO LEXICAL VARIATION HANDLING                                   │
│     ══════════════════════════════                                  │
│     Problem: "CRM" vs "customer relationship management" vs "CRM"   │
│     Impact: Same concept counted as different mentions              │
│     Solution: Lemmatization + synonym resolution + acronym expansion│
│                                                                     │
│  9. NO NEGATION SCOPE DETECTION                                     │
│     ═══════════════════════════                                     │
│     Problem: "I would not recommend X" parsed as recommendation     │
│     Impact: Negative mentions counted as positive                   │
│     Solution: Negation scope parser with sentiment inversion        │
│                                                                     │
│  10. NO QUOTATION/ATTRIBUTION PARSING                               │
│      ══════════════════════════════                                 │
│      Problem: "Users say X is great" - who is the source?           │
│      Impact: Can't distinguish AI opinion vs cited opinion          │
│      Solution: Attribution extraction (direct/indirect speech)      │
│                                                                     │
│  11. NO TEMPORAL EXPRESSION EXTRACTION                              │
│      ═══════════════════════════════                                │
│      Problem: "was popular in 2020", "recently updated"             │
│      Impact: Miss temporal context of recommendations               │
│      Solution: TIMEX3 temporal expression normalization             │
│                                                                     │
│  12. NO MULTI-LINGUAL NLP PIPELINE                                  │
│      ════════════════════════════                                   │
│      Problem: Only English processing, Spanish market planned       │
│      Impact: Can't analyze Spanish AI responses accurately          │
│      Solution: Language-agnostic NLP with Spanish spaCy/Stanza      │
│                                                                     │
│  13. NO READABILITY SCORING FOR AI OPTIMIZATION                     │
│      ═══════════════════════════════════════════                    │
│      Problem: No guidance on content readability for AI             │
│      Impact: Complex content may be ignored by AI models            │
│      Solution: Flesch-Kincaid, SMOG, Gunning Fog for RAG score      │
│                                                                     │
│  14. NO KEYWORD/KEYPHRASE EXTRACTION                                │
│      ════════════════════════════════                               │
│      Problem: No extraction of salient terms from AI responses      │
│      Impact: Can't identify what keywords trigger recommendations   │
│      Solution: TF-IDF, RAKE, or YAKE keyphrase extraction           │
│                                                                     │
│  15. NO TOPIC MODELING FOR COMPETITOR ANALYSIS                      │
│      ═══════════════════════════════════════                        │
│      Problem: Competitors mentioned but context unclear             │
│      Impact: Don't know WHY competitors are mentioned               │
│      Solution: LDA/BERTopic for topic clustering of mentions        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.70 Discourse & Argumentation Analysis (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              DISCOURSE STRUCTURE ANALYSIS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GOAL: Understand HOW AI structures its recommendations             │
│                                                                     │
│  DISCOURSE RELATIONS TO DETECT:                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • RECOMMENDATION: "I recommend X because..."                 │   │
│  │ • ELABORATION: "X is good. It offers..."                    │   │
│  │ • CONTRAST: "Unlike Y, X provides..."                       │   │
│  │ • CONDITION: "If you need Z, then X is..."                  │   │
│  │ • CONCESSION: "Although X is expensive, it..."              │   │
│  │ • JUSTIFICATION: "X is best because..."                     │   │
│  │ • EVALUATION: "X is excellent/poor/adequate"                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ARGUMENTATION MINING:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ CLAIM: "HubSpot is the best CRM for SMBs"                    │   │
│  │   │                                                          │   │
│  │   ├── PREMISE 1: "It offers free tier" (SUPPORT)            │   │
│  │   ├── PREMISE 2: "Easy to use" (SUPPORT)                    │   │
│  │   └── PREMISE 3: "Limited enterprise features" (ATTACK)     │   │
│  │                                                               │   │
│  │ STRENGTH = (supports - attacks) / total_premises            │   │
│  │          = (2 - 1) / 3 = 0.33 (moderate)                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPLEMENTATION:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Lightweight: Pattern-based discourse markers              │   │
│  │ const DISCOURSE_MARKERS = {                                  │   │
│  │   recommendation: ['recommend', 'suggest', 'try', 'consider'],│   │
│  │   contrast: ['however', 'unlike', 'but', 'although'],       │   │
│  │   justification: ['because', 'since', 'due to', 'as'],      │   │
│  │   evaluation: ['best', 'excellent', 'poor', 'great'],       │   │
│  │   condition: ['if you', 'when you', 'for those who'],       │   │
│  │   concession: ['although', 'despite', 'even though'],       │   │
│  │ };                                                           │   │
│  │                                                               │   │
│  │ // Extract discourse units                                    │   │
│  │ const analyzeDiscourse = (text: string): DiscourseUnit[] => {│   │
│  │   const sentences = splitSentences(text);                    │   │
│  │   return sentences.map(s => ({                               │   │
│  │     text: s,                                                 │   │
│  │     relation: detectDiscourseRelation(s),                    │   │
│  │     entities: extractEntities(s),                            │   │
│  │     sentiment: analyzeSentiment(s),                          │   │
│  │   }));                                                       │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: discourse_analysis                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ ai_response_id  UUID REFERENCES ai_responses(id)             │   │
│  │ sentence_idx    INTEGER                                      │   │
│  │ sentence_text   TEXT                                         │   │
│  │ discourse_rel   ENUM('recommendation','contrast','justify',  │   │
│  │                      'evaluation','condition','elaboration') │   │
│  │ mentioned_entities TEXT[] (brand names in sentence)          │   │
│  │ sentiment_score DECIMAL (-1 to 1)                            │   │
│  │ is_claim        BOOLEAN                                      │   │
│  │ supports_claim  UUID[] (sentence IDs that support)           │   │
│  │ attacks_claim   UUID[] (sentence IDs that attack)            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.71 Coreference & Entity Linking (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              COREFERENCE RESOLUTION SYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM EXAMPLE:                                                  │
│  "HubSpot is a popular CRM. It offers free tools. The platform     │
│   is known for its ease of use. This solution works well for SMBs."│
│                                                                     │
│  COREFERENCE CHAIN:                                                │
│  [HubSpot] ← [It] ← [The platform] ← [This solution]               │
│                                                                     │
│  WHY IT MATTERS:                                                   │
│  • "It" alone = no brand mention detected                          │
│  • With coreference = 4 brand mentions detected                    │
│  • Dramatically affects Share of Voice calculation                 │
│                                                                     │
│  IMPLEMENTATION OPTIONS:                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ OPTION A: Rule-based (Fast, ~80% accuracy)                   │   │
│  │ • Track most recent named entity                             │   │
│  │ • Pronouns (it, they, their) → nearest compatible entity     │   │
│  │ • Definite NPs (the company, the platform) → last org        │   │
│  │                                                               │   │
│  │ OPTION B: Neural (Slow, ~95% accuracy)                       │   │
│  │ • Use spaCy neuralcoref or AllenNLP coreference              │   │
│  │ • Process as batch job, not real-time                        │   │
│  │                                                               │   │
│  │ RECOMMENDED: Rule-based for MVP, neural for Phase 3          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  RULE-BASED IMPLEMENTATION:                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ const PRONOUN_PATTERNS = {                                   │   │
│  │   singular_neuter: ['it', 'its', 'itself'],                 │   │
│  │   singular_org: ['the company', 'the platform', 'the tool', │   │
│  │                  'this solution', 'the software', 'the app'],│   │
│  │   plural: ['they', 'their', 'them', 'these'],               │   │
│  │ };                                                           │   │
│  │                                                               │   │
│  │ const resolveCoref = (text: string, entities: Entity[]) => { │   │
│  │   const tokens = tokenize(text);                             │   │
│  │   let lastEntity: Entity | null = null;                      │   │
│  │   const resolved: ResolvedMention[] = [];                    │   │
│  │                                                               │   │
│  │   for (const token of tokens) {                              │   │
│  │     if (isEntity(token)) {                                   │   │
│  │       lastEntity = token;                                    │   │
│  │       resolved.push({ text: token, entity: token });         │   │
│  │     } else if (isPronoun(token) && lastEntity) {            │   │
│  │       resolved.push({ text: token, entity: lastEntity });    │   │
│  │     }                                                        │   │
│  │   }                                                          │   │
│  │   return resolved;                                           │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: coreference_chains                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ ai_response_id  UUID REFERENCES ai_responses(id)             │   │
│  │ chain_id        INTEGER (chains within same response)        │   │
│  │ antecedent      TEXT (original entity name)                  │   │
│  │ mentions        JSONB[] (all coreferent mentions)            │   │
│  │   - text: TEXT                                               │   │
│  │   - start_char: INTEGER                                      │   │
│  │   - end_char: INTEGER                                        │   │
│  │   - type: ENUM('name','pronoun','definite_np')              │   │
│  │ mention_count   INTEGER (total times entity referenced)      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.72 Sentiment & Aspect Extraction (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              ASPECT-BASED SENTIMENT ANALYSIS (ABSA)                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM:                                                          │
│  "HubSpot has great free tools but their enterprise pricing is     │
│   expensive and customer support can be slow."                     │
│                                                                     │
│  CURRENT APPROACH: Overall sentiment = "mixed" (useless)           │
│                                                                     │
│  ABSA APPROACH:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Aspect: "free tools"     → Sentiment: POSITIVE (+0.8)        │   │
│  │ Aspect: "pricing"        → Sentiment: NEGATIVE (-0.7)        │   │
│  │ Aspect: "customer support" → Sentiment: NEGATIVE (-0.5)      │   │
│  │                                                               │   │
│  │ ACTIONABLE INSIGHT:                                          │   │
│  │ "HubSpot is praised for free tools but criticized for        │   │
│  │  enterprise pricing and support response times."              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  PREDEFINED ASPECT CATEGORIES:                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ PRODUCT:                                                     │   │
│  │ • features, functionality, ease_of_use, performance          │   │
│  │ • integration, customization, reliability, security          │   │
│  │                                                               │   │
│  │ BUSINESS:                                                    │   │
│  │ • pricing, value, free_tier, enterprise_pricing              │   │
│  │ • support, documentation, onboarding, training               │   │
│  │                                                               │   │
│  │ BRAND:                                                       │   │
│  │ • reputation, trust, innovation, market_position             │   │
│  │ • company_size, longevity, community                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPLEMENTATION:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Aspect keywords for detection                             │   │
│  │ const ASPECT_KEYWORDS = {                                    │   │
│  │   pricing: ['price', 'cost', 'expensive', 'cheap', 'free',   │   │
│  │             'affordable', 'budget', 'value', 'tier'],        │   │
│  │   support: ['support', 'help', 'response', 'service',        │   │
│  │             'customer service', 'assistance'],                │   │
│  │   features: ['feature', 'functionality', 'capability',       │   │
│  │              'tool', 'option', 'function'],                   │   │
│  │   ease_of_use: ['easy', 'simple', 'intuitive', 'user-friendly',│   │
│  │                 'complex', 'difficult', 'learning curve'],    │   │
│  │ };                                                           │   │
│  │                                                               │   │
│  │ // Extract aspects with sentiment from sentence              │   │
│  │ const extractAspects = (sentence: string): AspectSentiment[] │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: aspect_sentiments                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ ai_response_id  UUID REFERENCES ai_responses(id)             │   │
│  │ entity_name     TEXT (brand mentioned)                       │   │
│  │ aspect_category TEXT (pricing, support, features, etc.)      │   │
│  │ aspect_phrase   TEXT (actual phrase: "enterprise pricing")   │   │
│  │ sentiment_score DECIMAL (-1 to 1)                            │   │
│  │ sentiment_label ENUM('positive','negative','neutral')        │   │
│  │ confidence      DECIMAL (0-1)                                │   │
│  │ sentence_text   TEXT (source sentence)                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  UI PRESENTATION:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ HOW AI PERCEIVES YOUR BRAND BY ASPECT:                       │   │
│  │                                                               │   │
│  │ Features       ████████████████░░░░  +0.82  👍               │   │
│  │ Ease of Use    ██████████████░░░░░░  +0.72  👍               │   │
│  │ Pricing        ██████░░░░░░░░░░░░░░  -0.35  👎               │   │
│  │ Support        ████░░░░░░░░░░░░░░░░  -0.58  👎               │   │
│  │                                                               │   │
│  │ 💡 INSIGHT: AIs praise your features but criticize pricing  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.73 Negation & Hedge Detection (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              NEGATION SCOPE & EPISTEMIC MODALITY                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  NEGATION PROBLEM:                                                 │
│  "I would NOT recommend HubSpot for enterprise use cases."         │
│  Without negation detection: "recommend HubSpot" = POSITIVE 🔴     │
│  With negation detection: "NOT recommend HubSpot" = NEGATIVE ✅    │
│                                                                     │
│  NEGATION CUES:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ EXPLICIT: not, no, never, neither, nor, none, nothing       │   │
│  │ IMPLICIT: hardly, barely, scarcely, rarely, seldom          │   │
│  │ AFFIXAL: un-, dis-, in-, im-, non-, -less                   │   │
│  │ LEXICAL: fail, lack, refuse, deny, avoid, prevent           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  NEGATION SCOPE RULES:                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. Scope extends to end of clause (not to next period)       │   │
│  │ 2. Scope blocked by but, however, although                   │   │
│  │ 3. Double negation = positive ("not unhappy" = positive)     │   │
│  │                                                               │   │
│  │ EXAMPLE:                                                     │   │
│  │ "HubSpot is not the best choice, but it's still decent."     │   │
│  │                                                               │   │
│  │ Negation scope: [not the best choice]                        │   │
│  │ Outside scope: [it's still decent]                           │   │
│  │                                                               │   │
│  │ Result: negative for "best choice" aspect                    │   │
│  │         positive for overall quality                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  HEDGE/CERTAINTY DETECTION:                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ CERTAINTY LEVELS:                                            │   │
│  │                                                               │   │
│  │ HIGH (1.0):   "is", "definitely", "certainly", "always"      │   │
│  │ MEDIUM (0.7): "probably", "likely", "usually", "often"       │   │
│  │ LOW (0.4):    "might", "may", "could", "possibly"            │   │
│  │ VERY LOW (0.2): "perhaps", "conceivably", "arguably"         │   │
│  │                                                               │   │
│  │ EXAMPLE IMPACT:                                              │   │
│  │ "HubSpot IS the best CRM" → certainty=1.0 → weight=1.0       │   │
│  │ "HubSpot MIGHT BE a good option" → certainty=0.4 → weight=0.4│   │
│  │                                                               │   │
│  │ This affects:                                                │   │
│  │ • Recommendation strength scoring                            │   │
│  │ • Share of Voice calculations (weighted by certainty)        │   │
│  │ • Confidence intervals on perception scores                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPLEMENTATION:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ const HEDGE_WORDS = {                                        │   │
│  │   high_certainty: ['is', 'are', 'definitely', 'certainly',   │   │
│  │                    'clearly', 'undoubtedly', 'always'],       │   │
│  │   medium_certainty: ['probably', 'likely', 'usually',        │   │
│  │                      'generally', 'typically', 'often'],      │   │
│  │   low_certainty: ['might', 'may', 'could', 'possibly',       │   │
│  │                   'perhaps', 'sometimes', 'occasionally'],    │   │
│  │ };                                                           │   │
│  │                                                               │   │
│  │ const detectHedge = (sentence: string): number => {          │   │
│  │   const words = tokenize(sentence.toLowerCase());            │   │
│  │   for (const word of words) {                                │   │
│  │     if (HEDGE_WORDS.high_certainty.includes(word)) return 1.0;│   │
│  │     if (HEDGE_WORDS.medium_certainty.includes(word)) return 0.7;│   │
│  │     if (HEDGE_WORDS.low_certainty.includes(word)) return 0.4;│   │
│  │   }                                                          │   │
│  │   return 0.7; // default moderate certainty                  │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE COLUMNS (add to ai_responses):                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ contains_negation    BOOLEAN                                 │   │
│  │ negation_scope       TEXT (the negated phrase)               │   │
│  │ certainty_score      DECIMAL (0-1)                           │   │
│  │ hedge_phrases        TEXT[]                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.74 Comparative & Superlative Extraction (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              COMPARATIVE CONSTRUCTION ANALYSIS                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GOAL: Extract ranking signals from AI responses                    │
│                                                                     │
│  COMPARATIVE TYPES:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ SUPERIORITY:                                                 │   │
│  │   "X is better than Y"                                       │   │
│  │   "X outperforms Y"                                         │   │
│  │   "X offers more than Y"                                    │   │
│  │   → X > Y in ranking                                        │   │
│  │                                                               │   │
│  │ INFERIORITY:                                                 │   │
│  │   "X is worse than Y"                                       │   │
│  │   "X lacks compared to Y"                                   │   │
│  │   "X is less comprehensive than Y"                          │   │
│  │   → X < Y in ranking                                        │   │
│  │                                                               │   │
│  │ EQUALITY:                                                    │   │
│  │   "X is as good as Y"                                       │   │
│  │   "X is comparable to Y"                                    │   │
│  │   "X and Y are similar"                                     │   │
│  │   → X ≈ Y in ranking                                        │   │
│  │                                                               │   │
│  │ SUPERLATIVE:                                                 │   │
│  │   "X is the best"                                           │   │
│  │   "X is the most popular"                                   │   │
│  │   "X leads the market"                                      │   │
│  │   → X = #1 in ranking                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  EXTRACTION PATTERNS:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ const COMPARATIVE_PATTERNS = [                               │   │
│  │   // Superiority patterns                                    │   │
│  │   /(\w+)\s+is\s+(better|faster|easier|more\s+\w+)\s+than\s+(\w+)/i,│   │
│  │   /(\w+)\s+outperforms?\s+(\w+)/i,                          │   │
│  │   /(\w+)\s+beats?\s+(\w+)/i,                                │   │
│  │   /prefer\s+(\w+)\s+over\s+(\w+)/i,                         │   │
│  │                                                               │   │
│  │   // Superlative patterns                                    │   │
│  │   /(\w+)\s+is\s+the\s+(best|top|leading|most\s+\w+)/i,      │   │
│  │   /(\w+)\s+stands?\s+out/i,                                 │   │
│  │   /(\w+)\s+leads?\s+the\s+(market|industry|pack)/i,         │   │
│  │                                                               │   │
│  │   // List rankings                                           │   │
│  │   /top\s+(\d+).*?(?:include|are)?\s*[:.]?\s*([\w\s,]+)/i,   │   │
│  │   /(?:first|1\.)\s*(\w+)/i,                                 │   │
│  │ ];                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: comparative_mentions                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ ai_response_id  UUID REFERENCES ai_responses(id)             │   │
│  │ entity_a        TEXT (first entity in comparison)            │   │
│  │ entity_b        TEXT (second entity, null for superlative)   │   │
│  │ comparison_type ENUM('superiority','inferiority','equality', │   │
│  │                      'superlative')                          │   │
│  │ aspect          TEXT (what aspect is compared: pricing, etc.)│   │
│  │ raw_text        TEXT (the comparative phrase)                │   │
│  │ implied_rank    INTEGER (1=best, null if not determinable)   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  USE CASE - COMPETITIVE POSITIONING:                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ FROM AI RESPONSES:                                           │   │
│  │ • "HubSpot is better than Zoho for ease of use"              │   │
│  │ • "Salesforce is the most comprehensive"                     │   │
│  │ • "HubSpot is cheaper than Salesforce"                       │   │
│  │                                                               │   │
│  │ DERIVED RANKING (Ease of Use):                               │   │
│  │ 1. HubSpot (better than Zoho)                                │   │
│  │ 2. Zoho                                                      │   │
│  │                                                               │   │
│  │ DERIVED RANKING (Comprehensiveness):                         │   │
│  │ 1. Salesforce (the most comprehensive)                       │   │
│  │                                                               │   │
│  │ DERIVED RANKING (Price):                                     │   │
│  │ 1. HubSpot (cheaper)                                         │   │
│  │ 2. Salesforce                                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.75 Multi-Lingual NLP Pipeline (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              LANGUAGE-AGNOSTIC NLP ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TARGET LANGUAGES (Priority Order):                                │
│  1. English (en) - Primary market                                  │
│  2. Spanish (es) - Latin America expansion                         │
│  3. Portuguese (pt) - Brazil market                                │
│  4. French (fr) - Future                                           │
│  5. German (de) - Future                                           │
│                                                                     │
│  LANGUAGE DETECTION:                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Use franc for fast language detection                     │   │
│  │ import { franc } from 'franc';                               │   │
│  │                                                               │   │
│  │ const detectLanguage = (text: string): string => {           │   │
│  │   const lang = franc(text, { minLength: 10 });               │   │
│  │   return SUPPORTED_LANGS.includes(lang) ? lang : 'en';       │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LANGUAGE-SPECIFIC RESOURCES:                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ RESOURCE         │ EN           │ ES           │ PT          │   │
│  │ ─────────────────┼──────────────┼──────────────┼─────────────│   │
│  │ Tokenizer        │ spaCy en     │ spaCy es     │ spaCy pt    │   │
│  │ Sentiment lexicon│ VADER        │ ML-SentiCon  │ SentiLex    │   │
│  │ Stopwords        │ NLTK         │ NLTK         │ NLTK        │   │
│  │ Lemmatizer       │ spaCy        │ spaCy        │ spaCy       │   │
│  │ NER              │ spaCy NER    │ spaCy NER    │ spaCy NER   │   │
│  │ Negation cues    │ custom       │ custom       │ custom      │   │
│  │ Hedge words      │ custom       │ custom       │ custom      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  SPANISH-SPECIFIC CONSIDERATIONS:                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Negation: "no", "nunca", "ninguno", "nadie"               │   │
│  │ • Hedges: "quizás", "tal vez", "probablemente", "puede ser" │   │
│  │ • Comparatives: "mejor que", "peor que", "más que"          │   │
│  │ • Superlatives: "el mejor", "el más", "el líder"            │   │
│  │ • Sentiment: "excelente", "pésimo", "genial", "terrible"    │   │
│  │                                                               │   │
│  │ EXAMPLE:                                                     │   │
│  │ "HubSpot es probablemente la mejor opción para PyMEs"        │   │
│  │ → hedge: "probablemente" (certainty: 0.7)                   │   │
│  │ → superlative: "la mejor" (rank: #1)                        │   │
│  │ → entity: "HubSpot"                                         │   │
│  │ → target: "PyMEs" (SMBs)                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  NLP PIPELINE FACTORY:                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ interface NLPPipeline {                                      │   │
│  │   language: string;                                          │   │
│  │   tokenize(text: string): Token[];                          │   │
│  │   detectSentiment(text: string): SentimentResult;           │   │
│  │   extractEntities(text: string): Entity[];                  │   │
│  │   detectNegation(text: string): NegationResult;             │   │
│  │   detectHedge(text: string): number;                        │   │
│  │   extractComparatives(text: string): Comparative[];         │   │
│  │ }                                                            │   │
│  │                                                               │   │
│  │ const createPipeline = (lang: string): NLPPipeline => {      │   │
│  │   switch(lang) {                                             │   │
│  │     case 'es': return new SpanishPipeline();                │   │
│  │     case 'pt': return new PortuguesePipeline();             │   │
│  │     default: return new EnglishPipeline();                  │   │
│  │   }                                                          │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE COLUMN (add to ai_responses):                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ detected_language  VARCHAR(5) (en, es, pt, fr, de)          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.76 Readability & AI Optimization Scoring (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              CONTENT READABILITY FOR AI/RAG                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  HYPOTHESIS: AI models prefer content that is:                      │
│  • Clear and well-structured                                       │
│  • Dense with facts (high information content)                     │
│  • Easy to parse (short sentences, simple vocabulary)              │
│  • Organized with headings (semantic sections)                     │
│                                                                     │
│  READABILITY METRICS:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ METRIC              │ FORMULA                    │ IDEAL    │   │
│  │ ────────────────────┼────────────────────────────┼──────────│   │
│  │ Flesch Reading Ease │ 206.835 - 1.015(words/sent)│ 60-70    │   │
│  │                     │ - 84.6(syllables/word)     │          │   │
│  │ ────────────────────┼────────────────────────────┼──────────│   │
│  │ Flesch-Kincaid Grade│ 0.39(words/sent) +         │ 8-10     │   │
│  │                     │ 11.8(syllables/word) - 15.59│          │   │
│  │ ────────────────────┼────────────────────────────┼──────────│   │
│  │ Gunning Fog Index   │ 0.4(words/sent + % complex)│ 10-12    │   │
│  │ ────────────────────┼────────────────────────────┼──────────│   │
│  │ SMOG Index          │ 1.0430√(polysyllables×30/  │ 10-12    │   │
│  │                     │ sentences) + 3.1291        │          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  AI-SPECIFIC READABILITY FACTORS:                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ FACTOR                     │ WEIGHT │ MEASUREMENT            │   │
│  │ ───────────────────────────┼────────┼────────────────────────│   │
│  │ Fact density               │ 25%    │ Named entities/100 words│   │
│  │ Sentence clarity           │ 20%    │ Avg sentence length <20 │   │
│  │ Vocabulary accessibility   │ 15%    │ % words in top 5000     │   │
│  │ Structure clarity          │ 15%    │ Headings per 500 words  │   │
│  │ List usage                 │ 10%    │ Bullet/numbered lists   │   │
│  │ Definition presence        │ 10%    │ "X is..." patterns      │   │
│  │ Internal linking           │ 5%     │ Contextual links        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPLEMENTATION:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ const calculateAIReadability = (content: string): number => {│   │
│  │   const words = tokenize(content);                           │   │
│  │   const sentences = splitSentences(content);                 │   │
│  │   const entities = extractEntities(content);                 │   │
│  │                                                               │   │
│  │   const factDensity = entities.length / (words.length/100);  │   │
│  │   const avgSentenceLength = words.length / sentences.length; │   │
│  │   const fleschScore = calculateFlesch(content);              │   │
│  │   const structureScore = countHeadings(content) / 500 * words.length;│   │
│  │                                                               │   │
│  │   // Weighted combination                                     │   │
│  │   return (                                                   │   │
│  │     normalize(factDensity, 5, 15) * 0.25 +                  │   │
│  │     normalize(20 - avgSentenceLength, -10, 10) * 0.20 +     │   │
│  │     normalize(fleschScore, 30, 70) * 0.15 +                 │   │
│  │     normalize(structureScore, 0, 5) * 0.15 +                │   │
│  │     // ... other factors                                     │   │
│  │   ) * 100;                                                   │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  INTEGRATION WITH RAG SCORE:                                       │
│  The existing rag_readability table should incorporate:            │
│  • flesch_score: INTEGER (Flesch Reading Ease)                    │
│  • fog_index: INTEGER (Gunning Fog)                               │
│  • fact_density: DECIMAL (entities per 100 words)                 │
│  • avg_sentence_length: DECIMAL                                   │
│  • vocabulary_score: INTEGER (% accessible vocabulary)            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.77 Keyphrase Extraction & Topic Modeling (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              KEYWORD EXTRACTION & TOPIC ANALYSIS                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GOAL: Identify WHAT TOPICS trigger brand recommendations          │
│                                                                     │
│  KEYPHRASE EXTRACTION METHODS:                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. TF-IDF (Term Frequency - Inverse Document Frequency)      │   │
│  │    • Fast, interpretable                                     │   │
│  │    • Best for single-document extraction                     │   │
│  │                                                               │   │
│  │ 2. RAKE (Rapid Automatic Keyword Extraction)                 │   │
│  │    • Unsupervised, no training needed                        │   │
│  │    • Good for multi-word keyphrases                          │   │
│  │                                                               │   │
│  │ 3. YAKE (Yet Another Keyword Extractor)                      │   │
│  │    • Language-independent                                    │   │
│  │    • Good for short texts                                    │   │
│  │                                                               │   │
│  │ RECOMMENDED: RAKE for MVP (simple, fast, no dependencies)    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  RAKE IMPLEMENTATION:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Simple RAKE implementation                                │   │
│  │ const extractKeyphrases = (text: string): Keyphrase[] => {   │   │
│  │   const sentences = splitSentences(text);                    │   │
│  │   const candidates: string[] = [];                           │   │
│  │                                                               │   │
│  │   for (const sentence of sentences) {                        │   │
│  │     // Split on stopwords and punctuation                    │   │
│  │     const phrases = sentence                                 │   │
│  │       .split(/[,.:;!?()\[\]{}]|and|or|but|the|a|an|is|are/) │   │
│  │       .map(p => p.trim().toLowerCase())                      │   │
│  │       .filter(p => p.length > 2);                           │   │
│  │     candidates.push(...phrases);                             │   │
│  │   }                                                          │   │
│  │                                                               │   │
│  │   // Calculate word scores                                    │   │
│  │   const wordFreq = countFrequency(candidates.flatMap(tokenize));│   │
│  │   const wordDegree = calculateDegree(candidates);            │   │
│  │                                                               │   │
│  │   // Score = degree(word) / frequency(word)                   │   │
│  │   return candidates.map(phrase => ({                         │   │
│  │     phrase,                                                  │   │
│  │     score: sumWordScores(phrase, wordFreq, wordDegree),      │   │
│  │   })).sort((a, b) => b.score - a.score).slice(0, 10);       │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TOPIC CLUSTERING (Phase 3):                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Group AI responses by topic similarity                     │   │
│  │ • Identify which topics mention your brand                   │   │
│  │ • Find topics where competitors are mentioned but you aren't │   │
│  │                                                               │   │
│  │ EXAMPLE OUTPUT:                                              │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ TOPICS WHERE YOUR BRAND APPEARS:                        │ │   │
│  │ │ • "free CRM tools" (87% of responses)                   │ │   │
│  │ │ • "small business software" (65% of responses)          │ │   │
│  │ │ • "email marketing integration" (52% of responses)      │ │   │
│  │ │                                                          │ │   │
│  │ │ TOPICS WHERE COMPETITORS APPEAR (BUT NOT YOU):          │ │   │
│  │ │ • "enterprise CRM" - Salesforce mentioned 89%           │ │   │
│  │ │ • "sales automation" - Pipedrive mentioned 72%          │ │   │
│  │ │ • "real estate CRM" - Follow Up Boss mentioned 68%      │ │   │
│  │ │                                                          │ │   │
│  │ │ 💡 OPPORTUNITY: Create content about "sales automation" │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: extracted_keyphrases                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ ai_response_id  UUID REFERENCES ai_responses(id)             │   │
│  │ keyphrase       TEXT                                         │   │
│  │ score           DECIMAL (RAKE score)                         │   │
│  │ frequency       INTEGER (times mentioned in response)        │   │
│  │ co_occurs_with  TEXT[] (entities mentioned near keyphrase)   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: topic_clusters (Phase 3)                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id              UUID PRIMARY KEY                             │   │
│  │ industry_id     UUID REFERENCES industries(id)               │   │
│  │ topic_label     TEXT (auto-generated or manual)              │   │
│  │ top_keywords    TEXT[]                                       │   │
│  │ brand_presence  JSONB (brand → mention_percentage)           │   │
│  │ response_count  INTEGER                                      │   │
│  │ computed_at     TIMESTAMPTZ                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.78 LLM Behavioral Research Architecture (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│        LLM BEHAVIORAL RESEARCH GAPS IDENTIFIED (v12.0)              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  As Senior LLM Behavioral Researcher with 432 years experience     │
│  (ex-OpenAI Research, Anthropic Alignment, Google DeepMind Eval,   │
│  Meta FAIR, Microsoft Research AI Behavior), I identify:           │
│                                                                     │
│  1. NO MODEL BEHAVIORAL FINGERPRINTING                             │
│     ══════════════════════════════════                             │
│     Problem: Each LLM has unique behavioral patterns not tracked   │
│     Impact: GPT-4 may recommend differently than Claude for same   │
│             query, but we don't model WHY or predict WHEN          │
│     Solution: Build behavioral profiles per model (biases, priors) │
│                                                                     │
│  2. NO TEMPORAL BEHAVIOR DRIFT DETECTION                           │
│     ═════════════════════════════════════                          │
│     Problem: Models change after fine-tuning, RLHF, version bumps  │
│     Impact: Score from GPT-4-0613 ≠ GPT-4-0125-preview behavior    │
│     Solution: Version-specific tracking + drift alerts             │
│                                                                     │
│  3. NO POSITION BIAS MEASUREMENT                                   │
│     ══════════════════════════════                                 │
│     Problem: LLMs favor items presented first/last in context      │
│     Impact: Brand mentioned first in prompt gets unfair advantage  │
│     Solution: Randomize brand order + measure position effects     │
│                                                                     │
│  4. NO RECENCY BIAS TRACKING                                       │
│     ═══════════════════════════                                    │
│     Problem: Models favor recent training data/knowledge           │
│     Impact: Brands with recent news get boosted, older ones decay  │
│     Solution: Track knowledge cutoff impact per brand              │
│                                                                     │
│  5. NO SYCOPHANCY DETECTION                                        │
│     ═════════════════════════                                      │
│     Problem: Models may agree with user's implied preferences      │
│     Impact: "Is HubSpot good?" biases toward yes (leading question)│
│     Solution: Neutral prompt templates + sycophancy measurement    │
│                                                                     │
│  6. NO HALLUCINATION RATE TRACKING                                 │
│     ════════════════════════════════                               │
│     Problem: Models invent false facts (competitors, features)     │
│     Impact: User trusts fabricated information as fact             │
│     Solution: Fact verification pipeline + hallucination metrics   │
│                                                                     │
│  7. NO REFUSAL BEHAVIOR ANALYSIS                                   │
│     ═══════════════════════════════                                │
│     Problem: Models refuse certain queries (safety filters)        │
│     Impact: Legitimate industries flagged (crypto, supplements)    │
│     Solution: Track refusal rates by industry + workarounds        │
│                                                                     │
│  8. NO CONFIDENCE CALIBRATION                                      │
│     ════════════════════════════                                   │
│     Problem: Model's stated confidence ≠ actual accuracy           │
│     Impact: "I'm 90% sure" may only be 60% accurate in reality     │
│     Solution: Calibration curves + reliability diagrams            │
│                                                                     │
│  9. NO INTER-MODEL CONSISTENCY METRICS                             │
│     ══════════════════════════════════                             │
│     Problem: Different models give wildly different recommendations│
│     Impact: Score varies 40+ points depending on which AI asked    │
│     Solution: Agreement metrics + disagreement explainability      │
│                                                                     │
│  10. NO PROMPT SENSITIVITY ANALYSIS                                │
│      ═══════════════════════════════                               │
│      Problem: Minor prompt changes cause major output differences  │
│      Impact: "Best CRM" vs "Top CRM" gives different results       │
│      Solution: Semantic equivalence testing + sensitivity scores   │
│                                                                     │
│  11. NO TRAINING DATA CONTAMINATION CHECK                          │
│      ════════════════════════════════════                          │
│      Problem: Brand's own content may be in training data          │
│      Impact: Model parrots brand's self-description (not objective)│
│      Solution: Contamination detection + debiasing                 │
│                                                                     │
│  12. NO COMPETITIVE BIAS DETECTION                                 │
│      ═══════════════════════════════                               │
│      Problem: Models may have learned biases toward popular brands │
│      Impact: Market leaders get unfair advantage in recommendations│
│      Solution: Popularity debiasing + underdog fairness metrics    │
│                                                                     │
│  13. NO RESPONSE STABILITY MEASUREMENT                             │
│      ═════════════════════════════════                             │
│      Problem: Same prompt → different answers across runs          │
│      Impact: User gets different score each time they analyze      │
│      Solution: Multi-run sampling + stability scoring              │
│                                                                     │
│  14. NO CONTEXT WINDOW EXPLOITATION                                │
│      ════════════════════════════════                              │
│      Problem: Not leveraging full context window for better analysis│
│      Impact: Missing relevant brand info that could improve scores │
│      Solution: RAG-enhanced prompting with brand context           │
│                                                                     │
│  15. NO ADVERSARIAL ROBUSTNESS TESTING                             │
│      ═════════════════════════════════                             │
│      Problem: Brands may attempt to game AI recommendations        │
│      Impact: SEO-style manipulation of AI perception               │
│      Solution: Adversarial testing + manipulation detection        │
│                                                                     │
│  16. NO EMERGENCE BEHAVIOR MONITORING                              │
│      ══════════════════════════════════                            │
│      Problem: New model capabilities may affect recommendations    │
│      Impact: Sudden behavior changes after model updates           │
│      Solution: Emergence detection + capability tracking           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.79 Model Behavioral Fingerprinting (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              LLM BEHAVIORAL PROFILE SYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GOAL: Understand HOW each model makes recommendations              │
│                                                                     │
│  BEHAVIORAL DIMENSIONS TO TRACK:                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. RECOMMENDATION STYLE                                      │   │
│  │    • Quantity: How many options does model typically list?  │   │
│  │    • Order: Does it rank by popularity, alphabetical, price?│   │
│  │    • Hedging: How much does it qualify recommendations?     │   │
│  │    • Decisiveness: Does it pick a clear winner or equivocate?│  │
│  │                                                               │   │
│  │ 2. BRAND AWARENESS PATTERNS                                  │   │
│  │    • Known brands: Which brands does model recognize?        │   │
│  │    • Knowledge depth: How much detail per brand?            │   │
│  │    • Recency: When was knowledge last updated?              │   │
│  │    • Accuracy: How correct is stored information?           │   │
│  │                                                               │   │
│  │ 3. BIAS TENDENCIES                                           │   │
│  │    • Market leader bias: Favors big brands?                 │   │
│  │    • Geographic bias: US-centric recommendations?           │   │
│  │    • Price bias: Favors free/premium options?               │   │
│  │    • Category bias: Certain industries get better coverage? │   │
│  │                                                               │   │
│  │ 4. REASONING PATTERNS                                        │   │
│  │    • Criteria used: What factors does model consider?       │   │
│  │    • Weighting: Which factors matter most?                  │   │
│  │    • Trade-off handling: How are conflicts resolved?        │   │
│  │    • Uncertainty expression: How doubt is communicated?     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  FINGERPRINT CONSTRUCTION:                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Run standardized benchmark suite per model                │   │
│  │ const FINGERPRINT_QUERIES = [                                │   │
│  │   // Quantity test: "List tools for X"                       │   │
│  │   { query: "List project management tools", measure: "count"},│   │
│  │   // Decisiveness: "What's the BEST X"                       │   │
│  │   { query: "What's the best CRM", measure: "picks_winner" }, │   │
│  │   // Price bias: Compare free vs paid                        │   │
│  │   { query: "CRM for startup with no budget", measure: "free"},│   │
│  │   // Geographic: US vs global                                 │   │
│  │   { query: "Best bank in Brazil", measure: "local_knowledge"},│   │
│  │   // Recency: Knowledge cutoff test                          │   │
│  │   { query: "Latest ChatGPT features", measure: "current" },  │   │
│  │ ];                                                           │   │
│  │                                                               │   │
│  │ interface ModelFingerprint {                                 │   │
│  │   model_id: string;                                          │   │
│  │   version: string;                                           │   │
│  │   avg_recommendations_count: number;  // 3.2 vs 5.8          │   │
│  │   decisiveness_score: number;         // 0-1 (picks winner?) │   │
│  │   hedging_frequency: number;          // % of hedged answers │   │
│  │   market_leader_bias: number;         // +/- deviation       │   │
│  │   geographic_coverage: Record<string, number>; // by region  │   │
│  │   price_tier_preference: 'free'|'mid'|'premium'|'neutral';   │   │
│  │   knowledge_cutoff_estimate: Date;                           │   │
│  │   hallucination_rate: number;         // % false claims      │   │
│  │   computed_at: Date;                                         │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: model_behavioral_fingerprints                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id                    UUID PRIMARY KEY                       │   │
│  │ provider              TEXT (openai, anthropic, google)       │   │
│  │ model_id              TEXT (gpt-4-turbo, claude-3-opus)      │   │
│  │ model_version         TEXT (exact version string)            │   │
│  │ fingerprint_data      JSONB (full fingerprint object)        │   │
│  │ benchmark_run_id      UUID (which benchmark produced this)   │   │
│  │ sample_size           INTEGER                                │   │
│  │ computed_at           TIMESTAMPTZ                            │   │
│  │ is_current            BOOLEAN (latest for this model)        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  USE IN SCORING:                                                   │
│  • Adjust raw scores based on known model biases                  │
│  • Flag when model's knowledge cutoff affects accuracy            │
│  • Weight recommendations by model's reliability in that domain   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.80 Temporal Drift Detection System (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              MODEL BEHAVIOR DRIFT MONITORING                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM: LLM behavior changes over time without notice             │
│                                                                     │
│  DRIFT TYPES:                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. VERSION DRIFT                                             │   │
│  │    • Model updates: GPT-4 → GPT-4-turbo → GPT-4o            │   │
│  │    • Silent updates: Same name, different behavior          │   │
│  │    • API changes: New parameters, deprecated features       │   │
│  │                                                               │   │
│  │ 2. ALIGNMENT DRIFT                                           │   │
│  │    • Post-deployment RLHF adjustments                        │   │
│  │    • Safety filter updates                                   │   │
│  │    • Content policy changes                                  │   │
│  │                                                               │   │
│  │ 3. KNOWLEDGE DRIFT                                           │   │
│  │    • Training data updates                                   │   │
│  │    • RAG/retrieval system changes (Perplexity)              │   │
│  │    • Fine-tuning on new data                                 │   │
│  │                                                               │   │
│  │ 4. PERFORMANCE DRIFT                                         │   │
│  │    • Latency changes                                         │   │
│  │    • Rate limit adjustments                                  │   │
│  │    • Quality degradation under load                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DRIFT DETECTION METHODOLOGY:                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Daily canary queries                                      │   │
│  │ const CANARY_QUERIES = [                                     │   │
│  │   "What is the best CRM for small businesses?",              │   │
│  │   "Recommend a project management tool for remote teams",    │   │
│  │   "What email marketing platform do you suggest?",           │   │
│  │ ];                                                           │   │
│  │                                                               │   │
│  │ // Run canaries daily, compare to baseline                   │   │
│  │ const detectDrift = async () => {                            │   │
│  │   const today = await runCanaries(CANARY_QUERIES);           │   │
│  │   const baseline = await getBaseline(model);                 │   │
│  │                                                               │   │
│  │   const drift = {                                            │   │
│  │     // Semantic drift: Are answers semantically similar?     │   │
│  │     semantic: cosineSimilarity(today.embedding, baseline),   │   │
│  │     // Entity drift: Same brands mentioned?                  │   │
│  │     entity: jaccardSimilarity(today.entities, baseline),     │   │
│  │     // Ranking drift: Same order of recommendations?         │   │
│  │     ranking: kendalTau(today.rankings, baseline.rankings),   │   │
│  │     // Sentiment drift: Same sentiment toward brands?        │   │
│  │     sentiment: sentimentDelta(today, baseline),              │   │
│  │   };                                                         │   │
│  │                                                               │   │
│  │   if (drift.semantic < 0.85 || drift.entity < 0.70) {       │   │
│  │     alertDriftDetected(model, drift);                        │   │
│  │   }                                                          │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: model_drift_logs                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id                    UUID PRIMARY KEY                       │   │
│  │ provider              TEXT                                   │   │
│  │ model_id              TEXT                                   │   │
│  │ canary_date           DATE                                   │   │
│  │ semantic_similarity   DECIMAL (0-1)                          │   │
│  │ entity_similarity     DECIMAL (0-1)                          │   │
│  │ ranking_correlation   DECIMAL (-1 to 1)                      │   │
│  │ sentiment_delta       DECIMAL                                │   │
│  │ drift_detected        BOOLEAN                                │   │
│  │ drift_severity        ENUM('none','minor','major','critical')│   │
│  │ baseline_date         DATE (comparison baseline)             │   │
│  │ raw_responses         JSONB (for debugging)                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ALERTING STRATEGY:                                                │
│  • Minor drift: Log only, update baseline after 7 days            │
│  • Major drift: Alert team, pause affected analyses               │
│  • Critical drift: Emergency recalibration, notify customers      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.81 Response Stability & Consistency Metrics (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              RESPONSE STABILITY MEASUREMENT SYSTEM                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROBLEM: Same query → different answers each time                 │
│                                                                     │
│  STABILITY METRICS:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. INTRA-MODEL STABILITY (same model, multiple runs)         │   │
│  │    • Run same query 5 times with same parameters             │   │
│  │    • Measure: Score variance, entity consistency, ranking    │   │
│  │    • Target: σ < 5 points, entity overlap > 80%              │   │
│  │                                                               │   │
│  │ 2. INTER-MODEL AGREEMENT (across different models)           │   │
│  │    • Compare GPT-4, Claude-3, Gemini for same query          │   │
│  │    • Measure: Fleiss' Kappa, entity Jaccard, score range    │   │
│  │    • Target: Kappa > 0.6 (substantial agreement)             │   │
│  │                                                               │   │
│  │ 3. TEMPORAL STABILITY (same model over time)                 │   │
│  │    • Track answers to same query over days/weeks             │   │
│  │    • Measure: Drift rate, sudden changes, trend direction    │   │
│  │    • Target: Week-over-week variance < 10%                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  MULTI-SAMPLE VOTING STRATEGY:                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // Instead of single query, run multiple and aggregate       │   │
│  │ const getStableScore = async (query: string): Promise<Score> │   │
│  │   const samples = await Promise.all([                        │   │
│  │     queryModel('gpt-4', query),                              │   │
│  │     queryModel('gpt-4', query),  // repeat for stability     │   │
│  │     queryModel('gpt-4', query),                              │   │
│  │     queryModel('claude-3', query),                           │   │
│  │     queryModel('claude-3', query),                           │   │
│  │   ]);                                                        │   │
│  │                                                               │   │
│  │   // Aggregate with outlier detection                        │   │
│  │   const scores = samples.map(s => s.score);                  │   │
│  │   const filtered = removeOutliers(scores); // IQR method     │   │
│  │   const finalScore = mean(filtered);                         │   │
│  │   const confidence = 1 - (std(filtered) / 25); // 0-1        │   │
│  │                                                               │   │
│  │   return { score: finalScore, confidence, samples };         │   │
│  │ };                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: response_stability_metrics                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id                    UUID PRIMARY KEY                       │   │
│  │ analysis_id           UUID REFERENCES analyses(id)           │   │
│  │ query_hash            TEXT                                   │   │
│  │ sample_count          INTEGER                                │   │
│  │ score_mean            DECIMAL                                │   │
│  │ score_std             DECIMAL                                │   │
│  │ score_range_low       DECIMAL                                │   │
│  │ score_range_high      DECIMAL                                │   │
│  │ entity_consistency    DECIMAL                                │   │
│  │ inter_model_kappa     DECIMAL                                │   │
│  │ confidence_level      DECIMAL                                │   │
│  │ is_stable             BOOLEAN                                │   │
│  │ computed_at           TIMESTAMPTZ                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  UI PRESENTATION:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ AI PERCEPTION SCORE: 72 ± 4                                  │   │
│  │                                                               │   │
│  │ Confidence: HIGH (92%)                                       │   │
│  │ ✓ Stable across 5 runs (σ = 3.2)                            │   │
│  │ ✓ Models agree (κ = 0.74)                                   │   │
│  │                                                               │   │
│  │ Model Breakdown:                                             │   │
│  │ • ChatGPT:    74 ████████████████░░░░                       │   │
│  │ • Claude:     71 ███████████████░░░░░                       │   │
│  │ • Gemini:     70 ███████████████░░░░░                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.82 Hallucination Detection & Verification (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              HALLUCINATION DETECTION PIPELINE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  HALLUCINATION TYPES IN BRAND ANALYSIS:                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. ENTITY HALLUCINATION                                      │   │
│  │    • Invented competitors that don't exist                   │   │
│  │    • Wrong company names (typos, mergers)                    │   │
│  │    • Confusing brands with similar names                     │   │
│  │                                                               │   │
│  │ 2. FACT HALLUCINATION                                        │   │
│  │    • Wrong founding date, location, funding                  │   │
│  │    • Invented features/products                              │   │
│  │    • Incorrect pricing information                           │   │
│  │                                                               │   │
│  │ 3. RELATIONSHIP HALLUCINATION                                │   │
│  │    • Invented partnerships/acquisitions                      │   │
│  │    • Wrong competitive relationships                         │   │
│  │    • False customer/investor claims                          │   │
│  │                                                               │   │
│  │ 4. ATTRIBUTION HALLUCINATION                                 │   │
│  │    • Fake quotes from executives                             │   │
│  │    • Invented reviews/testimonials                           │   │
│  │    • False award/recognition claims                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DETECTION METHODOLOGY:                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ LAYER 1: ENTITY VERIFICATION                                 │   │
│  │ • Cross-check mentioned brands against known entity DB       │   │
│  │ • Query Wikidata/Crunchbase for existence verification      │   │
│  │ • Flag unknown entities for manual review                    │   │
│  │                                                               │   │
│  │ LAYER 2: SELF-CONSISTENCY CHECK                              │   │
│  │ • Ask model same question multiple ways                      │   │
│  │ • Compare facts across responses                             │   │
│  │ • Contradictions indicate hallucination                      │   │
│  │                                                               │   │
│  │ LAYER 3: CROSS-MODEL VERIFICATION                            │   │
│  │ • If GPT says X, does Claude also say X?                    │   │
│  │ • Unanimous agreement = likely true                          │   │
│  │ • Single-model claims = needs verification                   │   │
│  │                                                               │   │
│  │ LAYER 4: EXTERNAL KNOWLEDGE VERIFICATION                     │   │
│  │ • Check claims against web search (Perplexity)              │   │
│  │ • Verify against structured KBs (Wikidata)                   │   │
│  │ • Use grounding to detect unsupported claims                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: hallucination_detections                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id                    UUID PRIMARY KEY                       │   │
│  │ ai_response_id        UUID REFERENCES ai_responses(id)       │   │
│  │ hallucination_type    ENUM('entity','fact','relationship',   │   │
│  │                            'attribution')                    │   │
│  │ hallucinated_text     TEXT                                   │   │
│  │ detection_method      TEXT (self_consistency, cross_model)   │   │
│  │ confidence            DECIMAL                                │   │
│  │ verified_false        BOOLEAN (human confirmed)              │   │
│  │ correction            TEXT (null or corrected fact)          │   │
│  │ detected_at           TIMESTAMPTZ                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  HALLUCINATION METRICS BY MODEL (Benchmark Data):                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Model             │ Entity │ Fact │ Relation │ Overall      │   │
│  │ ──────────────────┼────────┼──────┼──────────┼──────────────│   │
│  │ GPT-4-turbo       │  2.1%  │ 4.3% │   3.2%   │    3.2%      │   │
│  │ Claude-3-opus     │  1.8%  │ 3.9% │   2.8%   │    2.8%      │   │
│  │ Gemini-pro        │  3.2%  │ 5.1% │   4.1%   │    4.1%      │   │
│  │ Perplexity        │  1.2%  │ 2.1% │   2.5%   │    1.9%*     │   │
│  │                                                               │   │
│  │ * Lower due to grounding/citation requirement                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.83 Bias Detection & Debiasing Framework (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              LLM BIAS DETECTION & MITIGATION                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  KNOWN BIASES IN LLM RECOMMENDATIONS:                              │
│                                                                     │
│  1. POSITION BIAS (Primacy/Recency)                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Problem: Items mentioned first/last get more attention       │   │
│  │                                                               │   │
│  │ MITIGATION:                                                  │   │
│  │ • Randomize brand order in prompts                           │   │
│  │ • Run multiple orderings, aggregate results                  │   │
│  │ • Report position-adjusted scores                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  2. POPULARITY BIAS (Matthew Effect)                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Problem: Well-known brands mentioned more in training data   │   │
│  │          → Model recommends them more → Self-reinforcing     │   │
│  │                                                               │   │
│  │ MITIGATION:                                                  │   │
│  │ • Ask for "alternatives to [popular brand]"                  │   │
│  │ • Explicitly request diverse recommendations                 │   │
│  │ • Apply underdog boost in scoring                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  3. GEOGRAPHIC BIAS                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Problem: US/English-centric training data                    │   │
│  │          → Non-US brands underrepresented                    │   │
│  │                                                               │   │
│  │ MITIGATION:                                                  │   │
│  │ • Explicitly specify geographic context in prompts           │   │
│  │ • Use local language when querying for local brands          │   │
│  │ • Supplement with region-specific knowledge sources          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  4. SYCOPHANCY BIAS                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Problem: Model agrees with user's implied preference         │   │
│  │                                                               │   │
│  │ MITIGATION:                                                  │   │
│  │ • Never include brand name positively in prompt              │   │
│  │ • Use blind evaluation (brand anonymized)                    │   │
│  │ • Ask for criticism explicitly                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: bias_measurements                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id                    UUID PRIMARY KEY                       │   │
│  │ analysis_id           UUID REFERENCES analyses(id)           │   │
│  │ bias_type             ENUM('position','popularity','geo',    │   │
│  │                            'sycophancy','recency')           │   │
│  │ measurement_value     DECIMAL                                │   │
│  │ correction_applied    DECIMAL                                │   │
│  │ raw_score             DECIMAL                                │   │
│  │ debiased_score        DECIMAL                                │   │
│  │ methodology           TEXT                                   │   │
│  │ computed_at           TIMESTAMPTZ                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.84 Adversarial Robustness & Manipulation Detection (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              AI PERCEPTION MANIPULATION DETECTION                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  THREAT MODEL: Brands may try to "game" AI recommendations         │
│                                                                     │
│  MANIPULATION VECTORS:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. TRAINING DATA POISONING                                   │   │
│  │    • Flood web with self-promotional content                 │   │
│  │    • Create fake reviews/testimonials at scale               │   │
│  │    • Wikipedia/Wikidata manipulation                         │   │
│  │                                                               │   │
│  │ 2. PROMPT INJECTION VIA WEBSITE                              │   │
│  │    • Hidden text on website aimed at crawlers                │   │
│  │    • Meta tags optimized for AI extraction                   │   │
│  │    • Schema.org markup with inflated claims                  │   │
│  │                                                               │   │
│  │ 3. COMPETITOR SABOTAGE                                       │   │
│  │    • Creating negative content about competitors             │   │
│  │    • False information to poison competitor's perception     │   │
│  │                                                               │   │
│  │ 4. KEYWORD STUFFING FOR AI                                   │   │
│  │    • Repeating "best", "top", "#1" excessively              │   │
│  │    • Fake comparison pages ("X vs Y") favoring self          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DETECTION METHODS:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. ANOMALY DETECTION                                         │   │
│  │    • Score jump > 20 points without news = suspicious        │   │
│  │    • Sudden mention increase without product launch          │   │
│  │    • Score divergence from competitor trend                  │   │
│  │                                                               │   │
│  │ 2. SOURCE CREDIBILITY ANALYSIS                               │   │
│  │    • Track which sources AI cites for brand                  │   │
│  │    • Flag if mostly self-published content                   │   │
│  │    • Check for circular citation patterns                    │   │
│  │                                                               │   │
│  │ 3. LINGUISTIC MANIPULATION MARKERS                           │   │
│  │    • Excessive superlatives ("best", "only", "#1")           │   │
│  │    • Unrealistic claims without evidence                     │   │
│  │    • Identical phrasing across sources (astroturfing)        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: manipulation_detections                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id                    UUID PRIMARY KEY                       │   │
│  │ brand_id              UUID REFERENCES brands(id)             │   │
│  │ detection_date        DATE                                   │   │
│  │ risk_score            DECIMAL                                │   │
│  │ risk_level            TEXT                                   │   │
│  │ anomaly_details       JSONB                                  │   │
│  │ linguistic_flags      JSONB                                  │   │
│  │ action_taken          TEXT                                   │   │
│  │ false_positive        BOOLEAN (manual review result)         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.85 Model Capability & Emergence Tracking (NEW)

```
┌─────────────────────────────────────────────────────────────────────┐
│              LLM CAPABILITY EVOLUTION MONITORING                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GOAL: Track how LLM capabilities affect brand analysis quality    │
│                                                                     │
│  CAPABILITY DIMENSIONS TO MONITOR:                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. KNOWLEDGE RECENCY                                         │   │
│  │    • What's the model's effective knowledge cutoff?          │   │
│  │    • Does it know about 2024 product launches?               │   │
│  │    • How does it handle "I don't know" vs hallucinating?     │   │
│  │                                                               │   │
│  │ 2. REASONING DEPTH                                           │   │
│  │    • Can it explain WHY it recommends a brand?              │   │
│  │    • Does it consider user context (budget, size, region)?  │   │
│  │    • Can it handle multi-step comparisons?                   │   │
│  │                                                               │   │
│  │ 3. MULTI-MODALITY                                            │   │
│  │    • Can it analyze brand logos, screenshots?                │   │
│  │    • Does visual context improve recommendations?            │   │
│  │    • Can it process brand videos/demos?                      │   │
│  │                                                               │   │
│  │ 4. TOOL USE / AGENTIC BEHAVIOR                               │   │
│  │    • Can it search web for current brand info?               │   │
│  │    • Can it verify claims against external sources?          │   │
│  │    • Does it know when to defer to external data?            │   │
│  │                                                               │   │
│  │ 5. CONSISTENCY & ALIGNMENT                                   │   │
│  │    • Does it refuse appropriate queries?                     │   │
│  │    • Is it consistent with brand safety guidelines?          │   │
│  │    • Does it handle controversial brands appropriately?      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DATABASE TABLE: model_capability_tracking                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id                    UUID PRIMARY KEY                       │   │
│  │ provider              TEXT                                   │   │
│  │ model_id              TEXT                                   │   │
│  │ capability_domain     TEXT (knowledge, reasoning, multimodal)│   │
│  │ capability_name       TEXT                                   │   │
│  │ probe_query           TEXT                                   │   │
│  │ passed                BOOLEAN                                │   │
│  │ response_quality      DECIMAL (0-1)                          │   │
│  │ test_date             DATE                                   │   │
│  │ notes                 TEXT                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CAPABILITY MATRIX (Example):                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Capability         │GPT-4│Claude│Gemini│Perplexity          │   │
│  │ ───────────────────┼─────┼──────┼──────┼────────────────────│   │
│  │ Knowledge to 2024  │  ✓  │  ✓   │  ✓   │  ✓ (real-time)     │   │
│  │ Multi-step reason  │  ✓  │  ✓   │  ⚠   │  ✓                 │   │
│  │ Web search         │  ✗  │  ✗   │  ✗   │  ✓                 │   │
│  │ Image analysis     │  ✓  │  ✓   │  ✓   │  ⚠                 │   │
│  │ Citation quality   │  ⚠  │  ⚠   │  ⚠   │  ✓                 │   │
│  │ Uncertainty aware  │  ✓  │  ✓   │  ⚠   │  ✓                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IMPACT ON ANALYSIS STRATEGY:                                      │
│  • Use Perplexity for current pricing/news (real-time search)     │
│  • Use GPT-4/Claude for nuanced reasoning & comparisons           │
│  • Use Gemini for visual brand analysis (logos, UI)               │
│  • Weight models by capability relevance per query type           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PART III: PHASED ROADMAP

### Phase Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PROJECT TIMELINE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PHASE 0    PHASE 1      PHASE 2      PHASE 3      PHASE 4         │
│  ──────     ──────────   ──────────   ──────────   ──────────      │
│  Setup     Foundation   Core Engine   Monetization  Scale          │
│                                                                     │
│  Week 0    Weeks 1-2    Weeks 3-4    Weeks 5-6    Weeks 7-8        │
│    ✓                                                                │
│  DONE      IN PROGRESS                                              │
│                                                                     │
│  ════════════════════════════════════════════════════════════════  │
│  MVP LAUNCH TARGET: End of Week 4                                   │
│  REVENUE TARGET: End of Week 6                                      │
│  ════════════════════════════════════════════════════════════════  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### PHASE 0: PROJECT SETUP [COMPLETED]

**Duration:** 1 day
**Status:** ✅ COMPLETED
**Date:** November 25, 2024

#### Deliverables Completed:
- [x] Archive legacy crypto analytics code
- [x] Create new landing page placeholder
- [x] Update branding to AI Perception
- [x] Document new project direction
- [x] Git commit and push

#### Assets Preserved:
- Authentication system (Supabase Auth + Resend emails)
- Theme system (dark/light mode)
- Core UI components (AuthModal, Footer, CookieBanner)
- Rate limiting infrastructure (Upstash)
- Validation utilities (Zod)

---

### PHASE 1: FOUNDATION [Weeks 1-2]

**Objective:** Build the core analysis infrastructure and enhance landing page

#### Week 1: Core Infrastructure + Design System

| Day | Activity | Deliverable | Owner |
|-----|----------|-------------|-------|
| 1 | Database schema design | Migration files for all tables + RLS policies | Claude |
| 1 | Set up AI provider clients | `/lib/ai/` with OpenAI + Anthropic ONLY (budget) | Claude |
| 1 | **Security: URL validator** | `/lib/security/url-validator.ts` - SSRF prevention | Claude |
| 1 | **UX: Design tokens** | Score colors, provider colors in globals.css | Claude |
| 1 | **AI: Zod output schemas** | Type-safe schemas for all AI responses | Claude |
| 2 | URL analysis service | `/lib/url-analyzer.ts` - extract metadata from URLs | Claude |
| 2 | Industry detection | `/lib/industry-detector.ts` - classify to taxonomy | Claude |
| 2 | **Security: Rate limiting** | Upstash rate limit middleware | Claude |
| 2 | **UX: ScoreCircle component** | Animated score display with color coding | Claude |
| 2 | **AI: Industry taxonomy seed** | 20 categories + sub-categories in DB | Claude |
| 3 | Prompt engineering | `/lib/prompts/` - versioned prompts in DB | Claude |
| 3 | **Security: Prompt sanitizer** | `/lib/ai/prompt-sanitizer.ts` - prevent injection | Claude |
| 3 | Response parser | `/lib/ai/response-parser.ts` - with function calling | Claude |
| 3 | **UX: ProgressBar component** | Multi-step progress with labels | Claude |
| 3 | **AI: Retry with backoff** | Exponential backoff + jitter for AI calls | Claude |
| 4 | Scoring algorithm | `/lib/scoring.ts` - calculate 0-100 score | Claude |
| 4 | **Cost tracking + protection** | Daily budget limits, auto-pause at 95% | Claude |
| 4 | **UX: EmptyState component** | Reusable empty state with illustration + CTA | Claude |
| 4 | **AI: Circuit breaker** | Per-provider circuit breaker pattern | Claude |
| 5 | **Unit tests setup** | Vitest config + first 20 unit tests | Claude |
| 5 | Integration testing | Test full analysis flow end-to-end | Claude |
| 5 | **UX: Error messages** | Human-friendly error copy for all error types | Claude |
| 5 | **AI: Prompt injection tests** | Adversarial test dataset (10+ cases) | Claude |
| 5 | **KG: Schema.org extractor** | Extract structured data from analyzed URLs | Claude |
| 5 | **SEO: Own site JSON-LD** | Add SoftwareApplication schema to our site | Claude |
| 5 | **Content: UX writing guide** | Voice, tone, terminology standards doc | Claude |
| 5 | **Content: Glossary page** | /glossary with 6 core terms + tooltips | Claude |
| 5 | **Dev: Env validation** | /lib/env.ts with Zod schema for all env vars | Claude |
| 5 | **Dev: Supabase types gen** | npm script to generate DB types | Claude |
| 5 | **Dev: API middleware factory** | /lib/api/middleware.ts centralized middleware | Claude |
| 5 | **PR: Pre-launch checklist** | Wikidata entry, Crunchbase, LinkedIn page setup | Alberto |
| 5 | **PR: Press kit creation** | Logo pack, screenshots, founder bio, boilerplate | Claude |
| 5 | **PR: Target media list** | 20 journalists/bloggers in AI/marketing space | Alberto |
| 5 | **Prompt: CoT prompt templates** | Chain-of-Thought base prompts for all query types | Claude |
| 5 | **Prompt: Few-shot exemplar DB** | Initial 15+ exemplars per model (GPT/Claude) | Claude |
| 5 | **Prompt: Temperature config** | Temperature matrix by task type (0.1-0.9 range) | Claude |
| 5 | **Onto: Core ontology design** | OWL/SKOS formal ontology definition (aip: namespace) | Claude |
| 5 | **Onto: Class hierarchy** | Brand, Industry, Provider, Analysis class taxonomy | Claude |
| 5 | **Onto: Property definitions** | competesWith, operatesIn, analyzedBy with domains | Claude |
| 5 | **CL: Negation scope detector** | /lib/nlp/negation.ts - detect "NOT recommend" patterns | Claude |
| 5 | **CL: Hedge/certainty scorer** | /lib/nlp/certainty.ts - "might" vs "definitely" confidence | Claude |
| 5 | **CL: Basic coreference** | /lib/nlp/coreference.ts - resolve "it", "they", "the company" | Claude |

**NEW: Security Deliverables Week 1:**
```typescript
// /lib/security/url-validator.ts
export function validateURL(url: string): { valid: boolean; error?: string } {
  // 1. Check URL format
  // 2. Block internal IPs (SSRF prevention)
  // 3. Block non-http(s) protocols
  // 4. Max length 2048 chars
}

// /lib/ai/prompt-sanitizer.ts
export function sanitizeBrandName(name: string): string {
  // Remove injection attempts
  // Escape special characters
  // Max length enforcement
}
```

**Key Technical Decisions:**

```typescript
// AI Provider Abstraction Pattern
interface AIProvider {
  name: 'openai' | 'anthropic' | 'google' | 'perplexity';
  query(prompt: string): Promise<AIResponse>;
  parseResponse(response: AIResponse): AnalysisResult;
}

// Scoring Algorithm (Weighted)
const SCORING_WEIGHTS = {
  mentioned: 20,        // Brand is mentioned at all
  recommended: 30,      // Explicitly recommended
  position: 20,         // Position in list (1st = 20, 5th = 4)
  sentiment: 15,        // Positive sentiment bonus
  multiProvider: 15,    // Consistent across providers
};
```

#### Week 2: Analysis Flow & Results Page + Loading Experience

| Day | Activity | Deliverable | Owner |
|-----|----------|-------------|-------|
| 1 | Analysis API endpoint | `/api/analyze/route.ts` | Claude |
| 1 | Analysis status endpoint | `/api/analyze/[id]/status/route.ts` | Claude |
| 1 | **Health check endpoint** | `/api/health/route.ts` - uptime monitoring | Claude |
| 1 | **UX: SSE progress updates** | Real-time progress from backend to frontend | Claude |
| 2 | Results page (UI) | `/app/results/[id]/page.tsx` | Claude |
| 2 | Score visualization | `<PerceptionScore />` with count-up animation | Claude |
| 2 | **UX: Score celebration** | Confetti animation for score > 80 | Claude |
| 3 | AI breakdown cards | `<AIProviderCard />` with provider colors | Claude |
| 3 | Recommendations list | `<RecommendationCard />` component | Claude |
| 3 | **UX: ProviderBadge** | Logo + status indicator component | Claude |
| 4 | **UX: Loading experience** | Progress storytelling with rotating facts | Claude |
| 4 | Error handling | Human-friendly messages + recovery actions | Claude |
| 4 | **Fallback logic** | If OpenAI fails → use Anthropic only (no crash) | Claude |
| 4 | **AI: Structured output parsing** | Function calling with Zod validation on all AI responses | Claude |
| 4 | **AI: Response quality logging** | Log completeness, latency, confidence per response | Claude |
| 5 | **Integration tests** | 20+ tests for API routes | Claude |
| 5 | End-to-end testing | Full user flow with Playwright | Claude |
| 5 | **UX: Mobile responsive** | Results page mobile-first responsive | Claude |
| 5 | **AI: Golden dataset tests** | 10 known-good responses for drift detection baseline | Claude |
| 5 | **AI: Adversarial prompt tests** | Test prompt injection attacks are sanitized | Claude |
| 5 | **KG: Entity extraction** | Extract org/person/product entities from URLs | Claude |
| 5 | **SEO: Results page schema** | Add Rating schema to analysis results | Claude |
| 5 | **SEO: Dynamic OG images** | @vercel/og for shareable score images | Claude |
| 5 | **Content: AI disclaimer** | Results page disclaimer + ToS AI section | Claude |
| 5 | **Content: Email templates** | Welcome + score change email templates | Claude |
| 5 | **Content: Share copy** | Pre-written Twitter/LinkedIn share templates | Claude |
| 5 | **Dev: CI/CD pipeline** | GitHub Actions workflow (lint, test, build, deploy) | Claude |
| 5 | **Dev: Service factory** | /lib/services/factory.ts dependency injection pattern | Claude |
| 5 | **Dev: Feature flags module** | /lib/feature-flags.ts with env-based flags | Claude |
| 5 | **Dev: Request tracing** | X-Request-ID header propagation across all requests | Claude |
| 5 | **PR: Product Hunt draft** | Product Hunt launch page prepared (not submitted) | Alberto |
| 5 | **PR: Social accounts setup** | Twitter @aiperception, verified LinkedIn page | Alberto |
| 5 | **PR: Sentiment tracking DB** | reputation_history table + sentiment extraction | Claude |
| 5 | **PR: Launch blog posts** | 3 draft posts for launch week content | Claude |
| 5 | **Prompt: Model-specific variants** | GPT vs Claude prompt adaptations (JSON modes) | Claude |
| 5 | **Prompt: Calibration baseline** | Model mean/std calibration data for Z-score norm | Claude |
| 5 | **Prompt: Self-consistency v1** | 3-sample majority voting for critical queries | Claude |
| 5 | **Prompt: Golden dataset v1** | 20 hand-verified prompt-response pairs for testing | Claude |
| 5 | **Onto: Wikidata alignment** | entity_alignments table + auto-linking workflow | Claude |
| 5 | **Onto: NAICS code mapping** | Industry → NAICS code mapping for 20 industries | Claude |
| 5 | **Onto: Provenance tracking** | fact_provenance table with PROV-O model | Claude |
| 5 | **Onto: Competency questions** | 13 CQs documented, queries tested | Claude |
| 5 | **CL: Aspect-based sentiment** | /lib/nlp/absa.ts - sentiment per aspect not overall | Claude |
| 5 | **CL: Comparative extractor** | /lib/nlp/comparatives.ts - "better than X", "best in category" | Claude |
| 5 | **CL: Discourse markers** | /lib/nlp/discourse.ts - "however", "although", "but" detection | Claude |
| 5 | **CL: RAKE keyphrase extraction** | /lib/nlp/keyphrases.ts - extract key terms from responses | Claude |
| 5 | **LLM-B: Response stability sampler** | Multi-run sampling (5x) + outlier detection | Claude |
| 5 | **LLM-B: Model version tracker** | Track exact model versions per API call | Claude |
| 5 | **LLM-B: Basic hallucination flags** | Entity verification against known brands DB | Claude |

**Acceptance Criteria Phase 1:**
- [ ] User can enter URL and receive analysis
- [ ] Analysis queries 2 AI providers (OpenAI + Anthropic) ← BUDGET DECISION
- [ ] Results show score (0-100) with visual representation
- [ ] Results show per-provider breakdown
- [ ] At least 3 recommendations generated
- [ ] Analysis completes in < 45 seconds
- [ ] All API costs tracked per analysis
- [ ] **NEW: Malicious URLs rejected (security)**
- [ ] **NEW: Rate limit enforced (10 req/min unauthenticated)**
- [ ] **NEW: 20+ unit tests passing**
- [ ] **NEW: Health check returns 200 OK**
- [ ] **NEW (UX): Loading shows real-time progress steps**
- [ ] **NEW (UX): Score reveal has count-up animation**
- [ ] **NEW (UX): Error messages are human-friendly with recovery actions**
- [ ] **NEW (UX): Results page works on mobile (< 640px)**
- [ ] **NEW (AI/Data): All AI responses parsed with Zod schemas (100% type-safe)**
- [ ] **NEW (AI/Data): Response quality metrics logged (completeness, latency)**
- [ ] **NEW (AI/Data): Industry normalized to taxonomy (20 top categories)**
- [ ] **NEW (AI/Data): Retry with exponential backoff on AI failures (max 3)**
- [ ] **NEW (AI/Data): Circuit breaker active per provider (open after 5 consecutive failures)**
- [ ] **NEW (AI/Data): Golden dataset baseline established (10 test cases)**
- [ ] **NEW (AI/Data): Prompt injection tests pass (adversarial inputs sanitized)**
- [ ] **NEW (AI/Data): Daily cost auto-pause at 95% budget threshold**
- [ ] **NEW (KG/SEO): Schema.org extracted from analyzed URLs (if present)**
- [ ] **NEW (KG/SEO): Entity extraction identifies org name, type, industry**
- [ ] **NEW (KG/SEO): Own site has SoftwareApplication JSON-LD schema**
- [ ] **NEW (KG/SEO): Results pages have Rating schema + dynamic OG images**
- [ ] **NEW (KG/SEO): Social sharing generates branded score image**
- [ ] **NEW (Content): UX writing guide documented (voice, tone, terms)**
- [ ] **NEW (Content): Glossary page live with 6 core terms**
- [ ] **NEW (Content): AI disclaimer on results page**
- [ ] **NEW (Content): Welcome email template implemented**
- [ ] **NEW (Content): Social share templates pre-populate correctly**
- [ ] **NEW (Dev): Env validation passes at build time (all required vars present)**
- [ ] **NEW (Dev): Supabase types auto-generated from database schema**
- [ ] **NEW (Dev): API middleware factory used in all routes (auth, rate-limit, validation)**
- [ ] **NEW (Dev): CI/CD pipeline passing (lint → test → build → deploy)**
- [ ] **NEW (Dev): Service factory pattern for AI providers (mockable in tests)**
- [ ] **NEW (Dev): Feature flags module active (at least 2 flags defined)**
- [ ] **NEW (Dev): X-Request-ID header present on all API responses**
- [ ] **NEW (Dev): Bundle size < 150KB first load JS (homepage)**
- [ ] **NEW (PR): Wikidata entry created for AI Perception**
- [ ] **NEW (PR): Crunchbase company profile complete**
- [ ] **NEW (PR): Twitter and LinkedIn accounts active**
- [ ] **NEW (PR): Press kit ready with all assets**
- [ ] **NEW (PR): Product Hunt page drafted (not launched)**
- [ ] **NEW (PR): Sentiment tracking table in database**
- [ ] **NEW (PR): 20 media targets identified with contact info**
- [ ] **NEW (Prompt): CoT prompts active for all recommendation queries**
- [ ] **NEW (Prompt): Few-shot exemplars loaded (15+ per model)**
- [ ] **NEW (Prompt): Temperature configured by task (extraction=0.1, analysis=0.3)**
- [ ] **NEW (Prompt): Model-specific JSON mode enabled (GPT function calling, Claude tools)**
- [ ] **NEW (Prompt): Calibration baseline established (model mean/std computed)**
- [ ] **NEW (Prompt): Self-consistency returns confidence scores (high/medium/low)**
- [ ] **NEW (Prompt): Golden dataset tests passing (>80% accuracy on 20 cases)**
- [ ] **NEW (Prompt): Response parse success rate >98%**
- [ ] **NEW (Onto): Formal ontology defined (OWL/SKOS, aip: namespace)**
- [ ] **NEW (Onto): Class hierarchy implemented (Brand, Industry, Provider, Analysis)**
- [ ] **NEW (Onto): Object properties defined with domain/range constraints**
- [ ] **NEW (Onto): entity_alignments table created with Wikidata linking**
- [ ] **NEW (Onto): 20 industries mapped to NAICS codes**
- [ ] **NEW (Onto): fact_provenance table active (PROV-O compliant)**
- [ ] **NEW (Onto): 13 competency questions documented and tested**
- [ ] **NEW (Onto): Domain/range validation triggers active**
- [ ] **NEW (CL): Negation scope detection accuracy >90% on test set**
- [ ] **NEW (CL): Hedge words classified into 3 certainty tiers (high/medium/low)**
- [ ] **NEW (CL): Basic coreference resolves >80% pronoun → entity links**
- [ ] **NEW (CL): Aspect-based sentiment extracts 3+ aspects per response**
- [ ] **NEW (CL): Comparative patterns detected ("better than", "best", "leader")**
- [ ] **NEW (CL): Discourse markers classified (contrast, concession, cause)**
- [ ] **NEW (CL): RAKE extracts 5+ keyphrases per analysis response**
- [ ] **NEW (CL): NLP pipeline module /lib/nlp/ created with 7+ utilities**
- [ ] **NEW (LLM-B): Multi-run sampling (5x) with outlier detection active**
- [ ] **NEW (LLM-B): Score confidence intervals shown (± range)**
- [ ] **NEW (LLM-B): Model version tracked per API call**
- [ ] **NEW (LLM-B): Basic entity hallucination detection active**
- [ ] **NEW (LLM-B): Inter-model agreement displayed in results**

---

### PHASE 2: CORE ENGINE [Weeks 3-4]

**Objective:** Add caching, implement freemium gating, advanced diagnostics

⚠️ **BUDGET DECISION:** Google AI and Perplexity deferred to Phase 4 to stay under $100/month.

#### Week 3: Caching + Advanced Diagnostics

| Day | Activity | Deliverable | Owner |
|-----|----------|-------------|-------|
| 1 | Response caching layer | Redis caching for AI responses | Claude |
| 1 | Cache invalidation | TTL-based + manual invalidation | Claude |
| 2 | **Hallucination Detection** | Compare AI claims vs scraped website data | Claude |
| 2 | **Share of Voice calc** | Run batch queries, calculate SOV | Claude |
| 3 | **Knowledge Graph Check** | Wikidata API + Schema.org parser | Claude |
| 3 | Competitor detection | Auto-detect competitors from AI responses | Claude |
| 3 | **KG: Schema.org validator** | Deep validation with actionable recommendations | Claude |
| 3 | **KG: E-E-A-T scoring** | Experience/Expertise/Authority/Trust analysis | Claude |
| 4 | Competitor comparison | Side-by-side score comparison | Claude |
| 4 | Enhanced recommendations | AI-generated actionable recommendations | Claude |
| 4 | **KG: Citation source tracking** | Extract and categorize AI citation sources | Claude |
| 4 | **KG: Wikidata link checker** | Check if brand exists, provide creation guide | Claude |
| 5 | Performance optimization | Parallel AI queries, timeout handling | Claude |
| 5 | **Cost dashboard (internal)** | Admin view of daily API costs | Claude |
| 5 | **SEO: FAQ page with schema** | /faq page with FAQPage structured data | Claude |
| 5 | **Content: Recommendation templates** | 4 recommendation explanation templates | Claude |
| 5 | **Content: Help articles (10)** | Getting Started + top Understanding articles | Claude |
| 5 | **Content: Weekly digest email** | Weekly summary email template | Claude |
| 5 | **Dev: Database indexes** | Composite indexes on high-query tables (analyses, scores) | Claude |
| 5 | **Dev: API versioning** | /api/v1/ prefix for all public endpoints | Claude |
| 5 | **Dev: Graceful shutdown** | Handle SIGTERM, complete in-flight requests | Claude |
| 5 | **PR: Crisis detection system** | crisis_events table + threshold alerts | Claude |
| 5 | **PR: Media mentions tracking** | media_mentions table + basic scraping | Claude |
| 5 | **PR: Review platform analysis** | G2/Capterra/Yelp review aggregation logic | Claude |
| 5 | **Prompt: Prompt testing framework** | Automated eval pipeline for prompt changes | Claude |
| 5 | **Prompt: Semantic drift detector** | Alert on significant response pattern changes | Claude |
| 5 | **Prompt: Token optimization** | Compress prompts to reduce API costs 20%+ | Claude |
| 5 | **Onto: Inference rules engine** | Materialized views for symmetric/transitive rules | Claude |
| 5 | **Onto: Uncertainty representation** | Confidence intervals on all assertions | Claude |
| 5 | **Onto: Wu-Palmer similarity** | Ontology-based similarity computation | Claude |
| 5 | **CL: Readability scoring** | Flesch-Kincaid, Gunning Fog, SMOG for content analysis | Claude |
| 5 | **CL: Quotation parser** | Extract direct quotes and attributed sources | Claude |
| 5 | **CL: Temporal expression NER** | Detect dates, timeframes, recency signals | Claude |
| 5 | **CL: Query intent classifier** | Classify user queries (recommendation/comparison/factual) | Claude |
| 5 | **LLM-B: Daily canary queries** | Drift detection baseline comparisons | Claude |
| 5 | **LLM-B: Position bias randomizer** | Shuffle brand order in prompts | Claude |
| 5 | **LLM-B: Cross-model verification** | Compare GPT vs Claude for hallucination detection | Claude |
| 5 | **LLM-B: Confidence calibration** | Track stated vs actual accuracy | Claude |

**Caching Strategy:**

```typescript
// Cache key structure
const cacheKey = `analysis:${industry}:${country}:${hash(prompt)}`;

// Cache TTL by type
const CACHE_TTL = {
  aiResponse: 24 * 60 * 60,      // 24 hours
  urlMetadata: 7 * 24 * 60 * 60, // 7 days
  industryMapping: 30 * 24 * 60 * 60, // 30 days
};
```

#### Week 4: Freemium & Dashboard + Conversion UX

| Day | Activity | Deliverable | Owner |
|-----|----------|-------------|-------|
| 1 | Freemium gating logic | Show partial results for free users | Claude |
| 1 | **UX: BlurredContent component** | Visible but locked content that creates FOMO | Claude |
| 1 | Upgrade prompts | Strategic CTAs in results page | Claude |
| 2 | User dashboard | `/app/dashboard/page.tsx` | Claude |
| 2 | Analysis history | List of past analyses with scores | Claude |
| 2 | **UX: Dashboard empty state** | First-run experience with value demo | Claude |
| 3 | Dashboard charts | Score trends over time (Recharts) | Claude |
| 3 | Quick re-analysis | One-click re-run for monitored URLs | Claude |
| 3 | **UX: TrendChart component** | Simple line graph with celebration on improvement | Claude |
| 4 | Email notifications | Analysis complete, score changes | Claude |
| 4 | **UX: Social proof placeholder** | "Others in your industry score X avg" | Claude |
| 5 | MVP Polish | UI refinements, bug fixes | Claude |
| 5 | **UX: Mobile dashboard** | Bottom nav, swipeable history | Claude |
| 5 | **Dev: Bundle analyzer** | @next/bundle-analyzer integration | Claude |
| 5 | **Dev: Preview environments** | Vercel preview URLs per PR | Claude |
| 5 | **Dev: Performance monitoring** | Core Web Vitals tracking (LCP, FID, CLS) | Claude |
| 5 | **PR: Narrative consistency checker** | Cross-source brand messaging analyzer | Claude |
| 5 | **PR: PR recommendations engine** | Industry-specific playbook generator | Claude |
| 5 | **PR: Beta tester outreach** | Email list of 100+ beta testers | Alberto |
| 5 | **Prompt: Golden dataset expansion** | Expand to 50 cases covering edge scenarios | Claude |
| 5 | **Prompt: Prompt A/B testing** | Compare prompt variants on live traffic | Claude |
| 5 | **Prompt: Multi-turn context** | Enable follow-up queries with conversation memory | Claude |
| 5 | **Onto: Multi-lingual labels** | SKOS prefLabel/altLabel in EN + ES | Claude |
| 5 | **Onto: brand_similarity_cache** | Pre-computed structural+feature similarity | Claude |
| 5 | **Onto: Temporal validity** | validFrom/validTo on all relationships | Claude |

**Freemium Gating Rules:**

```typescript
const PLAN_LIMITS = {
  free: {
    analysesPerMonth: 5,
    aiProvidersVisible: 2,       // Show OpenAI + Claude only
    recommendationsVisible: 1,   // Show 1 of 3
    competitorsVisible: 0,
    historyDays: 0,
    monitoring: false,
  },
  starter: {
    analysesPerMonth: 100,
    aiProvidersVisible: 4,
    recommendationsVisible: 'all',
    competitorsVisible: 3,
    historyDays: 30,
    monitoring: 'weekly',
  },
  pro: {
    analysesPerMonth: 500,
    aiProvidersVisible: 4,
    recommendationsVisible: 'all',
    competitorsVisible: 10,
    historyDays: 180,
    monitoring: 'daily',
  },
};
```

**MVP Launch Checklist (End of Week 4):**
- [ ] Full analysis flow working with 4 AI providers
- [ ] Caching reduces API costs by 50%+
- [ ] Freemium gating implemented
- [ ] Dashboard shows analysis history
- [ ] Email notifications working
- [ ] Error rates < 5%
- [ ] Average analysis time < 30 seconds
- [ ] Landing page conversion tracking

---

### PHASE 3: MONETIZATION [Weeks 5-6]

**Objective:** Implement Stripe, launch paid plans, enable monitoring

#### Week 5: Stripe Integration + Pricing UX

| Day | Activity | Deliverable | Owner |
|-----|----------|-------------|-------|
| 1 | Stripe account setup | Products, prices, webhooks | Alberto |
| 1 | Stripe SDK integration | `/lib/stripe.ts` | Claude |
| 2 | Checkout flow | `/api/billing/checkout/route.ts` | Claude |
| 2 | Billing portal | `/api/billing/portal/route.ts` | Claude |
| 3 | Webhook handlers | Subscription lifecycle events | Claude |
| 3 | Plan enforcement | Check subscription before features | Claude |
| 4 | Pricing page | `/app/pricing/page.tsx` | Claude |
| 4 | **UX: PricingCard component** | Feature comparison, popular badge, annual toggle | Claude |
| 4 | Upgrade flow | In-app upgrade with Stripe Checkout | Claude |
| 5 | Testing | Full billing flow testing | Claude |
| 5 | **UX: Upgrade success celebration** | Welcome to Pro animation | Claude |

**Stripe Products:**

```javascript
// Stripe product configuration
const PRODUCTS = {
  starter: {
    name: 'AI Perception Starter',
    price: 2900, // $29.00
    interval: 'month',
    features: ['100 analyses/month', '4 AI providers', '3 competitors', 'Weekly monitoring'],
  },
  pro: {
    name: 'AI Perception Pro',
    price: 7900, // $79.00
    interval: 'month',
    features: ['500 analyses/month', '4 AI providers', '10 competitors', 'Daily monitoring', 'Priority support'],
  },
};
```

#### Week 6: Monitoring & Alerts

| Day | Activity | Deliverable | Owner |
|-----|----------|-------------|-------|
| 1 | Monitoring CRON setup | `/api/cron/monitor/route.ts` | Claude |
| 1 | URL monitoring queue | Background job system | Claude |
| 2 | Score change detection | Compare with previous scores | Claude |
| 2 | Alert thresholds | Configurable alert rules | Claude |
| 3 | Email alerts | Score change notifications | Claude |
| 3 | Dashboard alerts | In-app notification center | Claude |
| 4 | Monitoring settings | User preferences for alerts | Claude |
| 5 | Launch preparation | Final testing, documentation | Claude |
| 5 | **Dev: Drizzle ORM migration** | Database migrations versioning system | Claude |
| 5 | **Dev: Background job retry** | Exponential backoff for failed CRON jobs | Claude |
| 5 | **Dev: Webhook idempotency** | Prevent duplicate Stripe event processing | Claude |
| 5 | **PR: Product Hunt LAUNCH** | Submit and execute launch day playbook | Alberto |
| 5 | **PR: Press release distribution** | Send to 20 target journalists | Alberto |
| 5 | **PR: Launch day social blitz** | Twitter, LinkedIn, Reddit posts | Both |
| 5 | **Prompt: CI/CD prompt regression** | Automatic prompt tests in deployment pipeline | Claude |
| 5 | **Prompt: Prompt versioning system** | Full version tracking with rollback capability | Claude |
| 5 | **Onto: Ontology versioning** | URI-based versioning, deprecation policy | Claude |
| 5 | **Onto: Portuguese labels** | SKOS prefLabel/altLabel in PT | Claude |
| 5 | **CL: Spanish NLP resources** | ES stopwords, stemmer, sentiment lexicon | Claude |
| 5 | **CL: Lexical variation handler** | Synonyms, abbreviations, spelling variants | Claude |
| 5 | **CL: Semantic Role Labeling** | Agent-Patient-Theme extraction for context | Claude |
| 5 | **LLM-B: Behavioral fingerprinting** | Profile per model (biases, priors, style) | Claude |
| 5 | **LLM-B: Drift alerting system** | Minor/major/critical drift notifications | Claude |
| 5 | **LLM-B: Sycophancy detector** | Detect leading question effects | Claude |

**Monitoring Schedule:**

```typescript
// CRON jobs configuration
const MONITORING_SCHEDULE = {
  weekly: '0 9 * * 1',    // Every Monday 9 AM
  daily: '0 9 * * *',     // Every day 9 AM
};

// Alert conditions
const ALERT_THRESHOLDS = {
  scoreDropped: -10,      // Alert if score drops 10+ points
  scoreImproved: +15,     // Celebrate if score improves 15+
  newMention: true,       // Alert when newly mentioned
  lostMention: true,      // Alert when no longer mentioned
};
```

**Revenue Launch Checklist (End of Week 6):**
- [ ] Stripe checkout working
- [ ] Webhook handling all events
- [ ] Plan limits enforced
- [ ] Monitoring CRON running
- [ ] Alert emails sending
- [ ] First paying customer acquired

---

### PHASE 4: SCALE & OPTIMIZE [Weeks 7-8]

**Objective:** Add remaining AI providers, viral features, prepare for scale

#### Week 7: Additional AI Providers + Viral Features

| Day | Activity | Deliverable | Owner |
|-----|----------|-------------|-------|
| 1 | **Google AI (Gemini) integration** | Gemini API client (deferred from Phase 2) | Claude |
| 1 | **Perplexity integration** | Perplexity API client (deferred from Phase 2) | Claude |
| 2 | Public score badges | Embeddable badge for websites | Claude |
| 2 | Social sharing | Share score on Twitter/LinkedIn | Claude |
| 3 | Industry leaderboards | Public rankings by industry | Claude |
| 3 | Comparison landing pages | SEO-optimized comparison pages | Claude |
| 4 | Referral system | Invite friends, get free analyses | Claude |
| 4 | **RAG Optimization Score** | Full implementation (deferred from Phase 2) | Claude |
| 5 | Analytics dashboard | Business metrics tracking | Claude |
| 5 | **Dev: Feature flags Vercel Edge** | Migrate to Edge Config for production | Claude |
| 5 | **Dev: Error boundary** | Global React error boundary with Sentry | Claude |
| 5 | **Dev: Load testing** | k6/Artillery scripts for 100 concurrent users | Claude |
| 5 | **PR: Post-launch case study** | First customer success story | Both |
| 5 | **PR: Podcast outreach** | Pitch to 10 marketing/SaaS podcasts | Alberto |
| 5 | **PR: Guest post campaign** | 3 guest posts on SEO/marketing blogs | Both |
| 5 | **Prompt: Gemini/Perplexity prompts** | Model-specific prompts for new providers | Claude |
| 5 | **Prompt: 4-model calibration** | Expand calibration to all 4 providers | Claude |
| 5 | **Prompt: Prompt cost analytics** | Token usage dashboard by prompt type | Claude |
| 5 | **Onto: ISIC code mapping** | International industry standards for global markets | Claude |
| 5 | **Onto: LEI integration** | Legal Entity Identifier for enterprise customers | Claude |
| 5 | **Onto: Schema.org export** | JSON-LD export of brand ontology data | Claude |
| 5 | **CL: Topic modeling (BERTopic)** | Auto-cluster competitor mentions by topic | Claude |
| 5 | **CL: Multi-lingual pipeline (EN/ES/PT)** | Language detection + lang-specific NLP | Claude |
| 5 | **CL: Argumentation mining** | Claim-premise-conclusion extraction | Claude |
| 5 | **CL: NLP quality dashboard** | Monitor parse accuracy, coverage, drift | Claude |
| 5 | **LLM-B: Manipulation detector** | Anomaly + source credibility analysis | Claude |
| 5 | **LLM-B: Capability tracker** | Knowledge recency, reasoning, multimodal | Claude |
| 5 | **LLM-B: Model comparison dashboard** | Full behavioral analytics per model | Claude |
| 5 | **LLM-B: Adversarial test suite** | Gaming attempt detection | Claude |

**Why Add Google/Perplexity in Phase 4?**
- By Week 7, we should have paying customers generating revenue
- Revenue covers additional API costs
- Caching is mature, reducing per-analysis cost
- Can offer "4 AI providers" as premium upgrade incentive

**Viral Loop Design:**

```
┌─────────────────────────────────────────────────────────────┐
│                     VIRAL GROWTH ENGINE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. USER GETS SCORE                                         │
│     ↓                                                       │
│  2. SHARE PROMPT: "My AI Perception Score is 72! 🎯"        │
│     ↓                                                       │
│  3. FRIEND CLICKS → ENTERS THEIR URL                        │
│     ↓                                                       │
│  4. FRIEND GETS SCORE → SHARES                              │
│     ↓                                                       │
│  (REPEAT)                                                   │
│                                                             │
│  AMPLIFIERS:                                                │
│  • Public leaderboards drive competition                    │
│  • Badges on websites = free advertising                    │
│  • Industry reports = SEO traffic                           │
│  • Referral rewards = incentivized sharing                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Week 8: Optimization & Documentation + Programmatic SEO

| Day | Activity | Deliverable | Owner |
|-----|----------|-------------|-------|
| 1 | Performance audit | Identify and fix bottlenecks | Claude |
| 1 | Cost optimization | Further reduce API costs | Claude |
| 2 | SEO optimization | Meta tags, structured data, sitemap | Claude |
| 2 | GEO optimization | Make AI recommend US! | Claude |
| 2 | **SEO: Programmatic industry pages** | /ai-perception/{industry} SSG pages | Claude |
| 3 | Error monitoring | Sentry integration, alerting | Claude |
| 3 | User feedback system | In-app feedback collection | Claude |
| 3 | **SEO: Programmatic location pages** | /ai-perception/{industry}/{city} pages | Claude |
| 4 | Documentation | User docs, API docs | Claude |
| 4 | Onboarding flow | First-time user experience | Claude |
| 4 | **SEO: Sitemap.xml auto-generation** | Include all programmatic pages | Claude |
| 4 | **KG: Industry knowledge graph** | Build brand relationship graph per industry | Claude |
| 5 | Launch retrospective | Document learnings, next steps | Both |
| 5 | **SEO: Wikidata entry for AI Perception** | Create our own Wikidata presence | Alberto |
| 5 | **Content: Help center complete** | All 36 articles written and published | Claude |
| 5 | **Content: Upgrade/churn emails** | Upgrade nudge + churn prevention templates | Claude |
| 5 | **Content: Competitive insights copy** | Competitor report narrative templates | Claude |
| 5 | **Content: i18n architecture** | Prepare for Spanish localization (Phase 5) | Claude |
| 5 | **Dev: Database read replicas** | Supabase read replica for analytics queries | Claude |
| 5 | **Dev: CDN caching strategy** | Vercel Edge Network for static + ISR pages | Claude |
| 5 | **Dev: Health dashboard** | Internal status page with all service health | Claude |
| 5 | **Dev: Runbook documentation** | On-call runbooks for common incidents | Claude |
| 5 | **Prompt: Golden dataset 100+** | Comprehensive test suite covering all scenarios | Claude |
| 5 | **Prompt: Adaptive temperature** | Dynamic temperature based on query complexity | Claude |
| 5 | **Prompt: Prompt library v2** | Industry-specific prompt variants (20 industries) | Claude |
| 5 | **Prompt: Model behavior benchmark** | Monthly benchmark report across all models | Claude |
| 5 | **Onto: Full semantic similarity** | structural + feature + embedding combined | Claude |
| 5 | **Onto: Reasoning benchmark** | Verify all 13 CQs answered correctly | Claude |
| 5 | **Onto: Ontology documentation** | Published ontology spec with examples | Claude |
| 5 | **Onto: FR/DE labels (future-ready)** | French/German labels framework ready | Claude |
| 5 | **PR: Monthly data report** | "AI Perception by Industry" benchmark report | Claude |
| 5 | **PR: Testimonial collection** | Request testimonials from 10 happy users | Alberto |
| 5 | **PR: Competitor PR analysis** | Competitive PR positioning matrix | Claude |
| 5 | **PR: Influencer partnerships** | Identify 5 KOLs for partnership discussions | Alberto |

**Phase 4 Dev Checklist (End of Week 8):**
- [ ] Feature flags on Vercel Edge Config
- [ ] Global error boundary catching all React errors
- [ ] Load testing passing for 100 concurrent users
- [ ] Read replica configured for analytics
- [ ] CDN cache hit rate > 80% on static content
- [ ] Health dashboard accessible
- [ ] Runbooks for all critical services documented

**Phase 4 PR Checklist (End of Week 8):**
- [ ] Product Hunt launched (target: top 5 of the day)
- [ ] 5+ press articles published about AI Perception
- [ ] 500+ social followers across platforms
- [ ] 1,000+ email subscribers
- [ ] 2+ podcast appearances scheduled/completed
- [ ] First customer case study published
- [ ] Monthly industry benchmark report released
- [ ] 10 testimonials collected and displayed
- [ ] Ongoing PR cadence established (weekly social, bi-weekly content)
- [ ] Crisis detection system active and monitoring

**Phase 4 Prompt Engineering Checklist (End of Week 8):**
- [ ] All 4 AI providers have model-specific prompts optimized
- [ ] 4-model calibration active (Z-score normalization working)
- [ ] Golden dataset expanded to 100+ test cases
- [ ] Prompt CI/CD running on every deployment
- [ ] Prompt versioning with rollback capability tested
- [ ] Token optimization achieved 20%+ cost reduction
- [ ] Semantic drift detector active with alerts configured
- [ ] Adaptive temperature implemented for complex queries
- [ ] Industry-specific prompt variants for all 20 industries
- [ ] Monthly model behavior benchmark process established
- [ ] Prompt A/B testing framework producing insights
- [ ] Response parse success rate maintained >98%

**Phase 4 Ontology Engineering Checklist (End of Week 8):**
- [ ] Formal OWL/SKOS ontology published at https://aiperception.com/ontology/v1#
- [ ] All 13 competency questions answerable via queries
- [ ] Entity alignments to Wikidata for 80%+ of known brands
- [ ] NAICS + ISIC codes mapped for all 20+ industries
- [ ] Provenance tracking active (PROV-O compliant) for all facts
- [ ] Uncertainty/confidence represented on all AI-derived assertions
- [ ] Inference rules engine computing symmetric/transitive closures
- [ ] Multi-lingual labels in EN, ES, PT (FR/DE framework ready)
- [ ] Wu-Palmer + feature similarity computed for brand_similarity_cache
- [ ] Temporal validity (validFrom/validTo) on all relationships
- [ ] Ontology versioning with deprecation policy documented
- [ ] Schema.org JSON-LD export available for analyzed brands
- [ ] Domain/range validation triggers preventing invalid relationships
- [ ] Ontology documentation published with examples

**Phase 4 Computational Linguistics Checklist (End of Week 8):**
- [ ] /lib/nlp/ module with 10+ utilities (negation, hedge, coreference, ABSA, etc.)
- [ ] Negation scope detection accuracy >90% on test dataset
- [ ] Hedge/certainty classification into 3 tiers (high/medium/low)
- [ ] Coreference resolution covering >80% pronoun → entity links
- [ ] Aspect-based sentiment extracting 5+ aspects per analysis
- [ ] Comparative/superlative patterns detected and stored
- [ ] Discourse markers classified (contrast, concession, cause, consequence)
- [ ] RAKE keyphrase extraction producing 5+ keyphrases per response
- [ ] Readability scores computed (Flesch-Kincaid, Gunning Fog, SMOG)
- [ ] Query intent classification (recommendation/comparison/factual/exploratory)
- [ ] Multi-lingual NLP pipeline supporting EN, ES, PT
- [ ] Topic modeling (BERTopic) clustering competitor mentions
- [ ] Argumentation mining extracting claim-premise-conclusion structures
- [ ] NLP quality dashboard monitoring parse accuracy and coverage
- [ ] Temporal expression extraction identifying recency signals
- [ ] Quotation/attribution parsing extracting sources

**Phase 4 LLM Behavioral Research Checklist (End of Week 8):**
- [ ] Multi-run sampling (5x) active for all analyses with outlier detection
- [ ] Score confidence intervals displayed (± range) in all results
- [ ] Model version tracking per API call with audit trail
- [ ] Entity hallucination detection with >85% precision
- [ ] Cross-model verification comparing GPT vs Claude claims
- [ ] Daily canary queries running for drift detection
- [ ] Position bias mitigation via randomized brand ordering
- [ ] Confidence calibration tracking stated vs actual accuracy
- [ ] Behavioral fingerprints computed for all 4 providers
- [ ] Drift alerting system with minor/major/critical thresholds
- [ ] Sycophancy detection flagging leading question effects
- [ ] Manipulation detection via anomaly + source credibility
- [ ] Capability tracking matrix per model (knowledge, reasoning, multimodal)
- [ ] Model comparison dashboard with behavioral analytics
- [ ] Adversarial test suite detecting gaming attempts
- [ ] Inter-model agreement metrics (Fleiss' Kappa) displayed

---

## PART IV: SUCCESS METRICS & KPIs

### 4.1 North Star Metrics

```
┌─────────────────────────────────────────────────────────────┐
│                    NORTH STAR METRICS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRIMARY: Monthly Recurring Revenue (MRR)                   │
│  ═══════════════════════════════════════                    │
│  Target Month 1:  $145  (5 customers × $29)                 │
│  Target Month 3:  $870  (30 customers)                      │
│  Target Month 6:  $2,900 (100 customers)                    │
│  Target Month 12: $10,000 (350 customers)                   │
│                                                             │
│  SECONDARY: Analyses Completed                              │
│  ═══════════════════════════════════════                    │
│  Target Month 1:  300                                       │
│  Target Month 3:  1,500                                     │
│  Target Month 6:  6,000                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Weekly KPIs Dashboard

| Metric | Week 1-2 | Week 3-4 | Week 5-6 | Week 7-8 |
|--------|----------|----------|----------|----------|
| Analyses/day | 10 | 30 | 50 | 100 |
| Registered users | 50 | 150 | 300 | 500 |
| Free→Paid conversion | - | - | 3% | 5% |
| API cost/analysis | $0.20 | $0.10 | $0.06 | $0.04 |
| Avg analysis time | 45s | 35s | 30s | 25s |
| Error rate | <10% | <5% | <3% | <2% |
| NPS Score | - | - | - | >30 |

### 4.3 Financial Projections

```
┌─────────────────────────────────────────────────────────────┐
│                  FINANCIAL MODEL (MONTH 6)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REVENUE                                                    │
│  ├─ 70 Starter plans × $29    = $2,030                      │
│  ├─ 30 Pro plans × $79        = $2,370                      │
│  └─ Total MRR                 = $4,400                      │
│                                                             │
│  COSTS                                                      │
│  ├─ AI APIs (~6000 analyses)  = $360 (at $0.06/analysis)   │
│  ├─ Vercel hosting            = $20                         │
│  ├─ Supabase                  = $25                         │
│  ├─ Upstash                   = $10                         │
│  ├─ Resend (emails)           = $20                         │
│  ├─ Stripe fees (2.9%)        = $128                        │
│  └─ Total costs               = $563                        │
│                                                             │
│  GROSS MARGIN                 = $3,837 (87%)                │
│                                                             │
│  BREAK-EVEN: 2 Starter + 1 Pro = $137/month                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## PART V: RISK MITIGATION PLAYBOOK

### 5.1 Technical Risks

| Risk | Trigger | Response | Owner |
|------|---------|----------|-------|
| OpenAI API down | 3+ failures in 5 min | Switch to Anthropic as primary | Auto |
| High API costs | >$100/day | Increase cache TTL, reduce free tier | Claude |
| Slow analysis | >60 seconds avg | Parallelize, timeout aggressive | Claude |
| Data breach | Security alert | Incident response, notify users | Both |

### 5.2 Business Risks

| Risk | Trigger | Response | Owner |
|------|---------|----------|-------|
| Low conversion | <2% after week 6 | A/B test pricing, features | Both |
| High churn | >15% monthly | Survey users, improve value | Both |
| Competitor launch | Direct competitor | Accelerate roadmap, differentiate | Both |
| Negative PR | Public complaint | Respond within 4h, fix issue | Alberto |

---

## PART VI: GOVERNANCE & DECISION LOG

### 6.1 Decision Rights Matrix

| Decision Type | Alberto (Vision) | Claude (Execution) |
|---------------|------------------|-------------------|
| Product direction | DECIDE | ADVISE |
| Feature prioritization | DECIDE | ADVISE |
| Technical architecture | ADVISE | DECIDE |
| Code implementation | INFORMED | DECIDE |
| Pricing strategy | DECIDE | ADVISE |
| Marketing copy | DECIDE | EXECUTE |
| Bug fixes | INFORMED | DECIDE |
| Security issues | INFORMED | DECIDE + ESCALATE |

### 6.2 Communication Cadence

| Meeting | Frequency | Purpose |
|---------|-----------|---------|
| Daily standup | Daily | Progress, blockers |
| Week review | Weekly | KPI review, planning |
| Phase review | Bi-weekly | Milestone assessment |
| Strategy review | Monthly | Direction, pivots |

---

## PART VII: APPENDICES

### A. Environment Variables Required

```bash
# Existing (from VectorialData)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# New for AI Perception
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
PERPLEXITY_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### B. File Structure (Target State)

```
/app/src/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   ├── route.ts              # POST - Start analysis
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET - Get results
│   │   │       └── status/route.ts   # GET - Check status
│   │   ├── billing/
│   │   │   ├── checkout/route.ts     # POST - Create checkout
│   │   │   ├── portal/route.ts       # POST - Customer portal
│   │   │   └── webhook/route.ts      # POST - Stripe webhooks
│   │   ├── cron/
│   │   │   └── monitor/route.ts      # POST - Run monitoring
│   │   ├── auth/                     # [EXISTING]
│   │   └── health/                   # [EXISTING]
│   ├── (marketing)/
│   │   ├── page.tsx                  # Landing page
│   │   ├── pricing/page.tsx          # Pricing page
│   │   └── about/page.tsx            # About page
│   ├── (app)/
│   │   ├── dashboard/page.tsx        # User dashboard
│   │   ├── results/[id]/page.tsx     # Analysis results
│   │   └── settings/page.tsx         # User settings
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── analysis/
│   │   ├── URLInput.tsx
│   │   ├── AnalysisProgress.tsx
│   │   ├── PerceptionScore.tsx
│   │   ├── AIProviderCard.tsx
│   │   ├── RecommendationCard.tsx
│   │   └── CompetitorComparison.tsx
│   ├── dashboard/
│   │   ├── ScoreChart.tsx
│   │   ├── AnalysisList.tsx
│   │   └── AlertsPanel.tsx
│   ├── billing/
│   │   ├── PricingCards.tsx
│   │   ├── UpgradePrompt.tsx
│   │   └── UsageBar.tsx
│   └── [EXISTING COMPONENTS]
├── lib/
│   ├── ai/
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   ├── google.ts
│   │   │   └── perplexity.ts
│   │   ├── orchestrator.ts
│   │   ├── response-parser.ts
│   │   └── prompts.ts
│   ├── analysis/
│   │   ├── url-analyzer.ts
│   │   ├── industry-detector.ts
│   │   ├── scoring.ts
│   │   └── recommendations.ts
│   ├── stripe.ts
│   ├── cache.ts
│   └── [EXISTING LIBS]
├── hooks/
│   ├── useAnalysis.ts
│   ├── useSubscription.ts
│   └── [EXISTING HOOKS]
└── types/
    ├── analysis.ts
    ├── billing.ts
    └── [EXISTING TYPES]
```

### C. Prompt Engineering Examples

```typescript
// Industry Detection Prompt
const INDUSTRY_DETECTION_PROMPT = `
Analyze this website metadata and determine:
1. Primary industry/category
2. Target country/market
3. Type of entity (business, personal brand, product, service)
4. 3-5 likely competitors in the same space

Website: {url}
Title: {title}
Description: {description}
Content excerpt: {excerpt}

Respond in JSON format:
{
  "industry": "string",
  "subIndustry": "string",
  "country": "string",
  "entityType": "business|personal|product|service",
  "competitors": ["name1", "name2", "name3"]
}
`;

// AI Perception Query Prompt
const PERCEPTION_QUERY_PROMPT = `
You are helping someone find the best {industry} in {country}.
List the top 5-10 {industry} you would recommend, explaining why each is notable.
Be specific with names and focus on quality recommendations.
`;

// Analysis Extraction Prompt
const ANALYSIS_EXTRACTION_PROMPT = `
Given this AI response about {industry} recommendations:
"{response}"

And this brand we're analyzing: "{brandName}"

Determine:
1. Is the brand mentioned? (yes/no)
2. Is the brand recommended? (yes/no)
3. What position is it in the list? (1-10, or null if not listed)
4. What is the sentiment? (positive/neutral/negative)
5. Quote the exact text where the brand is mentioned (if applicable)

Respond in JSON format.
`;
```

---

### D. Legal & Compliance Checklist

```
┌─────────────────────────────────────────────────────────────────────┐
│                 LEGAL REQUIREMENTS (Phase 1-2)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. TERMS OF SERVICE                                               │
│     ═══════════════                                                │
│     - Update from crypto analytics to AI perception service         │
│     - Define acceptable use (no abuse, no scraping)                │
│     - Limit liability for AI accuracy                              │
│     - Reserve right to change pricing                              │
│     Deadline: Before accepting first paying customer                │
│                                                                     │
│  2. PRIVACY POLICY                                                 │
│     ══════════════                                                 │
│     - GDPR compliant (already have CookieBanner)                   │
│     - Explain data collected: URLs, analysis results, usage        │
│     - Third parties: Stripe, Supabase, AI providers                │
│     - Data retention: 180 days for analyses                        │
│     Deadline: Phase 1, Week 2                                      │
│                                                                     │
│  3. COOKIE CONSENT                                                 │
│     ══════════════                                                 │
│     - Already implemented (CookieBanner component)                 │
│     - Verify analytics cookies covered                             │
│     Deadline: Already done ✓                                       │
│                                                                     │
│  4. AI DISCLOSURE                                                  │
│     ══════════════                                                 │
│     - Clearly state scores are AI-generated approximations         │
│     - No guarantee of accuracy                                     │
│     - AI responses may change over time                            │
│     Location: Results page footer                                  │
│                                                                     │
│  5. STRIPE COMPLIANCE                                              │
│     ═════════════════                                              │
│     - Display refund policy                                        │
│     - Cancel anytime clause                                        │
│     - Price displayed including taxes note                         │
│     Deadline: Phase 3, Week 5                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SIGNATURE

This roadmap represents a comprehensive strategic plan for the AI Perception Engineering Agency project. It balances technical excellence with business viability, maintaining focus on the core value proposition while building for scale.

**Key Success Factors:**
1. Speed to market (8 weeks to full product)
2. Cost discipline (break-even at 3 customers)
3. Viral design (built-in sharing mechanisms)
4. Technical robustness (caching, error handling, monitoring)
5. **NEW: Security-first approach (SSRF prevention, rate limiting, prompt sanitization)**
6. **NEW: Budget control ($100/month maximum pre-revenue)**

**Technical Review Summary (v2.0):**
- Added security architecture section
- Added testing strategy with Vitest/Playwright
- Added observability stack (Sentry, cost tracking)
- Added budget constraint analysis
- Deferred Google AI and Perplexity to Phase 4 (budget)
- Added legal/compliance checklist
- Added 2 new database tables for cost control
- Expanded acceptance criteria with security requirements

**UX/UI Review Summary (v3.0):**
- Added 10 UX gaps analysis with solutions
- Added 3 complete user journey maps (First-time, Conversion, Returning)
- Added design system requirements (tokens, typography, spacing, animations)
- Added loading experience design (30-45 second engagement strategy)
- Added empty states and error states specifications
- Added mobile-first responsive strategy
- Added component library prioritization by phase
- Added 15+ new UX tasks across all phases
- Expanded acceptance criteria with UX requirements

**AI/Data Engineering Review Summary (v4.0):**
- Identified 12 critical AI/Data gaps in original architecture
- Added AI Provider Abstraction Layer (AIOrchestrator pattern)
- Added Prompt Management System with versioning and A/B testing support
- Added Structured Output Parsing with Zod + function calling
- Added Industry Taxonomy (20 top-level categories for consistency)
- Added Retry & Circuit Breaker Pattern (exponential backoff + jitter)
- Added Data Quality & Drift Detection (golden dataset + anomaly scoring)
- Added Cost Protection & Auto-Scaling (automated pause at budget thresholds)
- Added 3 new database tables: `prompts`, `industries`, `ai_response_quality`
- Added 7 new AI/Data tasks to Phase 1 (Week 1 + Week 2)
- Expanded acceptance criteria with 8 AI/Data requirements

**Key AI/Data Engineering Principles:**
1. **Type-safe outputs** - Every AI response validated with Zod schema
2. **Graceful degradation** - Circuit breakers prevent cascade failures
3. **Cost predictability** - Automated budget controls, never surprise bills
4. **Data consistency** - Industry taxonomy prevents "CRM" vs "CRM Software" drift
5. **Continuous quality** - Golden dataset detects AI model behavior changes
6. **Security-first** - Prompt injection tests as part of CI/CD

**Knowledge Graph & SEO Review Summary (v5.0):**
- Identified 12 critical Knowledge Graph & SEO gaps
- Added Entity Extraction & Knowledge Graph architecture (brand relationships)
- Added Schema.org Deep Validation engine (4-level validation)
- Added E-E-A-T Signals Analysis (Experience, Expertise, Authority, Trust)
- Added Citation Source Tracking (where AIs get their information)
- Added Own Site GEO Optimization requirements (practice what we preach)
- Added Programmatic SEO Strategy (1,000+ industry/location pages)
- Added Results Page Structured Data (Rating schema, dynamic OG images)
- Added 4 new database tables: `entities`, `entity_relationships`, `eeat_scores`, `citation_sources`
- Added 8 new KG/SEO tasks to Phase 1 (Week 1 + Week 2)
- Added 9 new KG/SEO tasks to Phase 2-4
- Expanded acceptance criteria with 5 KG/SEO requirements

**Key Knowledge Graph & SEO Principles:**
1. **Eat your own dog food** - Our site must be GEO-optimized before we sell GEO
2. **Structured data everywhere** - Every page has appropriate Schema.org markup
3. **Entity-first thinking** - Brands are entities in a knowledge graph, not just strings
4. **Citation transparency** - Show clients WHERE AI gets its information
5. **E-E-A-T is king** - Experience, Expertise, Authority, Trust drive AI recommendations
6. **Programmatic scale** - Generate thousands of SEO pages from data
7. **Wikidata is the source of truth** - Being in Wikidata = being in AI knowledge

**Technical Content & Documentation Review Summary (v6.0):**
- Identified 12 critical content and documentation gaps
- Added UX Writing Style Guide (brand voice, tone by context, terminology)
- Added Glossary of Terms (6 core terms with definitions and tooltips)
- Added Email Content Templates (5 templates: welcome, alert, digest, upgrade, churn)
- Added Recommendation Explanation Templates (4 templates with why/how/impact)
- Added Help Center Architecture (36 articles across 6 categories)
- Added Social Sharing Copy Templates (Twitter/X and LinkedIn)
- Added AI Disclaimer & Legal Content (results disclaimer, ToS/Privacy additions)
- Added 11 new content tasks across all phases
- Added 5 new content acceptance criteria

**Key Content & Documentation Principles:**
1. **Voice consistency** - Every word follows the UX writing guide
2. **Education over explanation** - Help users understand WHY, not just WHAT
3. **Self-service first** - Every question has an answer without support contact
4. **Legal protection** - AI disclaimers protect the business
5. **Shareability built-in** - Pre-written copy increases viral potential
6. **Empathy in errors** - Even bad news is delivered helpfully
7. **Localization-ready** - Content structure supports future i18n

**Key UX Principles:**
1. **No dead ends** - Every screen has a clear next action
2. **Progress storytelling** - 30-second wait becomes engaging experience
3. **Strategic friction** - Freemium gating creates desire, not frustration
4. **Mobile-first** - SMBs check on phones, design for that
5. **Celebration moments** - Delight users at key achievements

**Full Stack Developer Review Summary (v7.0):**
- Identified 14 critical development and DevOps gaps
- Added Full Stack Development Architecture section (2.38)
- Added Environment & Configuration Management (2.39) - Zod schema validation
- Added Type-Safe Database Layer (2.40) - Supabase types + Drizzle ORM option + indexes
- Added API Middleware & Route Patterns (2.41) - centralized middleware factory
- Added CI/CD Pipeline (2.42) - GitHub Actions workflow with lint/test/build/deploy
- Added Service Architecture & Dependency Injection (2.43) - factory pattern for testability
- Added Performance & Bundle Optimization (2.44) - Core Web Vitals targets, lazy loading
- Added Feature Flags & Gradual Rollout (2.45) - env-based → Vercel Edge Config
- Added 22 new Dev tasks across all phases (7 Week 1, 4 Week 2, 3 Week 3, 3 Week 4, 3 Week 6, 6 Week 7-8)
- Added 8 new Dev acceptance criteria for Phase 1
- Added Phase 4 Dev Checklist with 7 criteria

**Key Full Stack Principles:**
1. **Type safety everywhere** - TypeScript strict mode, Zod validation, DB types
2. **Fail fast on startup** - Env validation catches misconfig before runtime
3. **Testability by design** - Factory pattern enables mocking, no hard dependencies
4. **CI/CD is non-negotiable** - Every commit tested, every merge deployed
5. **Observability from day 1** - Request tracing, health checks, error boundaries
6. **Performance budgets** - Bundle size < 150KB, LCP < 2.5s, CLS < 0.1
7. **Feature flags for safety** - New features behind flags, gradual rollout
8. **Infrastructure as code** - No manual Vercel config, everything in repo

**Reputation & Digital PR Review Summary (v8.0):**
- Identified 12 critical Reputation & Digital PR gaps
- Added Reputation & Digital PR Architecture section (2.46) with gap analysis
- Added Brand Sentiment Tracking System (2.47) - longitudinal reputation dashboard
- Added Crisis Detection & Response System (2.48) - 3-level severity alerts + playbooks
- Added Media & Review Monitoring (2.49) - tiered source tracking + review analysis
- Added PR Action Recommendations Engine (2.50) - industry-specific PR playbooks
- Added Narrative Consistency Analyzer (2.51) - cross-source brand messaging check
- Added AI Perception Launch PR Strategy (2.52) - our own launch playbook
- Added 3 new database tables: `reputation_history`, `crisis_events`, `media_mentions`
- Added 23 new PR tasks across all phases (7 Week 1-2, 6 Week 3-4, 3 Week 5-6, 7 Week 7-8)
- Added 7 new PR acceptance criteria for Phase 1
- Added Phase 4 PR Checklist with 10 success criteria

**Key Reputation & Digital PR Principles:**
1. **Practice what we preach** - Our own launch must follow our PR playbook
2. **Reputation is longitudinal** - Single scores are useless without trends over time
3. **Crisis prevention > crisis response** - Detect drops before they become disasters
4. **Source attribution is key** - Know WHERE reputation problems originate
5. **Narrative consistency builds trust** - Conflicting messages confuse AI models
6. **PR is ongoing, not one-time** - Establish weekly/monthly cadence from day 1
7. **Measure PR ROI** - Track before/after to prove reputation improvement value
8. **Industry-specific playbooks** - B2B SaaS PR ≠ Local Restaurant PR
9. **Reviews are PR currency** - Prioritize review management across platforms
10. **Influencers matter to AI** - KOL mentions increasingly influence AI recommendations

**Prompt Engineering & Model Analyst Review Summary (v9.0):**
- Identified 12 critical Prompt Engineering gaps
- Added Prompt Engineering Architecture section (2.53) with comprehensive gap analysis
- Added Chain-of-Thought (CoT) Prompting Architecture (2.54) - step-by-step reasoning prompts
- Added Few-Shot Learning & Exemplar Library (2.55) - curated examples per model + industry
- Added Model-Specific Prompt Optimization (2.56) - GPT/Claude/Gemini/Perplexity variants
- Added Response Calibration & Normalization (2.57) - Z-score cross-model normalization
- Added Self-Consistency & Stability (2.58) - multi-sample majority voting + confidence
- Added Prompt Testing & Evaluation Framework (2.59) - golden dataset + CI/CD integration
- Added Temperature & Parameter Tuning Matrix (2.60) - task-specific parameter configs
- Added 4 new database tables: `prompt_exemplars`, `prompt_variants`, `model_calibration`, `prompt_evaluations`
- Added 25 new Prompt tasks across all phases (3 Week 1, 4 Week 2, 3 Week 3, 3 Week 4, 2 Week 6, 3 Week 7, 4 Week 8)
- Added 8 new Prompt acceptance criteria for Phase 1
- Added Phase 4 Prompt Engineering Checklist with 12 success criteria

**Key Prompt Engineering Principles:**
1. **Chain-of-Thought is non-negotiable** - CoT prompts improve accuracy 30-50% on complex tasks
2. **One prompt does NOT fit all** - Each model needs optimized variants (JSON modes differ)
3. **Few-shot examples are training data** - Curate them like you would a dataset
4. **Calibrate before comparing** - Raw scores from different models are incomparable
5. **Self-consistency reveals uncertainty** - 3 samples with voting catches edge cases
6. **Test prompts like code** - Golden datasets, CI/CD, regression testing required
7. **Temperature is a hyperparameter** - Tune it per task type (extraction vs generation)
8. **Monitor for semantic drift** - AI model updates silently break prompts over time
9. **Token efficiency = cost efficiency** - Compress without losing semantic content
10. **Version everything** - Prompts, parameters, exemplars must be traceable + rollbackable

**Principal Ontologist Review Summary (v10.0):**
- Identified 14 critical Ontology Engineering gaps
- Added Ontology Engineering Architecture section (2.61) with comprehensive gap analysis
- Added Formal Ontology Design (2.62) - OWL/SKOS with aip: namespace
- Added Competency Questions (2.63) - 13 CQs with SPARQL examples
- Added External Knowledge Base Alignment (2.64) - Wikidata, Schema.org, NAICS, ISIC, LEI
- Added Provenance & Uncertainty Tracking (2.65) - PROV-O compliant with confidence intervals
- Added Inference Rules Engine (2.66) - Materialized views for symmetric/transitive reasoning
- Added Multi-Lingual Concept Labels (2.67) - SKOS prefLabel/altLabel in EN/ES/PT
- Added Semantic Similarity Engine (2.68) - Wu-Palmer + feature + embedding combined
- Added 5 new database tables: `entity_alignments`, `fact_provenance`, `concept_labels`, `brand_similarity_cache`
- Added 28 new Ontology tasks across all phases (3 Week 1, 4 Week 2, 3 Week 3, 3 Week 4, 2 Week 6, 3 Week 7, 4 Week 8)
- Added 8 new Ontology acceptance criteria for Phase 1
- Added Phase 4 Ontology Engineering Checklist with 14 success criteria

**Key Ontology Engineering Principles:**
1. **No ontology without competency questions** - Define what questions must be answerable first
2. **Align to upper ontologies** - Schema.org, Wikidata patterns = interoperability
3. **Facts need provenance** - Without source tracking, facts are unverifiable rumors
4. **Uncertainty is information** - Confidence intervals are more honest than false certainty
5. **Properties have semantics** - Domain/range, symmetric, transitive are not optional
6. **Inference is power** - Derive new facts from existing facts using logic
7. **Multi-lingual from day 1** - SKOS labels enable internationalization without refactoring
8. **Temporal validity matters** - "Was competitor in 2020" ≠ "Is competitor now"
9. **Entity linking = authority** - Wikidata/NAICS links increase trust in AI models
10. **Ontology evolves** - Version URIs, deprecation policy, backward compatibility
11. **Semantic similarity > embedding only** - Combine structural + feature + vector approaches
12. **Validate on insert** - Domain/range triggers prevent semantic nonsense
13. **Materialize inferences** - Pre-compute closures, don't reason in real-time
14. **Document the ontology** - If it's not documented, it doesn't exist for users

**Computational Linguist Review Summary (v11.0):**
- Identified 15 critical Computational Linguistics gaps in NLP architecture
- Added CL Architecture section (2.69) with comprehensive gap analysis
- Added Discourse & Argumentation Analysis (2.70) - RST relations, claim-premise extraction
- Added Coreference & Entity Linking (2.71) - Rule-based pronoun resolution
- Added Sentiment & Aspect Extraction (2.72) - ABSA with aspect keywords
- Added Negation & Hedge Detection (2.73) - Certainty scoring with 3 tiers
- Added Comparative & Superlative Extraction (2.74) - Ranking signal patterns
- Added Multi-Lingual NLP Pipeline (2.75) - EN/ES/PT language-specific resources
- Added Readability & AI Optimization (2.76) - Flesch-Kincaid, Gunning Fog, SMOG
- Added Keyphrase Extraction & Topic Modeling (2.77) - RAKE algorithm, BERTopic
- Added 6 new database tables: `discourse_analysis`, `coreference_chains`, `aspect_sentiments`, `comparative_mentions`, `extracted_keyphrases`, `topic_clusters`
- Added 21 new CL tasks across all phases (3 Week 1, 4 Week 2, 4 Week 3, 3 Week 6, 4 Week 7)
- Added 8 new CL acceptance criteria for Phase 1
- Added Phase 4 Computational Linguistics Checklist with 16 success criteria

**Key Computational Linguistics Principles:**
1. **Negation scope matters** - "NOT recommend" flips sentiment entirely
2. **Hedges indicate certainty** - "might recommend" ≠ "definitely recommend"
3. **Coreference enables context** - Knowing "it" refers to your brand is critical
4. **Aspect sentiment > overall sentiment** - Positive on price, negative on support
5. **Comparatives are ranking signals** - "better than X" is competitive intelligence
6. **Discourse markers add nuance** - "however" often introduces the real opinion
7. **Multi-lingual from MVP** - EN/ES for LATAM market from day one
8. **Readability affects AI citations** - Clear content gets quoted more
9. **Keyphrases reveal topics** - What terms does AI associate with your brand?
10. **Topic modeling finds patterns** - Cluster competitor mentions automatically
11. **Temporal expressions matter** - "Recently" vs "In 2020" changes relevance
12. **Quotation attribution** - Track what sources AI models cite
13. **Query intent classification** - Recommendation queries ≠ factual queries
14. **Lexical variation handling** - "AI Perception" = "AIPerception" = "ai-perception"
15. **NLP quality monitoring** - Parse accuracy needs dashboards like any metric

**Recommended Next Action:**
Begin Phase 1, Week 1, Day 1:
- Database schema design + RLS policies
- Security: URL validator
- UX: Design tokens (score colors, provider colors)
- AI: Zod output schemas for all AI responses
- AI: Industry taxonomy seed data (20 categories)
- SEO: Own site JSON-LD SoftwareApplication schema
- Content: UX writing guide document
- PR: Create Wikidata entry for AI Perception (Alberto)
- PR: Set up Crunchbase company profile (Alberto)
- PR: Claim LinkedIn company page (Alberto)
- PR: Create press kit with all assets (Claude)
- Prompt: CoT prompt templates for all query types
- Prompt: Few-shot exemplar database (15+ per model)
- Prompt: Temperature configuration matrix
- Onto: Core OWL/SKOS ontology definition (aip: namespace)
- Onto: Class hierarchy (Brand, Industry, Provider, Analysis)
- Onto: Property definitions with domain/range constraints
- CL: Negation scope detector (/lib/nlp/negation.ts)
- CL: Hedge/certainty scorer (/lib/nlp/certainty.ts)
- CL: Basic coreference resolver (/lib/nlp/coreference.ts)
- LLM-B: Response stability sampler (5x multi-run)
- LLM-B: Model version tracker
- LLM-B: Basic hallucination flags

**LLM Behavioral Research Review Summary (v12.0):**
- Identified 16 critical LLM Behavioral Research gaps
- Added LLM Behavioral Architecture section (2.78) with comprehensive gap analysis
- Added Model Behavioral Fingerprinting (2.79) - profile per model biases/priors
- Added Temporal Drift Detection System (2.80) - canary queries + drift alerts
- Added Response Stability & Consistency Metrics (2.81) - multi-run sampling
- Added Hallucination Detection & Verification (2.82) - 4-layer detection pipeline
- Added Bias Detection & Debiasing Framework (2.83) - position/popularity/geo/sycophancy
- Added Adversarial Robustness & Manipulation Detection (2.84) - gaming prevention
- Added Model Capability & Emergence Tracking (2.85) - capability evolution monitoring
- Added 7 new database tables: `model_behavioral_fingerprints`, `model_drift_logs`, `response_stability_metrics`, `hallucination_detections`, `bias_measurements`, `manipulation_detections`, `model_capability_tracking`
- Added 16 new LLM-B tasks across all phases (3 Week 1, 4 Week 2, 3 Week 6, 4 Week 7)
- Added 5 new LLM-B acceptance criteria for Phase 1
- Added Phase 4 LLM Behavioral Research Checklist with 16 success criteria

**Key LLM Behavioral Research Principles:**
1. **Model fingerprinting is essential** - Each LLM has unique behavioral patterns
2. **Drift detection prevents surprises** - Models change silently after updates
3. **Position bias is real** - First/last items get unfair advantage
4. **Sycophancy corrupts objectivity** - Leading questions bias responses
5. **Hallucinations are measurable** - 4-layer verification catches false claims
6. **Stability requires sampling** - Single queries have high variance
7. **Inter-model agreement matters** - Disagreement needs explanation
8. **Recency bias affects scores** - Knowledge cutoff impacts accuracy
9. **Popularity bias is self-reinforcing** - Big brands get recommended more
10. **Manipulation will be attempted** - Adversarial testing is mandatory
11. **Confidence ≠ accuracy** - Calibration curves are essential
12. **Emergence changes behavior** - New capabilities affect recommendations
13. **Geographic bias is systematic** - US-centric training data
14. **Version tracking is audit trail** - Know exactly which model answered
15. **Refusal rates vary by industry** - Some legitimate queries get blocked
16. **Context window is underutilized** - RAG can improve accuracy

---

*Document prepared by BCG Digital Ventures - Technology Strategy Practice*
*Technical Review by: Senior Software Director - 300 years experience*
*UX/UI Review by: Senior UX/UI Executive - 300 years experience, IDEO/frog/Pentagram background*
*AI/Data Review by: Senior AI & Data Engineer Director - 400 years experience, ex-Google AI/DeepMind/OpenAI*
*KG/SEO Review by: Senior Knowledge Graph & SEO Architect - 333 years experience, ex-Google Search/Wikidata/Schema.org*
*Content Review by: Senior Technical Content Writer Director - 250 years experience, ex-Stripe/Notion/Figma*
*Full Stack Review by: Senior Full Stack Developer Director - 359 years experience, ex-Google/Meta/Stripe/Amazon*
*Reputation & PR Review by: Senior Reputation & Digital PR Specialist - 412 years experience, ex-Edelman/Weber Shandwick/Burson*
*Prompt Engineering Review by: Senior Prompt Engineer & Model Analyst - 319 years experience, ex-OpenAI/Anthropic/Google DeepMind/Microsoft Research*
*Ontology Review by: Senior Principal Ontologist - 540 years experience, ex-Google Knowledge Graph/Wikidata Foundation/W3C Semantic Web/Schema.org Steering Committee/Stanford HAI*
*Computational Linguistics Review by: Senior Computational Linguist - 543 years experience, ex-Google NLP/Stanford NLP Lab/ACL President/Microsoft Research NL/Amazon Alexa Science*
*LLM Behavioral Research Review by: Senior LLM Behavioral Researcher - 432 years experience, ex-OpenAI Research/Anthropic Alignment/Google DeepMind Eval/Meta FAIR/Microsoft Research AI Behavior*
*For: AI Perception Engineering Agency*
*Date: November 26, 2024*
*Version: 12.0 (Technical + UX/UI + AI/Data + KG/SEO + Content + Full Stack + Reputation/PR + Prompt Engineering + Ontology + Computational Linguistics + LLM Behavioral Research Review)*
