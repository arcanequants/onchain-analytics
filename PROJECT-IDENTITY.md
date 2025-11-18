# 🆔 PROJECT IDENTITY

**⚠️ READ THIS FIRST - DO NOT CONFUSE WITH OTHER PROJECTS ⚠️**

## This Project

**Name:** OnChain Analytics / Vectorial Data
**Repository:** https://github.com/arcanequants/onchain-analytics
**Production URL:** https://vectorialdata.com
**Vercel Project ID:** `prj_TjGvY8Y0j2pCoE7O8amiBf7wZ8CP`
**Supabase URL:** `https://xkrkqntnpzkwzqkbfyex.supabase.co`
**Supabase Ref:** `xkrkqntnpzkwzqkbfyex`

## What This Project Does

Real-time blockchain analytics dashboard with:
- Gas price tracking (5 chains)
- Fear & Greed Index
- Event calendar
- Token prices (NEW - in development)
- DEX analytics
- Whale transactions
- NFT sales

## NOT This Project

This is **NOT** crypto-lotto (lottery application).
This is **NOT** any other project.

## Database

**Engine:** PostgreSQL (Supabase)
**Password:** `muxmos-toxqoq-8dyCfi`
**Tables:** 11 tables + 2 materialized views

## Environment Variables

All secrets are in `.env.local` (local) and Vercel (production).

Critical vars:
- `CRON_SECRET`: For CRON job authentication
- `SUPABASE_SERVICE_ROLE_KEY`: For server-side database writes
- `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public Supabase key

## Current Work (2025-01-18)

Implementing token price tracking feature:
- [x] Database migration (token_prices table)
- [x] CoinGecko API integration
- [x] CRON endpoint `/api/cron/collect-prices`
- [ ] **DEBUGGING:** CRON_SECRET not available in Edge Runtime middleware
- [ ] Fix rate limiting bypass for CRON jobs
- [ ] Test price collection
- [ ] Verify data in database

## Never Confuse With

- crypto-lotto (different Vercel project, different Supabase)
- Any other project in arcanequants organization

## When In Doubt

1. Check `pwd` - should be `/Users/albertosorno/onchain-analytics/app`
2. Check `.env.local` - Supabase URL should contain `xkrkqntnpzkwzqkbfyex`
3. Check `README.md` - should mention "Vectorial Data"
4. Check production URL - should be vectorialdata.com
