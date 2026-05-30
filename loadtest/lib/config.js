// Shared configuration for the k6 load-test harness.
//
// SAFETY: BASE_URL defaults to the LOCAL API (http://localhost:4005). NEVER point
// this at the production Render free-tier URL — sustained load would crash the live
// site and burn the free quota. Test against a local instance or a dedicated staging.
//
// Override at runtime, e.g.:
//   k6 run -e BASE_URL=http://localhost:4005 loadtest/saturation.js
//   k6 run -e BASE_URL=https://staging.example.com loadtest/saturation.js

export const BASE_URL = (__ENV.BASE_URL || 'http://localhost:4005').replace(/\/+$/, '');
export const API = `${BASE_URL}/api`;

// Admin credentials used only for the admin read-journey. Override via env so no
// secret is hard-committed. Defaults match the local dev seed.
export const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@setifana.com';
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@2024!';

// Set CREATE_BOOKINGS=true to exercise the write path (POST /api/bookings).
// Off by default: the endpoint is throttled to 5 req/min/IP (so it cannot be
// load-tested meaningfully) AND every call persists a row in the DB.
export const CREATE_BOOKINGS = (__ENV.CREATE_BOOKINGS || 'false') === 'true';

// Standard JSON headers.
export const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Pass/fail thresholds. When a stage of the ramp violates these, that VU level is
// past the saturation knee — that's the number to size the VPS against.
export const THRESHOLDS = {
  http_req_failed: ['rate<0.01'], // <1% errors
  http_req_duration: ['p(95)<800', 'p(99)<2000'], // ms
  // Per-journey latency budgets (named trends populated in journeys.js).
  'http_req_duration{journey:browse}': ['p(95)<800'],
  'http_req_duration{journey:room_detail}': ['p(95)<800'],
  'http_req_duration{journey:availability}': ['p(95)<1000'],
  'http_req_duration{journey:quote}': ['p(95)<1000'],
};

// Build a date range N days out from today (k6 has no luxon; keep it simple).
export function futureDates(offsetDays, nights) {
  const inMs = Date.now() + offsetDays * 86400000;
  const outMs = inMs + nights * 86400000;
  const iso = (ms) => new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD
  return { checkIn: iso(inMs), checkOut: iso(outMs) };
}

// Deterministic-ish random pick.
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
