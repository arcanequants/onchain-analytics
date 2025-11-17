import http from 'k6/http';
import { check, sleep } from 'k6';

// Spike test: sudden increase in traffic
export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Warm up
    { duration: '10s', target: 500 },  // SPIKE to 500 users
    { duration: '30s', target: 500 },  // Stay at 500
    { duration: '10s', target: 10 },   // Scale down
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99% of requests should be below 1s
    http_req_failed: ['rate<0.1'],     // Error rate should be less than 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://vectorialdata.com';

export default function () {
  const endpoints = [
    `${BASE_URL}/api/gas`,
    `${BASE_URL}/api/fear-greed`,
    `${BASE_URL}/api/events/upcoming`,
    `${BASE_URL}/api/health`,
  ];

  // Randomly hit different endpoints
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.get(endpoint);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 1000,
  });

  sleep(Math.random() * 2); // Random sleep 0-2 seconds
}
