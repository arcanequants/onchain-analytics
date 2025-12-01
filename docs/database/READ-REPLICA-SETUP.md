# Read Replica Setup for Analytics

**Document Version:** 1.0
**Last Updated:** 2025-01-30
**Owner:** Engineering / DevOps

---

## Overview

This document describes the read replica configuration for offloading analytics queries from the primary database, ensuring optimal performance for both transactional workloads and reporting.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Application   │     │    Analytics    │
│    (Writes)     │     │   (Reads Only)  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│    Primary DB   │────▶│  Read Replica   │
│   (us-east-1)   │     │   (us-east-1)   │
│                 │     │                 │
│  - Writes       │     │  - Analytics    │
│  - Transactions │     │  - Reports      │
│  - Auth         │     │  - Dashboards   │
└─────────────────┘     └─────────────────┘
         │
         │ Streaming Replication
         ▼
```

## Configuration

### Supabase Pro Plan Setup

1. **Enable Read Replica** in Supabase Dashboard:
   - Navigate to Project Settings → Database
   - Enable "Read Replicas" (Pro plan required)
   - Select region (same as primary recommended)

2. **Connection String**:
   ```
   # Primary (read-write)
   DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

   # Read Replica (read-only)
   DATABASE_REPLICA_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres?options=-c%20default_transaction_read_only%3Don
   ```

### Environment Variables

```env
# Primary database (default)
DATABASE_URL="postgresql://..."

# Read replica for analytics
DATABASE_REPLICA_URL="postgresql://..."

# Feature flag to enable replica usage
ENABLE_READ_REPLICA=true
```

## Implementation

### Database Client Configuration

```typescript
// src/lib/database/replica.ts
import { createClient } from '@supabase/supabase-js';

// Primary client for writes
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Replica client for analytics (read-only)
export const supabaseReplica = process.env.DATABASE_REPLICA_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-connection-pool': 'replica',
          },
        },
      }
    )
  : supabase; // Fallback to primary if no replica

// Helper to get appropriate client
export function getClient(options: { readonly?: boolean } = {}) {
  if (options.readonly && process.env.ENABLE_READ_REPLICA === 'true') {
    return supabaseReplica;
  }
  return supabase;
}
```

### Query Routing

```typescript
// src/lib/analytics/queries.ts
import { getClient } from '@/lib/database/replica';

// Analytics queries use read replica
export async function getAnalyticsReport(dateRange: DateRange) {
  const client = getClient({ readonly: true });

  const { data, error } = await client
    .from('analyses')
    .select(`
      id,
      brand_name,
      overall_score,
      created_at,
      industry,
      provider_scores
    `)
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Dashboard aggregations
export async function getDashboardMetrics() {
  const client = getClient({ readonly: true });

  const { data, error } = await client.rpc('get_dashboard_metrics');

  if (error) throw error;
  return data;
}
```

### Write Operations (Primary Only)

```typescript
// src/lib/analysis/service.ts
import { getClient } from '@/lib/database/replica';

// Writes always use primary
export async function saveAnalysis(analysis: Analysis) {
  const client = getClient({ readonly: false }); // Explicit primary

  const { data, error } = await client
    .from('analyses')
    .insert(analysis)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

## Query Classification

### Use Read Replica For:

| Query Type | Example | Latency Tolerance |
|------------|---------|-------------------|
| Analytics dashboards | User engagement metrics | High |
| Reports | Monthly analysis summary | High |
| Data exports | CSV exports | High |
| Leaderboards | Industry rankings | Medium |
| Historical data | Trend analysis | High |
| Admin metrics | RLHF statistics | Medium |

### Use Primary For:

| Query Type | Example | Reason |
|------------|---------|--------|
| Authentication | Login, session | Consistency |
| Analysis creation | New analysis | Writes |
| Feedback submission | User feedback | Writes |
| Real-time status | Analysis progress | Consistency |
| Billing operations | Subscription updates | ACID |

## Replication Lag Considerations

### Expected Lag

| Metric | Value |
|--------|-------|
| Average lag | < 100ms |
| P95 lag | < 500ms |
| P99 lag | < 1s |

### Handling Lag

```typescript
// For queries requiring fresh data
export async function getRecentAnalysis(userId: string) {
  // Check if we need fresh data (within replication window)
  const client = getClient({ readonly: false }); // Use primary

  const { data } = await client
    .from('analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}

// For analytics that can tolerate lag
export async function getAnalyticsSummary(userId: string) {
  const client = getClient({ readonly: true }); // Use replica

  const { data } = await client
    .from('analyses')
    .select('overall_score, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return data;
}
```

## Monitoring

### Replication Lag Alert

```sql
-- Check replication lag (run on primary)
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  (sent_lsn - replay_lsn) AS lag_bytes
FROM pg_stat_replication;
```

### Grafana Dashboard Metrics

```yaml
# metrics to monitor
- replica_lag_seconds
- replica_connection_status
- queries_per_second_primary
- queries_per_second_replica
- connection_pool_utilization
```

## Failover Strategy

### Automatic Failover

Supabase handles automatic failover for read replicas:

1. **Replica Failure**: Queries automatically routed to primary
2. **Primary Failure**: Replica promoted automatically

### Manual Fallback

```typescript
// src/lib/database/replica.ts
export async function getClientWithFallback(options: { readonly?: boolean } = {}) {
  if (options.readonly && process.env.ENABLE_READ_REPLICA === 'true') {
    try {
      // Test replica connection
      const { error } = await supabaseReplica.from('health_check').select('1');
      if (!error) return supabaseReplica;
    } catch {
      console.warn('Replica unavailable, falling back to primary');
    }
  }
  return supabase;
}
```

## Cost Optimization

### Query Distribution

| Query Type | Primary | Replica | Monthly Savings |
|------------|---------|---------|-----------------|
| Analytics | 0% | 100% | ~40% |
| Reports | 0% | 100% | ~40% |
| Writes | 100% | 0% | - |
| Auth | 100% | 0% | - |
| **Total** | ~30% | ~70% | **~30%** |

### Connection Pooling

```env
# Primary pool
DATABASE_POOL_SIZE=10
DATABASE_POOL_MAX=25

# Replica pool (analytics heavy)
REPLICA_POOL_SIZE=20
REPLICA_POOL_MAX=50
```

## Migration Guide

### Step 1: Enable Replica

```bash
# Via Supabase CLI
supabase db replica create --region us-east-1
```

### Step 2: Update Environment

```bash
# Add to .env.production
DATABASE_REPLICA_URL="..."
ENABLE_READ_REPLICA=true
```

### Step 3: Deploy Code

```bash
# Gradual rollout
1. Deploy replica client code
2. Enable for 10% of analytics traffic
3. Monitor for issues
4. Increase to 50%, then 100%
```

### Step 4: Verify

```sql
-- Check query distribution
SELECT
  usename,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = 'postgres';
```

## Troubleshooting

### High Replication Lag

1. Check network latency between regions
2. Review heavy write operations
3. Increase replica resources

### Connection Issues

1. Verify connection string format
2. Check SSL certificate validity
3. Review connection pool settings

### Data Inconsistency

1. Verify query routing logic
2. Check replication lag metrics
3. Review transaction isolation levels

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-30 | Engineering | Initial version |

**Next Review:** 2025-07-30
