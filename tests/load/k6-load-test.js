/**
 * k6 Load Testing Script
 *
 * Tests the API under load with 100 concurrent users
 * Phase 4, Week 8 - Dev Engineering Checklist
 *
 * Run with: k6 run tests/load/k6-load-test.js
 * Or: k6 run --vus 100 --duration 5m tests/load/k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ================================================================
// CUSTOM METRICS
// ================================================================

const errorRate = new Rate('errors');
const analysisRequestDuration = new Trend('analysis_request_duration');
const healthCheckDuration = new Trend('health_check_duration');
const apiRequestCount = new Counter('api_requests');

// ================================================================
// TEST CONFIGURATION
// ================================================================

export const options = {
  // Scenarios for different load patterns
  scenarios: {
    // Smoke test - basic functionality check
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      tags: { scenario: 'smoke' },
    },

    // Load test - 100 concurrent users
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
      tags: { scenario: 'load' },
    },

    // Stress test - find breaking point
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 0 },
      ],
      tags: { scenario: 'stress' },
    },

    // Spike test - sudden traffic surge
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 500 },  // Spike!
        { duration: '30s', target: 10 },
        { duration: '1m', target: 0 },
      ],
      tags: { scenario: 'spike' },
    },
  },

  // Thresholds for pass/fail criteria
  thresholds: {
    // HTTP errors should be less than 1%
    'http_req_failed': ['rate<0.01'],

    // 95% of requests should be under 3s
    'http_req_duration': ['p(95)<3000'],

    // Health check should be under 500ms
    'health_check_duration': ['p(95)<500'],

    // Analysis requests under 5s for 95th percentile
    'analysis_request_duration': ['p(95)<5000'],

    // Error rate under 5%
    'errors': ['rate<0.05'],
  },
};

// ================================================================
// ENVIRONMENT CONFIGURATION
// ================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || '';

const HEADERS = {
  'Content-Type': 'application/json',
  ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` }),
};

// Test URLs for analysis
const TEST_URLS = [
  'https://stripe.com',
  'https://vercel.com',
  'https://supabase.com',
  'https://notion.so',
  'https://linear.app',
  'https://figma.com',
  'https://github.com',
  'https://gitlab.com',
  'https://atlassian.com',
  'https://slack.com',
];

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function randomUrl() {
  return TEST_URLS[Math.floor(Math.random() * TEST_URLS.length)];
}

function checkResponse(response, name) {
  const success = check(response, {
    [`${name} - status is 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${name} - response time < 3s`]: (r) => r.timings.duration < 3000,
    [`${name} - has body`]: (r) => r.body && r.body.length > 0,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  return success;
}

// ================================================================
// TEST SCENARIOS
// ================================================================

export default function () {
  // ---------------------------------------------------------------
  // Health Check
  // ---------------------------------------------------------------
  group('Health Check', function () {
    const start = Date.now();
    const response = http.get(`${BASE_URL}/api/health`);
    healthCheckDuration.add(Date.now() - start);
    apiRequestCount.add(1);

    check(response, {
      'health check returns 200': (r) => r.status === 200,
      'health check has status field': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status !== undefined;
        } catch {
          return false;
        }
      },
    });
  });

  sleep(1);

  // ---------------------------------------------------------------
  // OpenAPI Spec
  // ---------------------------------------------------------------
  group('OpenAPI Spec', function () {
    const response = http.get(`${BASE_URL}/api/openapi`);
    apiRequestCount.add(1);

    checkResponse(response, 'OpenAPI');

    check(response, {
      'openapi spec is valid JSON': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.openapi === '3.1.0';
        } catch {
          return false;
        }
      },
    });
  });

  sleep(1);

  // ---------------------------------------------------------------
  // Start Analysis (if authenticated)
  // ---------------------------------------------------------------
  group('Analysis Request', function () {
    const start = Date.now();
    const payload = JSON.stringify({
      url: randomUrl(),
      industry: 'saas',
      depth: 'quick',
    });

    const response = http.post(`${BASE_URL}/api/analyze`, payload, {
      headers: HEADERS,
    });
    analysisRequestDuration.add(Date.now() - start);
    apiRequestCount.add(1);

    // Accept 201 (created), 401 (no auth), or 429 (rate limited)
    check(response, {
      'analysis request accepted': (r) =>
        r.status === 201 || r.status === 401 || r.status === 429,
    });

    // If analysis was accepted, try to get status
    if (response.status === 201) {
      try {
        const body = JSON.parse(response.body);
        if (body.id) {
          sleep(1);
          const statusResponse = http.get(
            `${BASE_URL}/api/analyze/${body.id}/status`,
            { headers: HEADERS }
          );
          apiRequestCount.add(1);

          check(statusResponse, {
            'status check returns valid response': (r) =>
              r.status === 200 || r.status === 202 || r.status === 404,
          });
        }
      } catch {
        // Ignore parsing errors
      }
    }
  });

  sleep(2);

  // ---------------------------------------------------------------
  // Pricing Page (Static)
  // ---------------------------------------------------------------
  group('Static Pages', function () {
    const response = http.get(`${BASE_URL}/pricing`);
    apiRequestCount.add(1);

    check(response, {
      'pricing page loads': (r) => r.status === 200,
      'pricing page is HTML': (r) =>
        r.headers['Content-Type'] &&
        r.headers['Content-Type'].includes('text/html'),
    });
  });

  sleep(1);

  // ---------------------------------------------------------------
  // User Analyses List (Authenticated)
  // ---------------------------------------------------------------
  if (API_KEY) {
    group('User Analyses', function () {
      const response = http.get(`${BASE_URL}/api/user/analyses?limit=10`, {
        headers: HEADERS,
      });
      apiRequestCount.add(1);

      check(response, {
        'user analyses returns data': (r) =>
          r.status === 200 || r.status === 401,
      });
    });
  }

  sleep(Math.random() * 3 + 1); // Random sleep 1-4 seconds
}

// ================================================================
// SETUP AND TEARDOWN
// ================================================================

export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log(`API Key configured: ${API_KEY ? 'Yes' : 'No'}`);

  // Verify the server is reachable
  const response = http.get(`${BASE_URL}/api/health`);
  if (response.status !== 200) {
    throw new Error(`Server not healthy: ${response.status}`);
  }

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Test completed in ${duration.toFixed(2)} seconds`);
}

// ================================================================
// CUSTOM SUMMARY
// ================================================================

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    duration: data.state.testRunDurationMs,
    vus_max: data.metrics.vus_max ? data.metrics.vus_max.values.max : 0,
    requests_total: data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0,
    requests_failed: data.metrics.http_req_failed
      ? data.metrics.http_req_failed.values.passes
      : 0,
    response_time_avg: data.metrics.http_req_duration
      ? data.metrics.http_req_duration.values.avg
      : 0,
    response_time_p95: data.metrics.http_req_duration
      ? data.metrics.http_req_duration.values['p(95)']
      : 0,
    response_time_p99: data.metrics.http_req_duration
      ? data.metrics.http_req_duration.values['p(99)']
      : 0,
    thresholds_passed: Object.entries(data.metrics)
      .filter(([_, m]) => m.thresholds)
      .every(([_, m]) => Object.values(m.thresholds).every((t) => t.ok)),
  };

  return {
    stdout: JSON.stringify(summary, null, 2),
    'tests/load/results/summary.json': JSON.stringify(summary, null, 2),
    'tests/load/results/full-report.json': JSON.stringify(data, null, 2),
  };
}
