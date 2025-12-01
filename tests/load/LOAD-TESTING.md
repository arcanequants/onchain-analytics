# Load Testing

This directory contains load testing scripts for the AI Perception API.

## Requirements

- [k6](https://k6.io/docs/getting-started/installation/) - Modern load testing tool

### Install k6

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

## Running Tests

### Quick Test (Smoke)

```bash
k6 run --scenario smoke tests/load/k6-load-test.js
```

### Full Load Test (100 concurrent users)

```bash
k6 run --scenario load tests/load/k6-load-test.js
```

### Stress Test (Find breaking point)

```bash
k6 run --scenario stress tests/load/k6-load-test.js
```

### Spike Test (Sudden traffic surge)

```bash
k6 run --scenario spike tests/load/k6-load-test.js
```

### Custom Configuration

```bash
# Against staging environment
BASE_URL=https://staging.aiperception.agency k6 run tests/load/k6-load-test.js

# With authentication
API_KEY=your-api-key k6 run tests/load/k6-load-test.js

# Custom virtual users and duration
k6 run --vus 100 --duration 5m tests/load/k6-load-test.js
```

## Test Scenarios

| Scenario | Description | VUs | Duration |
|----------|-------------|-----|----------|
| **smoke** | Basic functionality check | 5 | 1m |
| **load** | Normal load test | 0→50→100→0 | 14m |
| **stress** | Find breaking point | 0→100→200→300→0 | 14m |
| **spike** | Sudden traffic surge | 0→10→500→10→0 | 3m |

## Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| `http_req_failed` | < 1% | HTTP errors |
| `http_req_duration` | p95 < 3s | Response time |
| `health_check_duration` | p95 < 500ms | Health check speed |
| `analysis_request_duration` | p95 < 5s | Analysis API speed |
| `errors` | < 5% | Overall error rate |

## Output

Results are saved to:
- `tests/load/results/summary.json` - Summary metrics
- `tests/load/results/full-report.json` - Full k6 report

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run load tests
  uses: grafana/k6-action@v0.3.0
  with:
    filename: tests/load/k6-load-test.js
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
```

## Interpreting Results

### Good Results

- Error rate < 1%
- p95 response time < 3s
- All thresholds pass

### Warning Signs

- Error rate 1-5%
- p95 response time 3-5s
- Some thresholds fail

### Critical Issues

- Error rate > 5%
- p95 response time > 5s
- Many thresholds fail
- Server becomes unresponsive

## Recommendations

1. **Run smoke tests** before every deployment
2. **Run load tests** weekly or before major releases
3. **Run stress tests** quarterly to understand capacity
4. **Monitor** real-time during tests with k6 Cloud or Grafana
