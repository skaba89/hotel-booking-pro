// Saturation test — the main event. Ramps virtual users in steps to find the knee
// where latency/error thresholds break. The highest stage that still PASSES the
// thresholds is your current capacity; size the VPS to comfortably exceed it.
//
//   k6 run loadtest/saturation.js
//   k6 run -e BASE_URL=http://localhost:4005 loadtest/saturation.js
//   # override the ramp ceiling / step length:
//   k6 run -e MAX_VUS=2000 -e STEP=2m loadtest/saturation.js
//
// Reading the output:
//   * Watch http_req_duration p(95)/p(99) and http_req_failed per stage (use
//     --out json=run.json or the end-of-test summary).
//   * The "knee" = first VU level where p95 > 800ms or errors > 1%.
//   * Per-journey trends are tagged {journey:browse|room_detail|availability|quote}.

import { sleep } from 'k6';
import { fetchRoomCatalogue, browseJourney } from './lib/journeys.js';
import { THRESHOLDS } from './lib/config.js';

const STEP = __ENV.STEP || '1m';                       // time spent at each plateau
const RAMP = __ENV.RAMP || '30s';                      // ramp time between plateaus
const MAX_VUS = parseInt(__ENV.MAX_VUS || '1000', 10); // ceiling

// Stepped ramp: 50 -> 100 -> 200 -> 500 -> MAX, each held for STEP, then ramp down.
function buildStages() {
  const levels = [50, 100, 200, 500, MAX_VUS].filter((v, i, a) => v <= MAX_VUS && a.indexOf(v) === i);
  const stages = [];
  for (const target of levels) {
    stages.push({ duration: RAMP, target }); // ramp up to the plateau
    stages.push({ duration: STEP, target }); // hold the plateau
  }
  stages.push({ duration: RAMP, target: 0 }); // ramp down
  return stages;
}

export const options = {
  scenarios: {
    saturation: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: buildStages(),
      gracefulRampDown: '20s',
    },
  },
  thresholds: THRESHOLDS,
  // Don't abort the whole run when a threshold breaks — we WANT to see how far it
  // degrades past the knee.
  // (k6 marks the run as failed at the end; that's expected and informative.)
};

export function setup() {
  return { rooms: fetchRoomCatalogue() };
}

export default function (data) {
  browseJourney(data.rooms);
  // Think time: real users pause between actions. ~3–7s keeps the model realistic
  // (raw hammering inflates RPS unrealistically and understates real capacity).
  sleep(3 + Math.random() * 4);
}
