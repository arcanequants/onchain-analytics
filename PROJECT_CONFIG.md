# 🚨 PROJECT CONFIGURATION - READ FIRST 🚨

**ALWAYS CHECK THIS FILE BEFORE RUNNING ANY COMMAND**

---

## Project Information

| Property | Value |
|----------|-------|
| **Project Name** | Onchain Analytics |
| **Repository** | arcanequants/onchain-analytics |
| **Production URL** | https://www.vectorialdata.com |
| **Vercel Project ID** | prj_pQLaGTCD6fgF8JDWxWUWpAPPBZB4 |
| **Vercel Project Name** | app |
| **Database** | Supabase (xkrkqntnpzkwzqkbfyex) |

---

## ⚠️ IMPORTANT: URLs to Use

### ✅ CORRECT URLs (USE THESE):
- Production: `https://www.vectorialdata.com`
- Vercel: `https://app-arcanequants-projects.vercel.app` (auto-generated)
- API Base: `https://www.vectorialdata.com/api`

### ❌ WRONG URLs (DO NOT USE):
- ~~https://crypto-lotto-six.vercel.app~~ (DIFFERENT PROJECT!)
- ~~https://cryptolotto.app~~ (DIFFERENT PROJECT!)

---

## API Endpoints

### CRON Jobs (use vectorialdata.com):
```bash
# TVL Collection
curl -X GET "https://www.vectorialdata.com/api/cron/collect-tvl" \
  -H "Authorization: Bearer L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI="

# DEX Collection
curl -X GET "https://www.vectorialdata.com/api/cron/collect-dex" \
  -H "Authorization: Bearer L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI="

# Gas Collection
curl -X GET "https://www.vectorialdata.com/api/cron/collect-gas" \
  -H "Authorization: Bearer L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI="

# Prices Collection
curl -X GET "https://www.vectorialdata.com/api/cron/collect-prices" \
  -H "Authorization: Bearer L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI="

# Fear & Greed Collection
curl -X GET "https://www.vectorialdata.com/api/cron/collect-fear-greed" \
  -H "Authorization: Bearer L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI="

# Events Collection
curl -X GET "https://www.vectorialdata.com/api/cron/collect-events" \
  -H "Authorization: Bearer L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI="

# Cleanup Old Data (runs daily at 2 AM)
curl -X GET "https://www.vectorialdata.com/api/cron/cleanup-old-data" \
  -H "Authorization: Bearer L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI="
```

### Public API Endpoints:
```bash
# TVL Data
curl "https://www.vectorialdata.com/api/tvl?chain=all&limit=10"

# DEX Data
curl "https://www.vectorialdata.com/api/dex?chain=all&limit=10"

# Gas Data
curl "https://www.vectorialdata.com/api/gas"

# Prices Data
curl "https://www.vectorialdata.com/api/prices?limit=10"
```

---

## Supabase Configuration

| Property | Value |
|----------|-------|
| **Project ID** | xkrkqntnpzkwzqkbfyex |
| **Dashboard** | https://supabase.com/dashboard/project/xkrkqntnpzkwzqkbfyex |
| **Database Host** | db.xkrkqntnpzkwzqkbfyex.supabase.co |
| **Database Port** | 5432 |
| **Database User** | postgres |
| **Database Password** | muxmos-toxqoq-8dyCfi |

---

## Vercel Configuration

| Property | Value |
|----------|-------|
| **Access Token** | KlnUFDSXZt2fNFse7QFs5OG9 |
| **Project ID** | prj_pQLaGTCD6fgF8JDWxWUWpAPPBZB4 |
| **Team ID** | team_7jDtAKalGLbMoub2ZnOejvLI |
| **CRON Secret** | L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI= |

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xkrkqntnpzkwzqkbfyex.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcmtxbnRucHprd3pxa2JmeWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDgzNzMsImV4cCI6MjA3ODkyNDM3M30.szioW9K48P4KKw_BmhmH-Kj7mNGZekEB2WFv1bM317M
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcmtxbnRucHprd3pxa2JmeWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM0ODM3MywiZXhwIjoyMDc4OTI0MzczfQ.MP3KudtKW2fiIOM0TxR-bhxtihi3k4z0vnyf7_NS_4c

# CRON
CRON_SECRET=L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI=

# APIs
NEXT_PUBLIC_COINGECKO_API_KEY=(if needed)
```

---

## 🚨 BEFORE RUNNING ANY COMMAND, ASK:

1. ✅ Am I using **www.vectorialdata.com**?
2. ✅ Am I using **Vercel Project ID: prj_pQLaGTCD6fgF8JDWxWUWpAPPBZB4**?
3. ✅ Am I using **Supabase Project: fjxbuyxephlfoivcpckd**?

If the answer to ANY of these is NO, STOP and check this file again.

---

## Recent Deployments

- **2025-01-19**: TVL tracking feature deployed
- **2025-01-19**: DEX tracking feature deployed
- **Production URL**: https://www.vectorialdata.com

---

**REMEMBER: This is NOT crypto-lotto-six. This is onchain-analytics (vectorialdata.com)**
