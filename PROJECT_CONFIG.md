# Onchain Analytics - Project Configuration

## CRITICAL: Project Identifiers

```
┌─────────────────────────────────────────────────────────────────┐
│  THIS PROJECT: onchain-analytics / vectorialdata.com            │
│  Supabase Project ID: xkrkqntnpzkwzqkbfyex                      │
│  Vercel Project ID: prj_pQLaGTCD6fgF8JDWxWUWpAPPBZB4            │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️  DO NOT USE: fjxbuyxephlfoivcpckd (this is crypto-lotto)    │
└─────────────────────────────────────────────────────────────────┘
```

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
./scripts/apply-tvl-migration.sh
./scripts/apply-token-prices-migration.sh
# etc.
```

## WRONG Project (DO NOT USE)

The following is for a DIFFERENT project (crypto-lotto):

- ❌ `fjxbuyxephlfoivcpckd`
- ❌ `https://fjxbuyxephlfoivcpckd.supabase.co`
- ❌ `postgres.fjxbuyxephlfoivcpckd`
- ❌ Password: `Cryptolotto2025!`
