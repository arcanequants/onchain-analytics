# AI PERCEPTION ENGINEERING AGENCY
## Executive Strategic Roadmap

**Document Classification:** Strategic Planning
**Version:** 4.0 (Technical + UX/UI + AI/Data Review)
**Date:** November 25, 2024
**Prepared by:** BCG Digital Ventures - Technology Strategy Practice
**Reviewed by:**
- Senior Software Director - Technical Architecture Review
- Senior UX/UI Executive - User Experience & Interface Review
- Senior AI & Data Engineer Director - AI/ML & Data Pipeline Review

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
| 4 | Competitor comparison | Side-by-side score comparison | Claude |
| 4 | Enhanced recommendations | AI-generated actionable recommendations | Claude |
| 5 | Performance optimization | Parallel AI queries, timeout handling | Claude |
| 5 | **Cost dashboard (internal)** | Admin view of daily API costs | Claude |

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

#### Week 8: Optimization & Documentation

| Day | Activity | Deliverable | Owner |
|-----|----------|-------------|-------|
| 1 | Performance audit | Identify and fix bottlenecks | Claude |
| 1 | Cost optimization | Further reduce API costs | Claude |
| 2 | SEO optimization | Meta tags, structured data, sitemap | Claude |
| 2 | GEO optimization | Make AI recommend US! | Claude |
| 3 | Error monitoring | Sentry integration, alerting | Claude |
| 3 | User feedback system | In-app feedback collection | Claude |
| 4 | Documentation | User docs, API docs | Claude |
| 4 | Onboarding flow | First-time user experience | Claude |
| 5 | Launch retrospective | Document learnings, next steps | Both |

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

**Key UX Principles:**
1. **No dead ends** - Every screen has a clear next action
2. **Progress storytelling** - 30-second wait becomes engaging experience
3. **Strategic friction** - Freemium gating creates desire, not frustration
4. **Mobile-first** - SMBs check on phones, design for that
5. **Celebration moments** - Delight users at key achievements

**Recommended Next Action:**
Begin Phase 1, Week 1, Day 1:
- Database schema design + RLS policies
- Security: URL validator
- UX: Design tokens (score colors, provider colors)
- AI: Zod output schemas for all AI responses
- AI: Industry taxonomy seed data (20 categories)

---

*Document prepared by BCG Digital Ventures - Technology Strategy Practice*
*Technical Review by: Senior Software Director - 300 years experience*
*UX/UI Review by: Senior UX/UI Executive - 300 years experience, IDEO/frog/Pentagram background*
*AI/Data Review by: Senior AI & Data Engineer Director - 400 years experience, ex-Google AI/DeepMind/OpenAI*
*For: AI Perception Engineering Agency*
*Date: November 25, 2024*
*Version: 4.0 (Technical + UX/UI + AI/Data Review)*
