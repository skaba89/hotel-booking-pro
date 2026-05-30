// Smoke test — 1 VU, a few iterations. Run this FIRST to confirm the harness,
// the BASE_URL and the seed data all work before launching a heavy ramp.
//
//   k6 run loadtest/smoke.js
//   k6 run -e BASE_URL=http://localhost:4005 loadtest/smoke.js

import { sleep } from 'k6';
import { fetchRoomCatalogue, browseJourney } from './lib/journeys.js';

export const options = {
  vus: 1,
  iterations: 5,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
  },
};

export function setup() {
  return { rooms: fetchRoomCatalogue() };
}

export default function (data) {
  browseJourney(data.rooms);
  sleep(1);
}
