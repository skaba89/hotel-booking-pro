// Admin read-load test — logs in once, then hammers the authenticated dashboard,
// bookings list and financial report. These are the heaviest DB queries
// (groupBy/aggregate/findMany with joins), so they saturate the DB sooner than the
// public read paths. Keep concurrency modest — in real life only a handful of
// staff use the admin at once.
//
//   k6 run -e VUS=20 -e DURATION=3m loadtest/admin.js
//   k6 run -e BASE_URL=http://localhost:4005 -e VUS=10 loadtest/admin.js

import { sleep } from 'k6';
import { adminLogin, adminJourney } from './lib/journeys.js';

export const options = {
  vus: parseInt(__ENV.VUS || '10', 10),
  duration: __ENV.DURATION || '3m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
  },
};

export function setup() {
  // One login for the whole run; the token is shared by all VUs.
  return { token: adminLogin() };
}

export default function (data) {
  adminJourney(data.token);
  sleep(2 + Math.random() * 3);
}
