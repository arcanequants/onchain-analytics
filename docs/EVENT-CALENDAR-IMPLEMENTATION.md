# Event Calendar Implementation Guide

## Overview

The Event Calendar feature tracks important cryptocurrency events including token unlocks, airdrops, listings, mainnet launches, network upgrades, halvings, hard forks, and conferences.

## Architecture

### Database Schema

Uses the `events` table defined in `supabase/schema.sql`:

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('unlock', 'airdrop', 'listing', 'mainnet', 'upgrade', 'halving', 'hardfork', 'conference')),
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  project_name TEXT NOT NULL,
  project_symbol TEXT,
  project_logo_url TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  importance TEXT NOT NULL DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### File Structure

```
src/
├── lib/
│   └── events.ts                          # Event helper functions
├── app/
│   └── api/
│       ├── events/
│       │   ├── route.ts                   # GET /api/events
│       │   └── upcoming/
│       │       └── route.ts               # GET /api/events/upcoming
│       └── cron/
│           └── collect-events/
│               └── route.ts               # CRON job (every 6 hours)
└── components/
    └── EventCalendar.tsx                  # UI component
```

## Components

### 1. Event Helper (`src/lib/events.ts`)

**Key Functions:**

- `generateMockEvents()` - Generates mock crypto events for next 30 days
- `saveEventToDatabase(event)` - Save single event to database
- `saveEventsToDatabase(events)` - Batch insert events (clears existing first)
- `getUpcomingEvents(limit)` - Get upcoming events ordered by date
- `getEventsByType(type, limit)` - Filter events by type
- `getEventsByDateRange(start, end)` - Get events in date range
- `updateEventStatus(id, status)` - Update event status

**Event Types:**
- `unlock` - Token unlock events
- `airdrop` - Airdrop distributions/snapshots
- `listing` - CEX/DEX listings
- `mainnet` - Mainnet launches
- `upgrade` - Network upgrades
- `halving` - Block reward halvings
- `hardfork` - Network hard forks
- `conference` - Industry conferences

**Event Importance:**
- `critical` - Major market-moving events (e.g., large unlocks, Ethereum upgrades)
- `high` - Significant events (e.g., major airdrops, listings)
- `medium` - Standard events (e.g., smaller unlocks)
- `low` - Minor events (e.g., small project upgrades)

### 2. CRON Job (`src/app/api/cron/collect-events/route.ts`)

**Schedule:** Every 6 hours (`0 */6 * * *`)

**Process:**
1. Generates/fetches crypto events
2. Clears existing events and inserts new ones
3. Updates past events status to 'completed'
4. Logs execution to `cron_executions` table

**Security:** Requires `Authorization: Bearer <CRON_SECRET>` header

### 3. API Endpoints

#### GET /api/events

Get upcoming events with optional filtering.

**Query Parameters:**
- `type` - Filter by event type (optional)
- `limit` - Number of events to return (default: 10, max: 50)

**Examples:**
```bash
# Get 10 upcoming events
curl "https://vectorialdata.com/api/events"

# Get 5 unlock events
curl "https://vectorialdata.com/api/events?type=unlock&limit=5"

# Get 20 airdrop events
curl "https://vectorialdata.com/api/events?type=airdrop&limit=20"
```

**Response:**
```json
{
  "timestamp": "2025-01-17T12:00:00.000Z",
  "count": 5,
  "params": {
    "type": "unlock",
    "limit": 5
  },
  "data": [
    {
      "id": "uuid",
      "title": "SUI Token Unlock - 64M tokens",
      "description": "Major token unlock event...",
      "event_type": "unlock",
      "event_date": "2025-01-19T12:00:00.000Z",
      "project_name": "Sui",
      "project_symbol": "SUI",
      "status": "upcoming",
      "importance": "critical",
      "source_url": "https://token.unlocks.app/sui"
    }
  ]
}
```

#### GET /api/events/upcoming

Get events for next N days with grouping and statistics.

**Query Parameters:**
- `days` - Number of days ahead (default: 7, max: 365)

**Examples:**
```bash
# Get events for next 7 days
curl "https://vectorialdata.com/api/events/upcoming"

# Get events for next 30 days
curl "https://vectorialdata.com/api/events/upcoming?days=30"
```

**Response:**
```json
{
  "timestamp": "2025-01-17T12:00:00.000Z",
  "params": {
    "days": 7,
    "start_date": "2025-01-17T12:00:00.000Z",
    "end_date": "2025-01-24T12:00:00.000Z"
  },
  "summary": {
    "total_events": 12,
    "events_by_type": {
      "unlock": 3,
      "airdrop": 2,
      "listing": 2,
      "mainnet": 1,
      "upgrade": 2,
      "conference": 2
    },
    "date_range_days": 7
  },
  "events_by_date": {
    "2025-01-19": [...],
    "2025-01-20": [...]
  },
  "all_events": [...]
}
```

### 4. EventCalendar Component

**Props:**
- `days` - Number of days ahead to fetch (default: 7)
- `limit` - Number of events to display (default: 5)

**Features:**
- Color-coded event types with emojis
- Importance badges (CRITICAL, HIGH, MED, LOW)
- Relative date formatting (Today, Tomorrow, In X days)
- Truncated descriptions with hover states
- Clickable events (opens source_url in new tab)
- Auto-refresh every 30 minutes

**Event Type Colors:**
- 🔓 Unlock - Red (`#ff6b6b`)
- 🪂 Airdrop - Teal (`#4ecdc4`)
- 📈 Listing - Light Teal (`#95e1d3`)
- 🚀 Mainnet - Purple (`#a29bfe`)
- ⬆️ Upgrade - Blue (`#74b9ff`)
- ✂️ Halving - Yellow (`#ffeaa7`)
- 🍴 Hardfork - Pink (`#fd79a8`)
- 🎤 Conference - Green (`#00b894`)

**Usage:**
```tsx
import EventCalendar from '@/components/EventCalendar'

// In your component
<EventCalendar limit={5} />
```

## Testing

### Manual Testing

1. **Test CRON Job:**
```bash
curl -X POST "https://vectorialdata.com/api/cron/collect-events" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

2. **Test Events API:**
```bash
# Get upcoming events
curl "https://vectorialdata.com/api/events?limit=10"

# Get unlock events
curl "https://vectorialdata.com/api/events?type=unlock&limit=5"

# Get events for next 30 days
curl "https://vectorialdata.com/api/events/upcoming?days=30"
```

3. **Check Database:**
```bash
# Using psql
PGPASSWORD='Cryptolotto2025!' psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 6543 \
  -d postgres \
  -U postgres.fjxbuyxephlfoivcpckd \
  -c "SELECT id, title, event_type, event_date, importance, status FROM events ORDER BY event_date LIMIT 5;"
```

4. **Check CRON Execution:**
```bash
# Using Supabase REST API
curl "https://fjxbuyxephlfoivcpckd.supabase.co/rest/v1/cron_executions?select=*&job_name=eq.collect-events&order=created_at.desc&limit=5" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

### Verification Checklist

- [ ] CRON job executes successfully every 6 hours
- [ ] Events are saved to database
- [ ] Past events are marked as completed
- [ ] API endpoints return correct data
- [ ] EventCalendar component renders correctly
- [ ] Event types are color-coded properly
- [ ] Importance badges display correctly
- [ ] Clickable events open source URLs
- [ ] Auto-refresh works (every 30 minutes)
- [ ] Loading and error states work

## Future Enhancements

### Phase 1: Real API Integrations

Replace mock data with real APIs:

1. **TokenUnlocks.app API** - Token unlock schedules
2. **Airdrops.io API** - Airdrop tracking
3. **CoinGecko API** - Listings and mainnet launches
4. **Defillama API** - Protocol upgrades
5. **CoinMarketCap Calendar API** - All event types
6. **CryptoPanic News API** - Conferences and news

### Phase 2: Advanced Features

- **Event Filtering:** Filter by type, importance, date range
- **Event Search:** Search by project name or symbol
- **Event Notifications:** Email/push notifications for important events
- **Event Submission:** User-submitted events with moderation
- **Event Details Page:** Dedicated page for each event with full details
- **Calendar View:** Month/week calendar view
- **ICS Export:** Export events to calendar apps
- **Event Analytics:** Track event impact on prices

### Phase 3: Premium Features

- **Custom Alerts:** Set up alerts for specific projects/event types
- **Event Predictions:** AI-powered price impact predictions
- **Historical Analysis:** Compare past events and their market impact
- **Event API:** Provide API access for premium users

## Troubleshooting

### Events Not Showing

1. Check if CRON job executed:
```bash
curl "https://vectorialdata.com/api/cron/collect-events" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

2. Check database directly:
```sql
SELECT COUNT(*) FROM events WHERE status = 'upcoming';
```

3. Check browser console for errors

### CRON Job Failing

1. Check Vercel CRON logs
2. Check Sentry for errors
3. Verify CRON_SECRET is set in Vercel environment variables
4. Check database connectivity

### API Returning Empty Data

1. Verify events exist in database
2. Check date filters (events might be in the past)
3. Check event status (should be 'upcoming')
4. Verify API endpoint parameters

## Performance Considerations

- **CRON Frequency:** Currently every 6 hours. Adjust based on data freshness needs.
- **API Caching:** 1-hour cache on API endpoints
- **Database Indexes:** Indexed on event_date, event_type, status, importance
- **Batch Operations:** Use `saveEventsToDatabase()` for bulk inserts
- **Query Limits:** Max 50 events per API request to prevent performance issues

## Security

- CRON endpoints protected with `CRON_SECRET`
- Row Level Security (RLS) enabled on events table
- Public read access (SELECT)
- Service role write access (INSERT/UPDATE)
- Input validation on all API endpoints
- SQL injection prevention via parameterized queries

## Deployment

vercel.json configuration:
```json
{
  "crons": [
    {
      "path": "/api/cron/collect-events",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Support

For issues or questions:
- Check GitHub issues: https://github.com/arcanequants/onchain-analytics/issues
- Review Sentry logs for errors
- Check Vercel deployment logs
- Review database logs in Supabase dashboard
