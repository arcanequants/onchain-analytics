import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 200 },  // Spike to 200 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.05'],   // Error rate should be less than 5%
    errors: ['rate<0.1'],              // Custom error rate should be less than 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://vectorialdata.com';

export default function () {
  // Test 1: Homepage
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Gas API
  response = http.get(`${BASE_URL}/api/gas`);
  check(response, {
    'gas API status is 200': (r) => r.status === 200,
    'gas API responds in < 500ms': (r) => r.timings.duration < 500,
    'gas API returns array': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Fear & Greed API
  response = http.get(`${BASE_URL}/api/fear-greed`);
  check(response, {
    'fear-greed API status is 200': (r) => r.status === 200,
    'fear-greed API responds in < 500ms': (r) => r.timings.duration < 500,
    'fear-greed API has value': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.value !== undefined;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Events API
  response = http.get(`${BASE_URL}/api/events/upcoming`);
  check(response, {
    'events API status is 200': (r) => r.status === 200,
    'events API responds in < 1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Test 5: Health Check
  response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check responds in < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'tests/load/summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  const indent = opts.indent || '';
  const enableColors = opts.enableColors || false;

  let summary = '\n' + indent + '✓ Load Test Summary\n\n';

  // Requests
  summary += indent + `  Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `  Failed: ${data.metrics.http_req_failed.values.rate * 100}%\n`;

  // Response Times
  summary += indent + '\n  Response Times:\n';
  summary += indent + `    avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += indent + `    p(95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += indent + `    p(99): ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += indent + `    max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n`;

  // Checks
  const checks = data.metrics.checks;
  if (checks) {
    summary += indent + `\n  Checks: ${(checks.values.rate * 100).toFixed(2)}% passed\n`;
  }

  return summary;
}
