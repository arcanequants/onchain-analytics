/**
 * k6 Load Testing Configuration
 *
 * Phase 4, Week 8 - Dev Checklist
 *
 * This TypeScript config generates k6 JavaScript test scripts
 * for load testing the AI Perception API.
 *
 * Installation:
 *   brew install k6
 *
 * Usage:
 *   npx ts-node scripts/load-testing/k6-config.ts
 *   k6 run scripts/load-testing/generated/smoke-test.js
 *   k6 run scripts/load-testing/generated/load-test.js
 *   k6 run scripts/load-testing/generated/stress-test.js
 *   k6 run scripts/load-testing/generated/spike-test.js
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface LoadTestConfig {
  name: string;
  description: string;
  stages: Array<{
    duration: string;
    target: number;
  }>;
  thresholds: Record<string, string[]>;
  endpoints: EndpointTest[];
}

interface EndpointTest {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  weight: number; // Probability weight (0-100)
  expectedStatus?: number;
}

// Base URL configuration
const BASE_URL = '${__ENV.BASE_URL || "https://aiperception.com"}';

// Common endpoints to test
const ENDPOINTS: EndpointTest[] = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/api/health',
    weight: 10,
    expectedStatus: 200,
  },
  {
    name: 'Deep Health Check',
    method: 'GET',
    path: '/api/health/deep',
    weight: 5,
    expectedStatus: 200,
  },
  {
    name: 'Landing Page',
    method: 'GET',
    path: '/',
    weight: 20,
    expectedStatus: 200,
  },
  {
    name: 'Pricing Page',
    method: 'GET',
    path: '/pricing',
    weight: 15,
    expectedStatus: 200,
  },
  {
    name: 'Help Center',
    method: 'GET',
    path: '/help',
    weight: 10,
    expectedStatus: 200,
  },
  {
    name: 'Start Analysis',
    method: 'POST',
    path: '/api/analyze',
    body: {
      url: 'https://example.com',
      includeCompetitors: false,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    weight: 25,
    expectedStatus: 200,
  },
  {
    name: 'Get Analysis Results',
    method: 'GET',
    path: '/api/analyze/\${analysisId}',
    weight: 15,
    expectedStatus: 200,
  },
];

// Test scenarios
const TEST_SCENARIOS: LoadTestConfig[] = [
  {
    name: 'smoke-test',
    description: 'Smoke test - Verify system works under minimal load',
    stages: [
      { duration: '1m', target: 5 },
    ],
    thresholds: {
      'http_req_duration': ['p(95)<2000'],
      'http_req_failed': ['rate<0.05'],
    },
    endpoints: ENDPOINTS,
  },
  {
    name: 'load-test',
    description: 'Load test - Normal production load (100 concurrent users)',
    stages: [
      { duration: '2m', target: 50 },   // Ramp up
      { duration: '5m', target: 100 },  // Stay at 100
      { duration: '2m', target: 0 },    // Ramp down
    ],
    thresholds: {
      'http_req_duration': ['p(95)<3000', 'p(99)<5000'],
      'http_req_failed': ['rate<0.02'],
      'http_reqs': ['rate>50'],
    },
    endpoints: ENDPOINTS,
  },
  {
    name: 'stress-test',
    description: 'Stress test - Beyond normal capacity to find breaking point',
    stages: [
      { duration: '2m', target: 50 },
      { duration: '3m', target: 100 },
      { duration: '3m', target: 200 },
      { duration: '3m', target: 300 },
      { duration: '3m', target: 400 },
      { duration: '2m', target: 0 },
    ],
    thresholds: {
      'http_req_duration': ['p(95)<5000'],
      'http_req_failed': ['rate<0.10'],
    },
    endpoints: ENDPOINTS,
  },
  {
    name: 'spike-test',
    description: 'Spike test - Sudden traffic spike',
    stages: [
      { duration: '1m', target: 10 },
      { duration: '30s', target: 500 }, // Spike!
      { duration: '2m', target: 500 },
      { duration: '30s', target: 10 },
      { duration: '1m', target: 0 },
    ],
    thresholds: {
      'http_req_duration': ['p(95)<10000'],
      'http_req_failed': ['rate<0.20'],
    },
    endpoints: ENDPOINTS,
  },
  {
    name: 'soak-test',
    description: 'Soak test - Extended period to find memory leaks',
    stages: [
      { duration: '5m', target: 50 },
      { duration: '60m', target: 50 }, // 1 hour at 50 users
      { duration: '5m', target: 0 },
    ],
    thresholds: {
      'http_req_duration': ['p(95)<3000'],
      'http_req_failed': ['rate<0.02'],
    },
    endpoints: ENDPOINTS,
  },
  {
    name: 'analysis-focused',
    description: 'Analysis endpoint focused test',
    stages: [
      { duration: '2m', target: 20 },
      { duration: '5m', target: 50 },
      { duration: '2m', target: 0 },
    ],
    thresholds: {
      'http_req_duration{endpoint:analysis}': ['p(95)<15000'],
      'http_req_failed{endpoint:analysis}': ['rate<0.05'],
    },
    endpoints: ENDPOINTS.filter(e => e.path.includes('analyze')),
  },
];

// ============================================================================
// K6 SCRIPT GENERATOR
// ============================================================================

function generateK6Script(config: LoadTestConfig): string {
  const script = `
/**
 * ${config.name}
 * ${config.description}
 *
 * Generated by k6-config.ts
 * Run: k6 run scripts/load-testing/generated/${config.name}.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = ${BASE_URL};

export const options = {
  stages: ${JSON.stringify(config.stages, null, 4)},
  thresholds: ${JSON.stringify(config.thresholds, null, 4)},
  // Cloud configuration
  ext: {
    loadimpact: {
      projectID: parseInt(__ENV.K6_PROJECT_ID || '0'),
      name: '${config.name}',
    },
  },
};

// ============================================================================
// CUSTOM METRICS
// ============================================================================

const errorRate = new Rate('error_rate');
const analysisRequests = new Counter('analysis_requests');
const analysisLatency = new Trend('analysis_latency');
const pageLoadTime = new Trend('page_load_time');

// ============================================================================
// TEST DATA
// ============================================================================

const testUrls = [
  'https://apple.com',
  'https://google.com',
  'https://microsoft.com',
  'https://amazon.com',
  'https://netflix.com',
  'https://spotify.com',
  'https://tesla.com',
  'https://nike.com',
  'https://coca-cola.com',
  'https://disney.com',
];

// Store analysis IDs for polling
let analysisIds = [];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAuthHeaders() {
  const token = __ENV.AUTH_TOKEN || '';
  if (!token) return {};
  return {
    'Authorization': \`Bearer \${token}\`,
  };
}

function weightedRandom(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return i;
  }
  return weights.length - 1;
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

${generateEndpointFunctions(config.endpoints)}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

export default function() {
  const endpoints = [
${config.endpoints.map((e, i) => `    { fn: test${toPascalCase(e.name)}, weight: ${e.weight} },`).join('\n')}
  ];

  const weights = endpoints.map(e => e.weight);
  const selectedIndex = weightedRandom(weights);
  const selectedEndpoint = endpoints[selectedIndex];

  // Execute the selected endpoint test
  selectedEndpoint.fn();

  // Random sleep between requests (1-3 seconds)
  sleep(randomIntBetween(1, 3));
}

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

export function setup() {
  console.log('Starting ${config.name}');
  console.log(\`Base URL: \${BASE_URL}\`);
  console.log(\`VUs: \${JSON.stringify(options.stages)}\`);

  // Verify health endpoint
  const healthRes = http.get(\`\${BASE_URL}/api/health\`);
  if (healthRes.status !== 200) {
    throw new Error(\`Health check failed: \${healthRes.status}\`);
  }

  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log('${config.name} completed');
  console.log(\`Started at: \${data.startTime}\`);
  console.log(\`Ended at: \${new Date().toISOString()}\`);
}

// ============================================================================
// HANDLE SUMMARY
// ============================================================================

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'scripts/load-testing/results/${config.name}-summary.json': JSON.stringify(data, null, 2),
  };
}

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
`;

  return script.trim();
}

function generateEndpointFunctions(endpoints: EndpointTest[]): string {
  return endpoints.map(endpoint => {
    const fnName = `test${toPascalCase(endpoint.name)}`;
    const hasBody = endpoint.method === 'POST' || endpoint.method === 'PUT';

    let bodyCode = '';
    if (hasBody && endpoint.body) {
      if (endpoint.path.includes('analyze')) {
        bodyCode = `
    const testUrl = randomItem(testUrls);
    const body = JSON.stringify({
      url: testUrl,
      includeCompetitors: false,
    });`;
      } else {
        bodyCode = `
    const body = JSON.stringify(${JSON.stringify(endpoint.body)});`;
      }
    }

    const headersCode = endpoint.headers
      ? `{ ...getAuthHeaders(), ${Object.entries(endpoint.headers).map(([k, v]) => `'${k}': '${v}'`).join(', ')} }`
      : 'getAuthHeaders()';

    let pathCode = endpoint.path;
    if (pathCode.includes('${analysisId}')) {
      pathCode = pathCode.replace('${analysisId}', "' + (analysisIds.length > 0 ? randomItem(analysisIds) : 'test-id') + '");
    }

    const requestCode = hasBody
      ? `http.${endpoint.method.toLowerCase()}(\`\${BASE_URL}${pathCode}\`, body, { headers: ${headersCode}, tags: { endpoint: '${endpoint.name.toLowerCase().replace(/\s+/g, '_')}' } })`
      : `http.${endpoint.method.toLowerCase()}(\`\${BASE_URL}${pathCode}\`, { headers: ${headersCode}, tags: { endpoint: '${endpoint.name.toLowerCase().replace(/\s+/g, '_')}' } })`;

    return `
function ${fnName}() {
  group('${endpoint.name}', function() {${bodyCode}
    const res = ${requestCode};

    const success = check(res, {
      '${endpoint.name} status is ${endpoint.expectedStatus || 200}': (r) => r.status === ${endpoint.expectedStatus || 200},
      '${endpoint.name} response time < 3s': (r) => r.timings.duration < 3000,
    });

    errorRate.add(!success);
${endpoint.path.includes('analyze') && endpoint.method === 'POST' ? `
    // Store analysis ID for later polling
    if (res.status === 200) {
      try {
        const data = JSON.parse(res.body);
        if (data.id) {
          analysisIds.push(data.id);
          if (analysisIds.length > 100) analysisIds.shift(); // Keep last 100
        }
        analysisRequests.add(1);
        analysisLatency.add(res.timings.duration);
      } catch (e) {}
    }` : ''}${endpoint.method === 'GET' && !endpoint.path.includes('api') ? `
    pageLoadTime.add(res.timings.duration);` : ''}
  });
}`;
  }).join('\n');
}

function toPascalCase(str: string): string {
  return str
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const outputDir = path.join(__dirname, 'generated');
  const resultsDir = path.join(__dirname, 'results');

  // Create directories if they don't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Generate scripts for each test scenario
  for (const config of TEST_SCENARIOS) {
    const script = generateK6Script(config);
    const filename = path.join(outputDir, `${config.name}.js`);
    fs.writeFileSync(filename, script);
    console.log(`Generated: ${filename}`);
  }

  // Generate README
  const readme = `# Load Testing Scripts

Generated by \`k6-config.ts\`

## Prerequisites

1. Install k6:
   \`\`\`bash
   brew install k6
   \`\`\`

2. Set environment variables:
   \`\`\`bash
   export BASE_URL="https://your-domain.com"
   export AUTH_TOKEN="your-auth-token"  # Optional
   \`\`\`

## Available Tests

${TEST_SCENARIOS.map(c => `### ${c.name}
${c.description}

\`\`\`bash
k6 run scripts/load-testing/generated/${c.name}.js
\`\`\`

**Stages:**
${c.stages.map(s => `- ${s.duration}: ${s.target} VUs`).join('\n')}

**Thresholds:**
${Object.entries(c.thresholds).map(([k, v]) => `- ${k}: ${v.join(', ')}`).join('\n')}
`).join('\n')}

## Running with k6 Cloud

\`\`\`bash
k6 cloud scripts/load-testing/generated/load-test.js
\`\`\`

## Interpreting Results

Results are saved to \`scripts/load-testing/results/\`:
- \`<test-name>-summary.json\`: Full test summary

Key metrics:
- **http_req_duration**: Response time (p95, p99)
- **http_req_failed**: Error rate
- **http_reqs**: Request rate (req/s)
- **vus**: Virtual users over time
`;

  fs.writeFileSync(path.join(__dirname, 'README.md'), readme);
  console.log(`Generated: ${path.join(__dirname, 'README.md')}`);

  console.log('\nDone! Run tests with:');
  console.log('  k6 run scripts/load-testing/generated/smoke-test.js');
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { TEST_SCENARIOS, ENDPOINTS, generateK6Script };
