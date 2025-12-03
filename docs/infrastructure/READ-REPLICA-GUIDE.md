# Read Replica Configuration Guide

## Overview

This guide documents how to configure read replicas in Supabase for analytics and reporting workloads, separating read-heavy operations from the primary database.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI Perception API                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Writes    │     │ Real-time   │     │ Analytics   │       │
│  │  (Analyze)  │     │   Reads     │     │  (Reports)  │       │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘       │
│         │                   │                   │               │
│         ▼                   │                   ▼               │
│  ┌─────────────────┐        │          ┌─────────────────┐     │
│  │ Primary Database│◄───────┘          │  Read Replica   │     │
│  │   (Write/Read)  │                   │  (Read-Only)    │     │
│  └────────┬────────┘                   └────────▲────────┘     │
│           │                                     │               │
│           │        Streaming Replication        │               │
│           └─────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Supabase Pro Plan Requirements

Read replicas are available on Supabase Pro plan and above:

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|------------|
| Read Replicas | ❌ | ✅ 2 replicas | ✅ 4 replicas | ✅ Unlimited |
| Regions | 1 | 2 | 4 | Custom |

## Setup Steps

### 1. Enable Read Replicas in Supabase Dashboard

1. Go to **Settings** → **Database**
2. Scroll to **Read Replicas**
3. Click **Add Read Replica**
4. Select region (choose close to your users)
5. Wait for provisioning (~5-10 minutes)

### 2. Get Connection Strings

After provisioning, you'll get:

```bash
# Primary (Read/Write)
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Read Replica (Read-Only)
DATABASE_URL_REPLICA="postgresql://postgres:[password]@db.[project-ref]-replica-0.supabase.co:5432/postgres"
```

### 3. Configure Environment Variables

Add to `.env.local` and Vercel:

```bash
# Primary database (writes + real-time reads)
DATABASE_URL="postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."

# Read replica (analytics, reports, dashboards)
DATABASE_URL_REPLICA="postgresql://postgres:password@db.xxxx-replica-0.supabase.co:5432/postgres"
```

### 4. Implement Connection Routing

Create a database router:

```typescript
// src/lib/db/router.ts

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export type ConnectionType = 'primary' | 'replica';

/**
 * Get the appropriate database connection
 */
export function getConnection(type: ConnectionType = 'primary') {
  const isPrimary = type === 'primary';

  // Use replica for read-only operations
  const url = isPrimary
    ? process.env.NEXT_PUBLIC_SUPABASE_URL!
    : process.env.SUPABASE_REPLICA_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createSupabaseClient(url, key, {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get primary connection for writes
 */
export function getPrimaryConnection() {
  return getConnection('primary');
}

/**
 * Get replica connection for analytics/reports
 */
export function getReplicaConnection() {
  return getConnection('replica');
}
```

### 5. Use in Analytics Services

```typescript
// src/lib/analytics/reports.ts

import { getReplicaConnection } from '@/lib/db/router';

export async function generateDailyReport(date: Date) {
  // Use read replica for heavy analytics
  const db = getReplicaConnection();

  const { data, error } = await db
    .from('analyses')
    .select(`
      id,
      url,
      overall_score,
      created_at,
      ai_responses(provider, score)
    `)
    .gte('created_at', date.toISOString())
    .lt('created_at', new Date(date.getTime() + 86400000).toISOString());

  return { data, error };
}
```

### 6. Configure for Admin Dashboards

```typescript
// src/app/admin/analytics/page.tsx

import { getReplicaConnection } from '@/lib/db/router';

export default async function AnalyticsPage() {
  // Heavy analytics queries go to replica
  const db = getReplicaConnection();

  const [
    { data: dailyStats },
    { data: providerPerformance },
    { data: userMetrics },
  ] = await Promise.all([
    db.rpc('get_daily_analysis_stats'),
    db.rpc('get_provider_performance_30d'),
    db.rpc('get_user_engagement_metrics'),
  ]);

  return (
    // Dashboard UI
  );
}
```

## Query Routing Strategy

| Operation | Connection | Reason |
|-----------|------------|--------|
| Create analysis | Primary | Write operation |
| Get analysis by ID | Primary | Needs fresh data |
| List user analyses | Primary | User expects updates |
| Admin dashboard metrics | Replica | Heavy aggregation |
| Export reports | Replica | Large data scans |
| Historical trends | Replica | Old data, can lag |
| Real-time monitoring | Primary | Needs fresh data |

## Replication Lag Handling

### Check Replication Lag

```sql
-- Run on replica to check lag
SELECT
  CASE
    WHEN pg_is_in_recovery() THEN
      EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
    ELSE 0
  END AS replication_lag_seconds;
```

### Handle Lag in Application

```typescript
// src/lib/db/replica-aware.ts

const MAX_ACCEPTABLE_LAG_SECONDS = 5;

export async function queryWithLagCheck<T>(
  queryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>
): Promise<T> {
  try {
    // Check replica lag
    const { data: lagData } = await getReplicaConnection()
      .rpc('check_replication_lag');

    const lagSeconds = lagData?.[0]?.lag_seconds ?? 0;

    if (lagSeconds > MAX_ACCEPTABLE_LAG_SECONDS) {
      console.warn(`Replica lag too high (${lagSeconds}s), using primary`);
      return fallbackFn();
    }

    return queryFn();
  } catch (error) {
    console.error('Replica query failed, falling back to primary:', error);
    return fallbackFn();
  }
}
```

## Monitoring

### Metrics to Track

1. **Replication Lag** - Should be < 1 second normally
2. **Query Distribution** - % queries going to replica
3. **Replica CPU/Memory** - Monitor for capacity
4. **Connection Pool Usage** - Watch for exhaustion

### Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Replication Lag | > 5s | > 30s |
| Replica CPU | > 70% | > 90% |
| Connection Pool | > 80% | > 95% |

## Cost Considerations

| Region | Compute | Storage | Total/Month |
|--------|---------|---------|-------------|
| Same region | ~$25 | Shared | ~$25 |
| Different region | ~$25 | ~$10 | ~$35 |

## Failover Procedure

If the read replica fails:

1. **Automatic Fallback** - Code should fall back to primary
2. **Manual Intervention** - If primary is overwhelmed:
   - Scale up primary compute
   - Enable connection pooling
   - Add caching layer (Redis)

## Best Practices

1. **Always use replica for**:
   - Admin dashboards
   - Report generation
   - Data exports
   - Historical analytics

2. **Always use primary for**:
   - Write operations
   - Real-time data needs
   - User-facing reads that need consistency

3. **Connection pooling**:
   - Use Supabase connection pooler
   - Set `?pgbouncer=true` for serverless

4. **Monitor regularly**:
   - Set up lag alerts
   - Track query distribution
   - Watch for capacity issues

## Checklist

- [ ] Supabase Pro plan enabled
- [ ] Read replica provisioned
- [ ] Environment variables configured
- [ ] Connection router implemented
- [ ] Analytics queries using replica
- [ ] Lag handling implemented
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Failover tested
