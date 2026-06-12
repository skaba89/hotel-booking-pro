import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

// ── Fixtures ──────────────────────────────────────────────────────────────

const TOMORROW = new Date(Date.now() + 86_400_000);
const IN_3_DAYS = new Date(Date.now() + 3 * 86_400_000);

const fakeBooking = {
  id: 'booking-1',
  bookingReference: 'SET-2024-001',
  customerName: 'Alice Camara',
  customerEmail: 'alice@test.com',
  checkInDate: TOMORROW,
  checkOutDate: IN_3_DAYS,
  nights: 2,
  adults: 2,
  children: 0,
  totalAmount: 1_180_000,
  baseAmount: 1_000_000,
  taxesAmount: 180_000,
  discountAmount: 0,
  currency: 'GNF',
  paymentStatus: 'PENDING',
  bookingStatus: 'PENDING',
  room: { id: 'room-1', name: 'Suite Prestige', images: [] },
};

// ── Mocks ──────────────────────────────────────────────────────────────────

const prismaMock = {
  booking: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  invoice: {
    create: jest.fn(),
  },
  setting: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

const configMock = {
  get: jest.fn((key: string, defaultVal?: any) => {
    const values: Record<string, string> = {
      STRIPE_SECRET_KEY: '', // not configured
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      PAYPAL_CLIENT_ID: '',
      PAYPAL_CLIENT_SECRET: '',
      PAYPAL_MODE: 'sandbox',
      MOBILE_MONEY_WEBHOOK_SECRET: 'test-secret-32-chars-xxxxxxxxxxxxxxx',
      NODE_ENV: 'test',
    };
    return values[key] ?? defaultVal;
  }),
};

const emailMock = {
  sendPaymentConfirmation: jest.fn().mockResolvedValue(undefined),
  sendAdminPaymentReceived: jest.fn().mockResolvedValue(undefined),
};

// ── Suite ──────────────────────────────────────────────────────────────────

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
        { provide: EmailService, useValue: emailMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  // ── createStripeSession ─────────────────────────────────────────────────

  describe('createStripeSession', () => {
    it('throws BadRequestException if Stripe is not configured', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(fakeBooking);
      await expect(service.createStripeSession('SET-2024-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when booking does not exist', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);
      await expect(service.createStripeSession('INVALID')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when booking is already paid', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({ ...fakeBooking, paymentStatus: 'PAID' });
      await expect(service.createStripeSession('SET-2024-001')).rejects.toThrow(BadRequestException);
    });
  });

  // ── createPayPalOrder ───────────────────────────────────────────────────

  describe('createPayPalOrder', () => {
    it('creates a payment record and returns order info', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(fakeBooking);
      prismaMock.payment.create.mockResolvedValue({ id: 'pay-1' });

      const result = await service.createPayPalOrder('SET-2024-001');

      expect(result.bookingReference).toBe('SET-2024-001');
      expect(result.amount).toBe(1_180_000);
      expect(result.currency).toBe('GNF');
      expect(prismaMock.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paymentMethod: 'PAYPAL', status: 'INITIATED' }),
        }),
      );
    });

    it('throws NotFoundException when booking not found', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);
      await expect(service.createPayPalOrder('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  // ── initiateMobileMoney ─────────────────────────────────────────────────

  describe('initiateMobileMoney', () => {
    it('creates a PENDING payment and returns a user-facing message', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(fakeBooking);
      prismaMock.payment.create.mockResolvedValue({ id: 'pay-2' });

      const result = await service.initiateMobileMoney(
        'SET-2024-001',
        'orange_money',
        '+224612345678',
      );

      expect(result.message).toContain('1180000');
      expect(prismaMock.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });
  });

  // ── payAtHotel ──────────────────────────────────────────────────────────

  describe('payAtHotel', () => {
    it('throws if pay-at-hotel is disabled in settings', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(fakeBooking);
      prismaMock.setting.findUnique.mockResolvedValue({ value: 'false' });

      await expect(service.payAtHotel('SET-2024-001')).rejects.toThrow(BadRequestException);
    });

    it('confirms booking and sends email when pay-at-hotel is enabled', async () => {
      const confirmedBooking = { ...fakeBooking, paymentStatus: 'PAY_AT_HOTEL', bookingStatus: 'CONFIRMED' };

      prismaMock.booking.findUnique
        .mockResolvedValueOnce(fakeBooking) // getBookingByRef
        .mockResolvedValueOnce(confirmedBooking); // re-fetch after update

      prismaMock.setting.findUnique.mockResolvedValue({ value: 'true' });
      prismaMock.payment.create.mockResolvedValue({ id: 'pay-3' });
      prismaMock.booking.update.mockResolvedValue(confirmedBooking);

      const result = await service.payAtHotel('SET-2024-001');

      expect(result.message).toContain('Paiement à effectuer à l\'hôtel');
      expect(emailMock.sendPaymentConfirmation).toHaveBeenCalled();
    });
  });

  // ── confirmPayment ──────────────────────────────────────────────────────

  describe('confirmPayment', () => {
    it('sets booking to PAID + CONFIRMED and creates an invoice', async () => {
      const paidBooking = { ...fakeBooking, paymentStatus: 'PAID', bookingStatus: 'CONFIRMED', room: { ...fakeBooking.room } };

      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          booking: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(fakeBooking) // first call in transaction
              .mockResolvedValueOnce(paidBooking), // re-fetch at end
            update: jest.fn().mockResolvedValue(paidBooking),
          },
          payment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          invoice: { create: jest.fn().mockResolvedValue({ id: 'inv-1' }) },
        };
        return fn(tx);
      });

      await service.confirmPayment('SET-2024-001', 'stripe', 'sess_test_123');

      expect(emailMock.sendPaymentConfirmation).toHaveBeenCalled();
      expect(emailMock.sendAdminPaymentReceived).toHaveBeenCalled();
    });

    it('is idempotent — does nothing if already paid', async () => {
      const alreadyPaid = { ...fakeBooking, paymentStatus: 'PAID' };

      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          booking: { findUnique: jest.fn().mockResolvedValue(alreadyPaid), update: jest.fn() },
          payment: { updateMany: jest.fn() },
          invoice: { create: jest.fn() },
        };
        const result = await fn(tx);
        // Should return null immediately (idempotency guard)
        expect(result).toBeNull();
        return result;
      });

      await service.confirmPayment('SET-2024-001', 'stripe', 'sess_test_456');

      // Emails must NOT be sent for a duplicate webhook
      expect(emailMock.sendPaymentConfirmation).not.toHaveBeenCalled();
    });

    it('does nothing if booking not found', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          booking: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
          payment: { updateMany: jest.fn() },
          invoice: { create: jest.fn() },
        };
        return fn(tx);
      });

      await service.confirmPayment('NONEXISTENT', 'stripe', 'sess_test_789');
      expect(emailMock.sendPaymentConfirmation).not.toHaveBeenCalled();
    });
  });

  // ── simulateMobileMoneyConfirm ──────────────────────────────────────────

  describe('simulateMobileMoneyConfirm', () => {
    it('throws BadRequestException in production', async () => {
      // Use a dedicated module with NODE_ENV=production to avoid contaminating the shared configMock
      const prodConfig = { get: (key: string) => (key === 'NODE_ENV' ? 'production' : '') };
      const prodModule = await Test.createTestingModule({
        providers: [
          PaymentsService,
          { provide: PrismaService, useValue: prismaMock },
          { provide: ConfigService, useValue: prodConfig },
          { provide: EmailService, useValue: emailMock },
        ],
      }).compile();
      const prodService = prodModule.get<PaymentsService>(PaymentsService);

      await expect(prodService.simulateMobileMoneyConfirm('SET-2024-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when booking not found', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);
      await expect(service.simulateMobileMoneyConfirm('INVALID')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when booking is already paid', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({ ...fakeBooking, paymentStatus: 'PAID' });
      await expect(service.simulateMobileMoneyConfirm('SET-2024-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when no pending Mobile Money payment found', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(fakeBooking);
      prismaMock.payment.findFirst.mockResolvedValue(null);

      await expect(service.simulateMobileMoneyConfirm('SET-2024-001')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('confirms Mobile Money payment in test mode', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(fakeBooking);
      prismaMock.payment.findFirst.mockResolvedValue({
        id: 'pay-mm-1',
        provider: 'orange_money',
        paymentMethod: 'ORANGE_MONEY',
        status: 'PENDING',
      });

      // confirmPayment will call $transaction
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          booking: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(fakeBooking)
              .mockResolvedValueOnce({ ...fakeBooking, paymentStatus: 'PAID', bookingStatus: 'CONFIRMED' }),
            update: jest.fn(),
          },
          payment: { updateMany: jest.fn() },
          invoice: { create: jest.fn() },
        };
        return fn(tx);
      });

      const result = await service.simulateMobileMoneyConfirm('SET-2024-001');
      expect(result.message).toContain('simulé');
    });
  });

  // ── verifyMobileMoneySignature ──────────────────────────────────────────

  describe('verifyMobileMoneySignature', () => {
    const SECRET = 'test-secret-32-chars-xxxxxxxxxxxxxxx';

    // Helper: build a fresh service with a specific MOBILE_MONEY_WEBHOOK_SECRET value
    async function serviceWithSecret(secretVal: string): Promise<PaymentsService> {
      const cfg = { get: (key: string) => (key === 'MOBILE_MONEY_WEBHOOK_SECRET' ? secretVal : '') };
      const mod = await Test.createTestingModule({
        providers: [
          PaymentsService,
          { provide: PrismaService, useValue: prismaMock },
          { provide: ConfigService, useValue: cfg },
          { provide: EmailService, useValue: emailMock },
        ],
      }).compile();
      return mod.get<PaymentsService>(PaymentsService);
    }

    it('returns false when secret is not configured', async () => {
      const svc = await serviceWithSecret('');
      expect(svc.verifyMobileMoneySignature('body', 'sig')).toBe(false);
    });

    it('returns true with a valid HMAC-SHA256 signature', async () => {
      const { createHmac } = require('crypto');
      const body = '{"bookingReference":"SET-2024-001","status":"SUCCESS"}';
      const validSig = createHmac('sha256', SECRET).update(body).digest('hex');

      const svc = await serviceWithSecret(SECRET);
      expect(svc.verifyMobileMoneySignature(body, validSig)).toBe(true);
    });

    it('returns false with an incorrect signature', async () => {
      const svc = await serviceWithSecret(SECRET);
      expect(svc.verifyMobileMoneySignature('body', 'bad-signature')).toBe(false);
    });
  });
});
