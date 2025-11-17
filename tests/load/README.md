# Load Testing with k6

## Installation

### macOS
```bash
brew install k6
```

### Ubuntu/Debian
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Windows
```bash
choco install k6
```

## Running Tests

### Standard Load Test
Tests normal traffic patterns with gradual ramp-up.

```bash
k6 run tests/load/api-load-test.js
```

With custom base URL:
```bash
BASE_URL=http://localhost:3000 k6 run tests/load/api-load-test.js
```

### Spike Test
Tests sudden traffic spikes (e.g., viral post, product launch).

```bash
k6 run tests/load/spike-test.js
```

### Stress Test
Finds the breaking point of your application.

```bash
k6 run tests/load/stress-test.js
```

## Test Scenarios

### api-load-test.js
**Purpose:** Normal load testing
**Duration:** ~5 minutes
**Max Users:** 200
**Target:** Verify performance under expected traffic

**Stages:**
1. Ramp up to 10 users (30s)
2. Ramp up to 50 users (1m)
3. Stay at 100 users (2m)
4. Spike to 200 users (1m)
5. Ramp down to 0 (30s)

**Thresholds:**
- 95% of requests < 500ms
- Error rate < 5%

### spike-test.js
**Purpose:** Sudden traffic increase
**Duration:** ~1 minute
**Max Users:** 500
**Target:** Test system resilience to traffic spikes

**Stages:**
1. Warm up to 10 users (10s)
2. SPIKE to 500 users (10s)
3. Stay at 500 users (30s)
4. Scale down to 10 (10s)

**Thresholds:**
- 99% of requests < 1s
- Error rate < 10%

### stress-test.js
**Purpose:** Find breaking point
**Duration:** ~8 minutes
**Max Users:** 400
**Target:** Determine maximum capacity

**Stages:**
1. Ramp to 100 users (1m)
2. Ramp to 200 users (2m)
3. Ramp to 300 users (2m)
4. Ramp to 400 users (2m)
5. Ramp down to 0 (1m)

**Thresholds:**
- 95% of requests < 1s
- Error rate < 15%

## Interpreting Results

### Good Results
```
✓ http_req_duration..........: avg=234ms  p(95)=456ms
✓ http_req_failed............: 1.2%
✓ checks.....................: 98.8% passed
```

### Warning Signs
```
✗ http_req_duration..........: avg=890ms  p(95)=1.2s
⚠ http_req_failed............: 8.5%
⚠ checks.....................: 91.5% passed
```

### Critical Issues
```
✗ http_req_duration..........: avg=2.1s   p(95)=5.4s
✗ http_req_failed............: 18.2%
✗ checks.....................: 81.8% passed
```

## Key Metrics

- **http_req_duration**: Response time
  - avg: Average response time
  - p(95): 95th percentile (95% of requests faster than this)
  - p(99): 99th percentile
  - max: Slowest request

- **http_req_failed**: Failed requests
  - rate: Percentage of failed requests
  - count: Number of failed requests

- **checks**: Test assertions
  - rate: Percentage of passed checks
  - count: Number of checks

- **http_reqs**: Total requests
  - count: Total number of requests made
  - rate: Requests per second

## Troubleshooting

### High Response Times
- Check database query performance
- Review API endpoint efficiency
- Check external API calls
- Verify caching is working

### High Error Rates
- Check rate limiting configuration
- Review database connection pool
- Check memory usage
- Verify error handling

### Timeouts
- Increase timeout thresholds (if reasonable)
- Optimize slow endpoints
- Add caching layers
- Consider CDN for static assets

## CI/CD Integration

These tests are automatically run in GitHub Actions on:
- Pull requests to main
- Weekly scheduled runs
- Manual trigger

Results are saved to `tests/load/summary.json`

## Best Practices

1. **Run locally first**: Test on localhost before production
2. **Start small**: Begin with low user counts
3. **Monitor during tests**: Watch CPU, memory, database
4. **Document baseline**: Record good results for comparison
5. **Test regularly**: Run weekly to catch performance regressions
