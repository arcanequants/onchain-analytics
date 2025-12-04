# VECTORIALDATA - AI Perception Engineering Platform

## CRITICAL: This is NOT a crypto/wallet project!

```
┌─────────────────────────────────────────────────────────────────┐
│  PROJECT: VectorialData (AI Perception Engineering)             │
│  DOMAIN: vectorialdata.com                                      │
│  PURPOSE: Analyze how AI models perceive brands                 │
│  Supabase Project ID: xkrkqntnpzkwzqkbfyex                      │
│  Vercel Project ID: prj_pQLaGTCD6fgF8JDWxWUWpAPPBZB4            │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️  NO crypto/wallet/token/gas/tvl tables belong here!         │
│  ⚠️  DO NOT USE: fjxbuyxephlfoivcpckd (crypto-lotto project)    │
└─────────────────────────────────────────────────────────────────┘
```

## What VectorialData Does

- Analyzes how ChatGPT, Perplexity, Claude, etc. perceive brands
- Scores brand visibility in AI responses
- Tracks competitors mentioned by AI
- Provides recommendations to improve AI perception

## Database Tables (AI Perception ONLY)

| Table | Purpose |
|-------|---------|
| `user_profiles` | User accounts and subscription info |
| `industries` | Industry taxonomy (SaaS, Healthcare, etc.) |
| `analyses` | Brand analysis records |
| `ai_responses` | Individual AI provider responses |
| `competitors` | Competitors detected per analysis |
| `recommendations` | Actionable insights |
| `ai_subscriptions` | Stripe billing |
| `usage_tracking` | Monthly usage per user |
| `hallucination_reports` | AI accuracy tracking |
| `api_cost_tracking` | Daily cost monitoring |
| `daily_cost_summary` | Aggregated daily costs |
| `user_feedback` | RLHF feedback |
| `score_corrections` | Score corrections |
| `preference_pairs` | Preference pairs for training |
| `calibration_data` | Calibration metrics |

## Supabase Configuration

| Property | Value |
|----------|-------|
| Project ID | `xkrkqntnpzkwzqkbfyex` |
| URL | `https://xkrkqntnpzkwzqkbfyex.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/xkrkqntnpzkwzqkbfyex |
| SQL Editor | https://supabase.com/dashboard/project/xkrkqntnpzkwzqkbfyex/sql/new |
| DB Host (Pooler) | `aws-0-us-west-1.pooler.supabase.com` |
| DB Port | `6543` |
| DB User | `postgres.xkrkqntnpzkwzqkbfyex` |
| DB Name | `postgres` |

## Vercel Configuration

| Property | Value |
|----------|-------|
| Project ID | `prj_pQLaGTCD6fgF8JDWxWUWpAPPBZB4` |
| Production URL | https://vectorialdata.com |
| Dashboard | https://vercel.com/arcanequants-projects/app |

## GitHub Configuration

| Property | Value |
|----------|-------|
| Repository | `arcanequants/onchain-analytics` |
| URL | https://github.com/arcanequants/onchain-analytics |

## Environment Variables Location

- Development: `.env.local`
- Production: Vercel Environment Variables

## Scripts

All migration scripts use `scripts/db-config.sh` which contains the correct credentials.

```bash
# Run any migration
./scripts/apply-rlhf-migration.sh
./scripts/apply-ai-perception-migration.sh
```

## WRONG Project (DO NOT USE)

The following is for a DIFFERENT project (crypto-lotto) - DO NOT USE HERE:

- ❌ `fjxbuyxephlfoivcpckd`
- ❌ `https://fjxbuyxephlfoivcpckd.supabase.co`
- ❌ `postgres.fjxbuyxephlfoivcpckd`
- ❌ Password: `Cryptolotto2025!`

## Tables that DO NOT belong here

These tables are from crypto projects and should NEVER be in VectorialData:

- ❌ wallet_balances, wallet_nfts, wallet_history, tracked_wallets
- ❌ token_prices, token_price_history, trending_coins
- ❌ gas_prices, gas_prices_hourly
- ❌ protocol_tvl, dex_volumes
- ❌ fear_greed_index
