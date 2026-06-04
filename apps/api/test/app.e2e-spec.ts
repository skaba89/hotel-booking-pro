/**
 * E2E tests — Hotel Booking Pro API
 *
 * Full NestJS application with:
 *  - PrismaService replaced by an in-memory mock (no real DB needed)
 *  - ThrottlerGuard replaced by a permissive pass-through (no 429 noise)
 *  - All other modules (auth, bookings, payments, rooms, admin…) fully active
 *
 * Covers: health, rooms, auth CRUD, booking lifecycle, Mobile Money, admin RBAC,
 *         ValidationPipe enforcement, SanitizePipe XSS stripping.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';

// ── App modules ───────────────────────────────────────────────────────────────
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../src/prisma/prisma.module';
import { AuthModule } from '../src/auth/auth.module';
import { RoomsModule } from '../src/rooms/rooms.module';
import { BookingsModule } from '../src/bookings/bookings.module';
import { PaymentsModule } from '../src/payments/payments.module';
import { InvoicesModule } from '../src/invoices/invoices.module';
import { DocumentsModule } from '../src/documents/documents.module';
import { ExpensesModule } from '../src/expenses/expenses.module';
import { ServicesModule } from '../src/services/services.module';
import { ReviewsModule } from '../src/reviews/reviews.module';
import { ContactModule } from '../src/contact/contact.module';
import { SettingsModule } from '../src/settings/settings.module';
import { AdminModule } from '../src/admin/admin.module';
import { EmailModule } from '../src/email/email.module';
import { PdfModule } from '../src/pdf/pdf.module';
import { WebhooksModule } from '../src/webhooks/webhooks.module';
import { StaffModule } from '../src/staff/staff.module';
import { CloudinaryModule } from '../src/cloudinary/cloudinary.module';
import { HealthModule } from '../src/health/health.module';

import { PrismaService } from '../src/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { SanitizePipe } from '../src/common/pipes/sanitize.pipe';

// ── Permissive throttler guard ────────────────────────────────────────────────
class NoopThrottlerGuard implements CanActivate {
  canActivate(_ctx: ExecutionContext) { return true; }
}

// ── Dates ─────────────────────────────────────────────────────────────────────
const TOMORROW  = new Date(Date.now() + 1 * 86_400_000).toISOString().split('T')[0];
const IN_3_DAYS = new Date(Date.now() + 3 * 86_400_000).toISOString().split('T')[0];

const TEST_USER = {
  email: 'e2e@setifana-test.com',
  password: 'TestPass123!',
  fullName: 'E2E Tester',
  phone: '+224600000001',
};

// ── In-memory Prisma mock ─────────────────────────────────────────────────────
class InMemoryPrisma {
  private seq = 1;
  private id() { return `id-${this.seq++}`; }

  private _users:    any[] = [];
  private _customers: any[] = [];
  private _bookings:  any[] = [];
  private _payments:  any[] = [];
  private _refreshTokens: any[] = [];
  private _emailTokens:   any[] = [];
  private _rooms: any[] = [{
    id: 'room-e2e-1', name: 'Suite Test', slug: 'suite-test',
    pricePerNight: 500_000, adultsCapacity: 2, childrenCapacity: 1,
    capacity: 3, status: 'AVAILABLE', isFeatured: true,
    images: [], priceRules: [], shortDescription: 'Suite de test',
  }];
  private _settings: any[] = [
    { key: 'pay_at_hotel_enabled', value: 'true' },
    { key: 'hotel_tax_rate', value: '18' },
  ];

  user = {
    findUnique: async ({ where, select }: any) => {
      const u = where?.id    ? this._users.find(u => u.id    === where.id)
              : where?.email ? this._users.find(u => u.email === where.email)
              : null;
      if (!u || !select) return u ?? null;
      return Object.fromEntries(Object.keys(select).map(k => [k, u[k]]));
    },
    create: async ({ data }: any) => {
      const u = { id: this.id(), isActive: true, createdAt: new Date(), emailVerifiedAt: null, ...data };
      this._users.push(u);
      return u;
    },
    update: async ({ where, data, select }: any) => {
      const idx = this._users.findIndex(u => u.id === where.id);
      if (idx >= 0) this._users[idx] = { ...this._users[idx], ...data };
      const u = this._users[idx];
      if (!u || !select) return u ?? null;
      return Object.fromEntries(Object.keys(select).map(k => [k, u[k]]));
    },
  };

  customer = {
    findUnique: async ({ where }: any) =>
      this._customers.find(c =>
        where.userId ? c.userId === where.userId : c.email === where.email
      ) ?? null,
    findFirst: async ({ where }: any) =>
      (where?.email ? this._customers.find(c => c.email === where.email) : null) ?? null,
    create: async ({ data }: any) => {
      const c = { id: this.id(), ...data };
      this._customers.push(c);
      return c;
    },
    updateMany: async () => ({ count: 0 }),
  };

  room = {
    findUnique: async ({ where }: any) =>
      this._rooms.find(r => (where.id ? r.id === where.id : r.slug === where.slug)) ?? null,
    findMany: async ({ where }: any) => {
      if (where?.status?.not) return this._rooms.filter(r => r.status !== where.status.not);
      return this._rooms;
    },
    count: async () => this._rooms.length,
  };

  private enrichBooking = (b: any) => ({
    ...b,
    room: { ...this._rooms[0], images: [] },
    payments: [],
    invoices: [],
  });

  booking = {
    findUnique: async ({ where }: any) => {
      const b = where.id
        ? this._bookings.find(b => b.id === where.id)
        : this._bookings.find(b => b.bookingReference === where.bookingReference);
      return b ? this.enrichBooking(b) : null;
    },
    findFirst: async () => null,
    findMany: async ({ where }: any) =>
      this._bookings
        .filter(b => !where?.customerId || b.customerId === where.customerId)
        .map(b => this.enrichBooking(b)),
    create: async ({ data }: any) => {
      const b = { id: this.id(), createdAt: new Date(), ...data };
      this._bookings.push(b);
      return this.enrichBooking(b);
    },
    update: async ({ where, data }: any) => {
      const idx = this._bookings.findIndex(b => b.id === where.id);
      if (idx >= 0) this._bookings[idx] = { ...this._bookings[idx], ...data };
      return this.enrichBooking(this._bookings[idx]);
    },
    count: async () => this._bookings.length,
  };

  payment = {
    create: async ({ data }: any) => {
      const p = { id: this.id(), createdAt: new Date(), ...data };
      this._payments.push(p);
      return p;
    },
    findFirst: async ({ where }: any) =>
      this._payments.find(p =>
        (!where.bookingId || p.bookingId === where.bookingId) &&
        (!where.status    || p.status    === where.status)
      ) ?? null,
    updateMany: async () => ({ count: 1 }),
  };

  invoice    = { create: async ({ data }: any) => ({ id: this.id(), ...data }) };

  refreshToken = {
    findUnique: async ({ where }: any) => this._refreshTokens.find(t => t.id === where.id) ?? null,
    create: async ({ data }: any) => { this._refreshTokens.push({ ...data }); return data; },
    delete: async ({ where }: any) => {
      this._refreshTokens = this._refreshTokens.filter(t => t.id !== where.id);
      return {};
    },
    deleteMany: async ({ where }: any) => {
      const before = this._refreshTokens.length;
      if (where?.userId) this._refreshTokens = this._refreshTokens.filter(t => t.userId !== where.userId);
      return { count: before - this._refreshTokens.length };
    },
  };

  emailVerificationToken = {
    findUnique: async ({ where }: any) => this._emailTokens.find(t => t.id === where.id) ?? null,
    create: async ({ data }: any) => { this._emailTokens.push({ ...data }); return data; },
    delete: async ({ where }: any) => {
      this._emailTokens = this._emailTokens.filter(t => t.id !== where.id);
      return {};
    },
    deleteMany: async () => ({ count: 0 }),
  };

  passwordResetToken = {
    findUnique: async () => null,
    create: async ({ data }: any) => data,
    delete: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
  };

  setting      = { findUnique: async ({ where }: any) => this._settings.find(s => s.key === where.key) ?? null };
  priceRule    = { findFirst: async () => null };
  availabilityBlock = { findMany: async () => [] };
  auditLog     = { create: async () => ({}) };
  contactMessage = {
    create: async ({ data }: any) => ({ id: this.id(), createdAt: new Date(), status: 'NEW', ...data }),
    findMany: async () => [],
  };
  newsletterSubscriber = {
    findUnique: async () => null,
    create: async ({ data }: any) => ({ id: this.id(), isActive: true, ...data }),
    update: async ({ data }: any) => data,
    count: async () => 0,
  };

  // Tagged template literal–compatible $queryRaw
  $queryRaw = Object.assign(
    async function $queryRaw() { return []; },
    { [Symbol.toPrimitive]: () => '$queryRaw' }
  );

  async $transaction(fn: any) {
    if (typeof fn === 'function') return fn(this);
    const results = [];
    for (const op of fn) results.push(await (typeof op === 'function' ? op() : op));
    return results;
  }

  async $connect() {}
  async $disconnect() {}
}

// ── Application factory ───────────────────────────────────────────────────────

async function createTestApp(): Promise<INestApplication> {
  // Build the module manually (identical to AppModule) but with:
  //  - NoopThrottlerGuard as APP_GUARD (no rate limiting in tests)
  //  - ThrottlerModule still imported (guards need it for DI) but harmless
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      ThrottlerModule.forRoot([{ ttl: 1, limit: 100_000 }]),
      CacheModule.register({ isGlobal: true, ttl: 60_000, max: 1000 }),
      PrismaModule,
      AuthModule,
      RoomsModule,
      BookingsModule,
      PaymentsModule,
      InvoicesModule,
      DocumentsModule,
      ExpensesModule,
      ServicesModule,
      ReviewsModule,
      ContactModule,
      SettingsModule,
      AdminModule,
      EmailModule,
      PdfModule,
      WebhooksModule,
      StaffModule,
      CloudinaryModule,
      HealthModule,
    ],
    providers: [
      // Replace ThrottlerGuard with a no-op so tests never see 429
      { provide: APP_GUARD, useClass: NoopThrottlerGuard },
    ],
  })
    .overrideProvider(PrismaService)
    .useValue(new InMemoryPrisma())
    .compile();

  const app = module.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api', {
    exclude: ['webhooks/stripe', 'webhooks/paypal', 'webhooks/mobile-money'],
  });
  await app.init();
  return app;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Hotel Booking API — E2E', () => {
  let app: INestApplication;
  let http: any;
  let accessToken: string;
  let bookingReference: string;

  beforeAll(async () => {
    app  = await createTestApp();
    http = app.getHttpServer();
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  // ── 1. Health ─────────────────────────────────────────────────────────────

  describe('GET /api/health', () => {
    it('returns 200 and an ok/degraded status', async () => {
      const res = await request(http).get('/api/health');
      expect(res.status).toBe(200);
      expect(['ok', 'degraded']).toContain(res.body.status);
      expect(res.body.timestamp).toBeDefined();
      // services.api is always 'ok' (only DB can degrade)
      if (res.body.services) {
        expect(res.body.services.api).toBe('ok');
      }
    });
  });

  // ── 2. Rooms — public ────────────────────────────────────────────────────

  describe('GET /api/rooms', () => {
    it('returns room list without authentication', async () => {
      const res = await request(http).get('/api/rooms');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ── 3. Auth — register ───────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('creates an account and returns JWT tokens', async () => {
      const res = await request(http).post('/api/auth/register').send(TEST_USER);
      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(TEST_USER.email);
      accessToken = res.body.accessToken;
    });

    it('returns 409 for duplicate email', async () => {
      const res = await request(http).post('/api/auth/register').send(TEST_USER);
      expect(res.status).toBe(409);
    });

    it('returns 400 for invalid email', async () => {
      const res = await request(http)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'Valid1234!', fullName: 'Test' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for password shorter than 8 chars', async () => {
      const res = await request(http)
        .post('/api/auth/register')
        .send({ email: 'newuser@test.com', password: 'short', fullName: 'User' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when fullName is missing', async () => {
      const res = await request(http)
        .post('/api/auth/register')
        .send({ email: 'another@test.com', password: 'ValidPass1!' });
      expect(res.status).toBe(400);
    });
  });

  // ── 4. Auth — login ──────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('returns tokens for valid credentials', async () => {
      const res = await request(http)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });
      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      accessToken = res.body.accessToken;
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(http)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: 'WrongPassword!' });
      expect(res.status).toBe(401);
    });

    it('returns 401 for unknown email', async () => {
      const res = await request(http)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'AnyPass123!' });
      expect(res.status).toBe(401);
    });
  });

  // ── 5. Auth — protected routes ───────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('returns profile for authenticated user', async () => {
      const res = await request(http)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(TEST_USER.email);
    });

    it('returns 401 without token', async () => {
      const res = await request(http).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with malformed token', async () => {
      const res = await request(http)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.valid.token');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/auth/profile', () => {
    it('updates profile when authenticated', async () => {
      const res = await request(http)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ fullName: 'Updated Name' });
      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe('Updated Name');
    });

    it('returns 401 without token', async () => {
      const res = await request(http)
        .patch('/api/auth/profile')
        .send({ fullName: 'Hacker' });
      expect(res.status).toBe(401);
    });
  });

  // ── 6. Bookings — quote ──────────────────────────────────────────────────

  describe('POST /api/bookings/quote', () => {
    it('calculates a correct quote for valid dates', async () => {
      const res = await request(http)
        .post('/api/bookings/quote')
        .send({ roomId: 'room-e2e-1', checkIn: TOMORROW, checkOut: IN_3_DAYS, adults: 2, children: 0 });
      expect(res.status).toBe(201);
      expect(res.body.nights).toBe(2);
      expect(res.body.currency).toBe('GNF');
      expect(typeof res.body.totalAmount).toBe('number');
      expect(res.body.totalAmount).toBeGreaterThan(0);
    });

    it('returns 400 for past check-in', async () => {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
      const res = await request(http)
        .post('/api/bookings/quote')
        .send({ roomId: 'room-e2e-1', checkIn: yesterday, checkOut: TOMORROW, adults: 1, children: 0 });
      expect(res.status).toBe(400);
    });

    it('returns 400 when check-out equals check-in', async () => {
      const res = await request(http)
        .post('/api/bookings/quote')
        .send({ roomId: 'room-e2e-1', checkIn: TOMORROW, checkOut: TOMORROW, adults: 1, children: 0 });
      expect(res.status).toBe(400);
    });
  });

  // ── 7. Bookings — create ─────────────────────────────────────────────────

  describe('POST /api/bookings', () => {
    it('creates a booking and returns a reference string', async () => {
      const res = await request(http)
        .post('/api/bookings')
        .send({
          roomId: 'room-e2e-1', checkIn: TOMORROW, checkOut: IN_3_DAYS,
          adults: 2, children: 0,
          fullName: 'Alice Camara', email: 'alice-e2e@test.com',
          phone: '+224612345678', country: 'Guinée',
        });
      expect(res.status).toBe(201);
      expect(typeof res.body.bookingReference).toBe('string');
      expect(res.body.bookingReference.length).toBeGreaterThan(4);
      bookingReference = res.body.bookingReference;
    });

    it('returns 400 when adults exceed capacity', async () => {
      const res = await request(http)
        .post('/api/bookings')
        .send({
          roomId: 'room-e2e-1', checkIn: TOMORROW, checkOut: IN_3_DAYS,
          adults: 99, children: 0,
          fullName: 'Bob', email: 'bob@test.com', phone: '+224600000002', country: 'Guinée',
        });
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(http)
        .post('/api/bookings')
        .send({ roomId: 'room-e2e-1', checkIn: TOMORROW });
      expect(res.status).toBe(400);
    });
  });

  // ── 8. Bookings — track ──────────────────────────────────────────────────

  describe('GET /api/bookings/:reference', () => {
    it('returns booking by reference', async () => {
      const res = await request(http).get(`/api/bookings/${bookingReference}`);
      expect(res.status).toBe(200);
      expect(res.body.bookingReference).toBe(bookingReference);
    });

    it('returns 404 for unknown reference', async () => {
      const res = await request(http).get('/api/bookings/STF-UNKNOWN-REFERENCE');
      expect(res.status).toBe(404);
    });
  });

  // ── 9. Payments — Mobile Money ───────────────────────────────────────────

  describe('POST /api/payments/mobile-money/initiate', () => {
    it('initiates a Mobile Money payment', async () => {
      const res = await request(http)
        .post('/api/payments/mobile-money/initiate')
        .send({ bookingReference, provider: 'orange_money', phoneNumber: '+224612345678' });
      expect(res.status).toBe(201);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /api/payments/mobile-money/simulate', () => {
    it('confirms Mobile Money in test mode', async () => {
      const res = await request(http)
        .post('/api/payments/mobile-money/simulate')
        .send({ bookingReference });
      expect(res.status).toBe(201);
      expect(res.body.message).toBeDefined();
    });
  });

  // ── 10. Admin — RBAC ─────────────────────────────────────────────────────

  describe('Admin routes — RBAC', () => {
    it('GET /api/admin/dashboard/stats → 401 without token', async () => {
      const res = await request(http).get('/api/admin/dashboard/stats');
      expect(res.status).toBe(401);
    });

    it('GET /api/admin/dashboard/stats → 403 for CUSTOMER role', async () => {
      const res = await request(http)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${accessToken}`);
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/admin/bookings → 401 without token', async () => {
      const res = await request(http).get('/api/admin/bookings');
      expect(res.status).toBe(401);
    });

    it('PATCH /api/admin/bookings/:id/status → 401 without token', async () => {
      const res = await request(http)
        .patch('/api/admin/bookings/some-id/status')
        .send({ status: 'CONFIRMED' });
      expect(res.status).toBe(401);
    });
  });

  // ── 11. Security — ValidationPipe & SanitizePipe ─────────────────────────

  describe('Security', () => {
    it('ValidationPipe rejects extra fields (forbidNonWhitelisted)', async () => {
      const res = await request(http)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password, injected: 'field' });
      expect(res.status).toBe(400);
    });

    it('ValidationPipe rejects completely empty body', async () => {
      const res = await request(http).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });

    it('SanitizePipe strips HTML from contact message (no script tag in response)', async () => {
      const res = await request(http)
        .post('/api/contact')
        .send({
          fullName: '<script>alert(1)</script>Alice',
          email: 'alice@test.com',
          message: 'Bonjour<img src=x onerror=alert(1)>',
          subject: 'Test',
        });
      expect([201, 400]).toContain(res.status);
      if (res.status === 201) {
        expect(JSON.stringify(res.body)).not.toContain('<script>');
        expect(JSON.stringify(res.body)).not.toContain('onerror');
      }
    });

    it('Webhook endpoints are reachable without JWT (no 401)', async () => {
      // Webhooks must NOT be behind the JWT guard
      const res = await request(http)
        .post('/webhooks/mobile-money')
        .send({ status: 'test' });
      // 400 (bad signature) is fine — just not 401 (auth required)
      expect(res.status).not.toBe(401);
    });
  });

  // ── 12. Auth — logout ────────────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('logs out and returns success message', async () => {
      const res = await request(http)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Déconnexion');
    });
  });
});
