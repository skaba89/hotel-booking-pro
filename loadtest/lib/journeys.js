// Request helpers modelling the real user journeys against the Hotel SETIFANA API.
// Each public endpoint here mirrors a route confirmed in the NestJS controllers:
//   GET  /api/rooms                  (list, paginated -> { data, total, ... })
//   GET  /api/rooms/featured
//   GET  /api/rooms/:slug            (room detail)
//   GET  /api/availability?roomId&checkIn&checkOut
//   POST /api/bookings/quote         { roomId, checkIn, checkOut, adults, children }
//   POST /api/bookings               (write, throttled 5/min/IP — gated behind CREATE_BOOKINGS)
//   POST /api/auth/login             { email, password } -> { accessToken }
//   GET  /api/admin/dashboard/revenue, /api/admin/bookings, /api/admin/reports/financial (auth)

import http from 'k6/http';
import { check } from 'k6';
import {
  API,
  JSON_HEADERS,
  CREATE_BOOKINGS,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  futureDates,
  pick,
} from './config.js';

// ---- setup helpers (run once, outside the VU loop) ----

// Fetch the room catalogue once so VUs work against real ids/slugs regardless of seed.
export function fetchRoomCatalogue() {
  const res = http.get(`${API}/rooms?limit=50`, { tags: { journey: 'setup' } });
  if (res.status !== 200) {
    throw new Error(`Cannot load room catalogue (${res.status}) at ${API}/rooms — is the API up at the right BASE_URL?`);
  }
  const body = res.json();
  const rooms = (body && body.data ? body.data : []).map((r) => ({
    id: r.id,
    slug: r.slug,
    capacity: r.capacity || 2,
  }));
  if (rooms.length === 0) {
    throw new Error('Room catalogue is empty — seed the DB before load-testing.');
  }
  return rooms;
}

// Log in once and return a bearer token for the admin read-journey.
export function adminLogin() {
  const res = http.post(
    `${API}/auth/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    { headers: JSON_HEADERS, tags: { journey: 'auth' } },
  );
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Admin login failed (${res.status}) — check ADMIN_EMAIL / ADMIN_PASSWORD.`);
  }
  const token = res.json('accessToken');
  if (!token) throw new Error('Login succeeded but no accessToken in response.');
  return token;
}

// ---- per-VU fake IP so the throttler treats each VU as a distinct user ----
// In production, users come from different IPs; without this, all k6 VUs share
// 127.0.0.1 and get throttled together after 100 req/min.
// trust proxy (enabled in main.ts) makes NestJS honour X-Forwarded-For.
function vuHeaders() {
  // Deterministic per-VU IP in the 10.x.x.x private range — unique per VU.
  const a = 10;
  const b = Math.floor(__VU / 256) % 256;
  const c = __VU % 256;
  const d = 1;
  return { ...JSON_HEADERS, 'X-Forwarded-For': `${a}.${b}.${c}.${d}` };
}

// ---- public read journey: browse -> detail -> availability -> quote ----

export function browseJourney(rooms) {
  const hdrs = vuHeaders();

  // 1. Landing: featured + first page of rooms (what the homepage / /rooms loads).
  const featured = http.get(`${API}/rooms/featured`, { headers: hdrs, tags: { journey: 'browse' } });
  check(featured, { 'featured 200': (r) => r.status === 200 });

  const list = http.get(`${API}/rooms?page=1&limit=10`, { headers: hdrs, tags: { journey: 'browse' } });
  check(list, { 'rooms list 200': (r) => r.status === 200 });

  // 2. Pick a room and open its detail page.
  const room = pick(rooms);
  const detail = http.get(`${API}/rooms/${room.slug}`, { headers: hdrs, tags: { journey: 'room_detail' } });
  check(detail, { 'room detail 200': (r) => r.status === 200 });

  // 3. Check availability for a near-future stay.
  const { checkIn, checkOut } = futureDates(7 + Math.floor(Math.random() * 30), 1 + Math.floor(Math.random() * 4));
  const avail = http.get(
    `${API}/availability?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}`,
    { headers: hdrs, tags: { journey: 'availability' } },
  );
  check(avail, { 'availability 200': (r) => r.status === 200 });

  // 4. Get a price quote (pure compute, no persistence).
  const quote = http.post(
    `${API}/bookings/quote`,
    JSON.stringify({ roomId: room.id, checkIn, checkOut, adults: 2, children: 0 }),
    { headers: hdrs, tags: { journey: 'quote' } },
  );
  check(quote, { 'quote 2xx': (r) => r.status === 200 || r.status === 201 });

  // 5. Optional write path (off by default — throttled + persists rows).
  if (CREATE_BOOKINGS) {
    const booking = http.post(
      `${API}/bookings`,
      JSON.stringify({
        roomId: room.id,
        checkIn,
        checkOut,
        adults: 2,
        children: 0,
        fullName: `LoadTest VU${__VU}-${__ITER}`,
        email: `loadtest+vu${__VU}i${__ITER}@example.com`,
        phone: '+224600000000',
        country: 'GN',
      }),
      { headers: JSON_HEADERS, tags: { journey: 'create_booking' } },
    );
    // 429 (throttled) is an expected, non-failing outcome under load.
    check(booking, { 'booking created or throttled': (r) => [200, 201, 429].includes(r.status) });
  }
}

// ---- admin read journey: dashboard + lists + financial report ----

export function adminJourney(token) {
  const headers = { ...JSON_HEADERS, Authorization: `Bearer ${token}` };

  const dash = http.get(`${API}/admin/dashboard/revenue`, { headers, tags: { journey: 'admin_dashboard' } });
  check(dash, { 'admin dashboard 200': (r) => r.status === 200 });

  const bookings = http.get(`${API}/admin/bookings?page=1&limit=10`, { headers, tags: { journey: 'admin_bookings' } });
  check(bookings, { 'admin bookings 200': (r) => r.status === 200 });

  const report = http.get(`${API}/admin/reports/financial`, { headers, tags: { journey: 'admin_report' } });
  check(report, { 'financial report 200': (r) => r.status === 200 });
}
