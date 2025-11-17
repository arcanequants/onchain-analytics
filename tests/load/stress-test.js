import http from 'k6/http';
import { check, sleep } from 'k6';

// Stress test: find breaking point
export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to 100
    { duration: '2m', target: 200 },   // Continue to 200
    { duration: '2m', target: 300 },   // Push to 300
    { duration: '2m', target: 400 },   // Push to 400
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // More lenient
    http_req_failed: ['rate<0.15'],     // Allow 15% error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://vectorialdata.com';

export default function () {
  // Mix of different requests
  const tests = [
    () => http.get(`${BASE_URL}/`),
    () => http.get(`${BASE_URL}/api/gas`),
    () => http.get(`${BASE_URL}/api/gas/history?chain=ethereum&hours=24`),
    () => http.get(`${BASE_URL}/api/fear-greed`),
    () => http.get(`${BASE_URL}/api/fear-greed/history?days=7`),
    () => http.get(`${BASE_URL}/api/events`),
    () => http.get(`${BASE_URL}/api/events/upcoming`),
    () => http.get(`${BASE_URL}/api/events/analytics`),
  ];

  // Run random test
  const test = tests[Math.floor(Math.random() * tests.length)];
  const response = test();

  check(response, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
  });

  sleep(0.5);
}
