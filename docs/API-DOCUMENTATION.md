# 📚 OnChain Analytics API Documentation

**Version:** 1.0.0
**Base URL:** `https://onchain-analytics.vercel.app/api`
**Authentication:** API Key (coming soon)
**Rate Limits:** 100 requests per 15 minutes (public), see tiers for authenticated

---

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Handling](#error-handling)
4. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Gas Prices](#gas-prices)
5. [Response Formats](#response-formats)
6. [Code Examples](#code-examples)

---

## Authentication

### Coming Soon: API Keys

API key authentication will be available in v1.1. For now, all endpoints are public with rate limiting.

**Future format:**
```http
GET /api/gas
Authorization: Bearer sk_live_your_api_key_here
```

---

## Rate Limiting

All API requests are subject to rate limits to ensure fair usage.

### Public (Unauthenticated)
- **Limit:** 100 requests per 15 minutes
- **Identifier:** IP address
- **Reset:** Rolling window

### Response Headers

Every API response includes rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2025-01-17T21:00:00.000Z
Retry-After: 450
```

### Rate Limit Exceeded

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "limit": 100,
  "remaining": 0,
  "reset": "2025-01-17T21:00:00.000Z"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `400` | Bad Request | Invalid parameters or validation failed |
| `404` | Not Found | Endpoint doesn't exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Something went wrong on our end |
| `503` | Service Unavailable | Service is temporarily unavailable |

### Error Response Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "errors": [
    {
      "field": "chain",
      "message": "Invalid enum value. Expected 'ethereum' | 'base' | 'arbitrum' | 'optimism' | 'polygon'"
    }
  ]
}
```

---

## Endpoints

### Health Check

Check if the API is operational and healthy.

#### Request

```http
GET /api/health
```

#### Parameters

None

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2025-01-17T20:30:00.000Z",
  "uptime": 12345,
  "checks": {
    "api": {
      "status": "pass",
      "responseTime": 15
    },
    "database": {
      "status": "pass",
      "responseTime": 45
    },
    "supabase": {
      "status": "pass",
      "responseTime": 30
    },
    "environment": {
      "status": "pass"
    }
  },
  "version": "1.0.0",
  "environment": "production"
}
```

#### Response Codes

- `200 OK` - All systems operational
- `503 Service Unavailable` - One or more critical systems are down

#### Example

```bash
curl https://onchain-analytics.vercel.app/api/health
```

---

### Gas Prices

Get current or historical gas prices across multiple blockchain networks.

#### Request

```http
GET /api/gas
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `chain` | string | No | all | Filter by blockchain network |
| `limit` | integer | No | 100 | Number of results to return (1-1000) |
| `start` | string | No | - | Start date (ISO 8601 format) |
| `end` | string | No | - | End date (ISO 8601 format) |

**Valid chain values:** `ethereum`, `base`, `arbitrum`, `optimism`, `polygon`

#### Response

```json
{
  "timestamp": "2025-01-17T20:30:00.000Z",
  "count": 5,
  "data": [
    {
      "chain": "ethereum",
      "gasPrice": 25.5,
      "blockNumber": 18500000,
      "timestamp": "2025-01-17T20:29:45.000Z",
      "status": "medium",
      "baseFee": 24.8,
      "priorityFee": 0.7
    },
    {
      "chain": "base",
      "gasPrice": 0.01,
      "blockNumber": 5200000,
      "timestamp": "2025-01-17T20:29:50.000Z",
      "status": "low",
      "baseFee": 0.005,
      "priorityFee": 0.005
    },
    {
      "chain": "arbitrum",
      "gasPrice": 0.05,
      "blockNumber": 160000000,
      "timestamp": "2025-01-17T20:29:52.000Z",
      "status": "low"
    },
    {
      "chain": "optimism",
      "gasPrice": 0.001,
      "blockNumber": 115000000,
      "timestamp": "2025-01-17T20:29:48.000Z",
      "status": "low"
    },
    {
      "chain": "polygon",
      "gasPrice": 100.5,
      "blockNumber": 52000000,
      "timestamp": "2025-01-17T20:29:55.000Z",
      "status": "high"
    }
  ]
}
```

#### Gas Price Status

| Status | Description | Ethereum Range | Base Range |
|--------|-------------|----------------|------------|
| `low` | Good time to transact | < 20 Gwei | < 0.02 Gwei |
| `medium` | Normal | 20-50 Gwei | 0.02-0.05 Gwei |
| `high` | Expensive, wait if possible | > 50 Gwei | > 0.05 Gwei |

#### Examples

**Get all gas prices:**
```bash
curl https://onchain-analytics.vercel.app/api/gas
```

**Get Ethereum gas only:**
```bash
curl https://onchain-analytics.vercel.app/api/gas?chain=ethereum
```

**Get latest 10 results:**
```bash
curl https://onchain-analytics.vercel.app/api/gas?limit=10
```

**Get Base gas prices from last hour:**
```bash
curl "https://onchain-analytics.vercel.app/api/gas?chain=base&start=2025-01-17T19:00:00Z&end=2025-01-17T20:00:00Z"
```

#### Response Codes

- `200 OK` - Success
- `400 Bad Request` - Invalid parameters (e.g., `chain=invalid`)
- `429 Too Many Requests` - Rate limit exceeded

---

## Response Formats

### Timestamps

All timestamps are in ISO 8601 format with UTC timezone:

```
2025-01-17T20:30:00.000Z
```

### Numbers

- **Gas prices:** Decimal numbers in Gwei
- **Block numbers:** Integers
- **Rate limits:** Integers

### Booleans

Standard JSON booleans: `true` or `false`

---

## Code Examples

### JavaScript / TypeScript

```typescript
// Using fetch
async function getGasPrices(chain?: string) {
  const url = chain
    ? `https://onchain-analytics.vercel.app/api/gas?chain=${chain}`
    : `https://onchain-analytics.vercel.app/api/gas`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// Usage
const allGas = await getGasPrices()
console.log(allGas.data)

const ethGas = await getGasPrices('ethereum')
console.log(`Ethereum gas: ${ethGas.data[0].gasPrice} Gwei`)
```

### Python

```python
import requests

def get_gas_prices(chain=None):
    url = "https://onchain-analytics.vercel.app/api/gas"
    params = {}

    if chain:
        params['chain'] = chain

    response = requests.get(url, params=params)
    response.raise_for_status()

    return response.json()

# Usage
all_gas = get_gas_prices()
print(all_gas['data'])

eth_gas = get_gas_prices('ethereum')
print(f"Ethereum gas: {eth_gas['data'][0]['gasPrice']} Gwei")
```

### cURL

```bash
# Get all gas prices
curl https://onchain-analytics.vercel.app/api/gas

# Get Ethereum gas only (pretty printed)
curl https://onchain-analytics.vercel.app/api/gas?chain=ethereum | jq

# Check health
curl https://onchain-analytics.vercel.app/api/health

# With rate limit headers
curl -i https://onchain-analytics.vercel.app/api/gas
```

### Node.js with Axios

```javascript
const axios = require('axios')

async function getGasPrices(chain) {
  try {
    const response = await axios.get('https://onchain-analytics.vercel.app/api/gas', {
      params: { chain }
    })

    console.log('Rate Limit Remaining:', response.headers['x-ratelimit-remaining'])
    return response.data
  } catch (error) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
      console.error(`Rate limited. Retry after ${retryAfter} seconds`)
    }
    throw error
  }
}

// Usage
getGasPrices('base').then(data => {
  console.log(`Base gas: ${data.data[0].gasPrice} Gwei`)
})
```

---

## Webhooks (Coming Soon)

Subscribe to real-time updates when gas prices change:

```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["gas.price.high", "gas.price.low"],
  "chains": ["ethereum", "base"]
}
```

---

## SDKs (Planned)

Official SDKs are planned for:

- ✅ JavaScript / TypeScript (v1.1)
- 🔲 Python (v1.2)
- 🔲 Go (v1.3)
- 🔲 Rust (v1.4)

---

## Support

### Questions?

- **Email:** support@onchain-analytics.com (coming soon)
- **Discord:** Join our community (link coming soon)
- **GitHub:** Open an issue at [github.com/arcanequants/onchain-analytics](https://github.com/arcanequants/onchain-analytics)

### Report a Bug

Found a bug? Please open an issue on GitHub with:
- API endpoint
- Request parameters
- Expected behavior
- Actual behavior
- Response (if any)

---

## Changelog

### v1.0.0 (2025-01-17)

#### Added
- Health check endpoint (`/api/health`)
- Gas prices endpoint (`/api/gas`)
- Rate limiting (100 req/15min)
- Input validation with detailed error messages
- Security headers (CSP, XSS, CORS)

#### Coming Soon
- API key authentication
- Fear & Greed Index endpoint
- Events Calendar endpoint
- Historical data endpoints
- WebSocket support for real-time updates

---

**🚀 Generated with [Claude Code](https://claude.com/claude-code)**

**Last Updated:** 2025-01-17
