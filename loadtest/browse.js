// Steady-state browse test — constant load at a fixed concurrency for a fixed
// duration. Use this to measure stable latency at a target you already chose
// (e.g. "can we hold 200 concurrent browsers for 10 min?").
//
//   k6 run -e VUS=200 -e DURATION=10m loadtest/browse.js
//   k6 run -e BASE_URL=http://localhost:4005 -e VUS=100 -e DURATION=5m loadtest/browse.js

import { sleep } from 'k6';
import { fetchRoomCatalogue, browseJourney } from './lib/journeys.js';
import { THRESHOLDS } from './lib/config.js';

export const options = {
  vus: parseInt(__ENV.VUS || '100', 10),
  duration: __ENV.DURATION || '5m',
  thresholds: THRESHOLDS,
};

export function setup() {
  return { rooms: fetchRoomCatalogue() };
}

export default function (data) {
  browseJourney(data.rooms);
  sleep(3 + Math.random() * 4);
}
