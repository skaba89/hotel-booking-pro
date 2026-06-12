import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { EmailService } from '../email/email.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TOMORROW = new Date(Date.now() + 86_400_000);
const IN_3_DAYS = new Date(Date.now() + 3 * 86_400_000);
const _IN_5_DAYS = new Date(Date.now() + 5 * 86_400_000); // reserved for future tests
const YESTERDAY = new Date(Date.now() - 86_400_000);

const toISO = (d: Date) => d.toISOString().split('T')[0];

const fakeRoom = {
  id: 'room-1',
  name: 'Suite Prestige',
  slug: 'suite-prestige',
  pricePerNight: 500_000,
  adultsCapacity: 2,
  childrenCapacity: 1,
  capacity: 3,
};

const fakeBookingDto = {
  roomId: 'room-1',
  checkIn: toISO(TOMORROW),
  checkOut: toISO(IN_3_DAYS),
  adults: 2,
  children: 0,
  fullName: 'Alice Camara',
  email: 'alice@test.com',
  phone: '+224612345678',
  country: 'Guinée',
};

const fakeCreatedBooking = {
  id: 'booking-1',
  bookingReference: 'SET-2024-001',
  customerId: 'cust-1',
  roomId: 'room-1',
  customerName: 'Alice Camara',
  customerEmail: 'alice@test.com',
  checkInDate: TOMORROW,
  checkOutDate: IN_3_DAYS,
  nights: 2,
  adults: 2,
  children: 0,
  baseAmount: 1_000_000,
  taxesAmount: 180_000,
  discountAmount: 0,
  totalAmount: 1_180_000,
  currency: 'GNF',
  paymentStatus: 'PENDING',
  bookingStatus: 'PENDING',
  room: { ...fakeRoom, images: [] },
};

// ── Mocks ────────────────────────────────────────────────────────────────────

const prismaMock = {
  booking: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  customer: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  setting: {
    findUnique: jest.fn(),
  },
  priceRule: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
};

const roomsServiceMock = {
  findById: jest.fn(),
  checkAvailability: jest.fn(),
};

const emailServiceMock = {
  sendBookingConfirmation: jest.fn().mockResolvedValue(undefined),
  sendAdminNewBooking: jest.fn().mockResolvedValue(undefined),
  sendBookingCancellation: jest.fn().mockResolvedValue(undefined),
};

// ── Suite ────────────────────────────────────────────────────────────────────

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RoomsService, useValue: roomsServiceMock },
        { provide: EmailService, useValue: emailServiceMock },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  // ── getQuote ──────────────────────────────────────────────────────────────

  describe('getQuote', () => {
    beforeEach(() => {
      roomsServiceMock.findById.mockResolvedValue(fakeRoom);
      prismaMock.setting.findUnique.mockResolvedValue({ value: '18' });
      prismaMock.priceRule.findFirst.mockResolvedValue(null);
    });

    it('calculates nights, base, taxes, total correctly', async () => {
      const result = await service.getQuote({
        roomId: 'room-1',
        checkIn: toISO(TOMORROW),
        checkOut: toISO(IN_3_DAYS),
        adults: 2,
        children: 0,
      });

      expect(result.nights).toBe(2);
      expect(result.pricePerNight).toBe(500_000);
      expect(result.baseAmount).toBe(1_000_000);
      expect(result.taxesAmount).toBe(180_000);
      expect(result.totalAmount).toBe(1_180_000);
      expect(result.currency).toBe('GNF');
    });

    it('throws if check-in is in the past', async () => {
      await expect(
        service.getQuote({
          roomId: 'room-1',
          checkIn: toISO(YESTERDAY),
          checkOut: toISO(TOMORROW),
          adults: 1,
          children: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws if check-out is before or equal to check-in', async () => {
      await expect(
        service.getQuote({
          roomId: 'room-1',
          checkIn: toISO(TOMORROW),
          checkOut: toISO(TOMORROW),
          adults: 1,
          children: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('applies a price rule when one is active', async () => {
      prismaMock.priceRule.findFirst
        .mockResolvedValueOnce({ pricePerNight: 600_000 }) // getEffectivePrice
        .mockResolvedValueOnce(null); // calculateDiscount

      const result = await service.getQuote({
        roomId: 'room-1',
        checkIn: toISO(TOMORROW),
        checkOut: toISO(IN_3_DAYS),
        adults: 1,
        children: 0,
      });

      expect(result.pricePerNight).toBe(600_000);
      expect(result.baseAmount).toBe(1_200_000);
    });

    it('applies a discount when a discount rule is active', async () => {
      prismaMock.priceRule.findFirst
        .mockResolvedValueOnce(null) // getEffectivePrice → use default
        .mockResolvedValueOnce({ discountPercent: 10 }); // calculateDiscount

      const result = await service.getQuote({
        roomId: 'room-1',
        checkIn: toISO(TOMORROW),
        checkOut: toISO(IN_3_DAYS),
        adults: 1,
        children: 0,
      });

      expect(result.discountAmount).toBe(100_000); // 10% of 1_000_000
    });

    it('uses default 18% tax when no setting found', async () => {
      prismaMock.setting.findUnique.mockResolvedValue(null);
      prismaMock.priceRule.findFirst.mockResolvedValue(null);

      const result = await service.getQuote({
        roomId: 'room-1',
        checkIn: toISO(TOMORROW),
        checkOut: toISO(IN_3_DAYS),
        adults: 1,
        children: 0,
      });

      expect(result.taxesAmount).toBe(180_000);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    beforeEach(() => {
      roomsServiceMock.findById.mockResolvedValue(fakeRoom);
      roomsServiceMock.checkAvailability.mockResolvedValue(true);
      prismaMock.setting.findUnique.mockResolvedValue({ value: '18' });
      prismaMock.priceRule.findFirst.mockResolvedValue(null);

      // $transaction: call the callback with a tx proxy
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([]),
          booking: {
            findFirst: jest.fn().mockResolvedValue(null), // no overlap
            create: jest.fn().mockResolvedValue(fakeCreatedBooking),
          },
          customer: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'cust-1', email: 'alice@test.com' }),
          },
        };
        return fn(tx);
      });
    });

    it('creates a booking successfully', async () => {
      const result = await service.create(fakeBookingDto);
      expect(result.bookingReference).toBe('SET-2024-001');
      expect(emailServiceMock.sendBookingConfirmation).toHaveBeenCalled();
    });

    it('throws if check-in is in the past', async () => {
      await expect(
        service.create({ ...fakeBookingDto, checkIn: toISO(YESTERDAY) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws if adults exceed room capacity', async () => {
      await expect(
        service.create({ ...fakeBookingDto, adults: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws if children exceed room capacity', async () => {
      await expect(
        service.create({ ...fakeBookingDto, children: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException if room is not available (pre-transaction check)', async () => {
      roomsServiceMock.checkAvailability.mockResolvedValue(false);
      await expect(service.create(fakeBookingDto)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException if overlapping booking found inside transaction', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([]),
          booking: {
            findFirst: jest.fn().mockResolvedValue({ id: 'other-booking' }), // OVERLAP
            create: jest.fn(),
          },
          customer: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
        };
        return fn(tx);
      });

      await expect(service.create(fakeBookingDto)).rejects.toThrow(ConflictException);
    });

    it('reuses existing customer if email already exists', async () => {
      const existingCustomer = { id: 'existing-cust', email: 'alice@test.com' };
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([]),
          booking: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(fakeCreatedBooking),
          },
          customer: {
            findFirst: jest.fn().mockResolvedValue(existingCustomer), // existing
            create: jest.fn(),
          },
        };
        const result = await fn(tx);
        // Ensure customer.create was NOT called
        expect(tx.customer.create).not.toHaveBeenCalled();
        return result;
      });

      await service.create(fakeBookingDto);
    });
  });

  // ── findByReference ───────────────────────────────────────────────────────

  describe('findByReference', () => {
    it('returns booking when found', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(fakeCreatedBooking);
      const result = await service.findByReference('SET-2024-001');
      expect(result.bookingReference).toBe('SET-2024-001');
    });

    it('throws NotFoundException when not found', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);
      await expect(service.findByReference('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findByReferenceSecure ──────────────────────────────────────────────────

  describe('findByReferenceSecure', () => {
    it('returns booking when reference + email match', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(fakeCreatedBooking);
      const result = await service.findByReferenceSecure('SET-2024-001', 'alice@test.com');
      expect(result.bookingReference).toBe('SET-2024-001');
    });

    it('throws NotFoundException when email does not match', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(fakeCreatedBooking);
      await expect(
        service.findByReferenceSecure('SET-2024-001', 'wrong@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when booking not found', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);
      await expect(
        service.findByReferenceSecure('INVALID', 'alice@test.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('transitions PENDING → CONFIRMED successfully', async () => {
      const booking = { ...fakeCreatedBooking, bookingStatus: 'PENDING' };
      prismaMock.booking.findUnique.mockResolvedValue(booking);
      prismaMock.booking.update.mockResolvedValue({ ...booking, bookingStatus: 'CONFIRMED' });

      const result = await service.updateStatus('booking-1', 'CONFIRMED');
      expect(result.bookingStatus).toBe('CONFIRMED');
    });

    it('throws BadRequestException on invalid transition', async () => {
      const booking = { ...fakeCreatedBooking, bookingStatus: 'COMPLETED' };
      prismaMock.booking.findUnique.mockResolvedValue(booking);

      await expect(service.updateStatus('booking-1', 'PENDING')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when booking does not exist', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus('non-existent', 'CONFIRMED')).rejects.toThrow(NotFoundException);
    });

    it('sends cancellation email when status is CANCELLED', async () => {
      const booking = { ...fakeCreatedBooking, bookingStatus: 'PENDING' };
      prismaMock.booking.findUnique.mockResolvedValue(booking);
      prismaMock.booking.update.mockResolvedValue({ ...booking, bookingStatus: 'CANCELLED', room: fakeRoom });

      await service.updateStatus('booking-1', 'CANCELLED', 'Client request');
      expect(emailServiceMock.sendBookingCancellation).toHaveBeenCalled();
    });
  });

  // ── cancelByReferenceSecure ───────────────────────────────────────────────

  describe('cancelByReferenceSecure', () => {
    it('throws if booking is already cancelled', async () => {
      const cancelled = { ...fakeCreatedBooking, bookingStatus: 'CANCELLED' };
      prismaMock.booking.findUnique.mockResolvedValue(cancelled);
      await expect(
        service.cancelByReferenceSecure('SET-2024-001', 'alice@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws if booking is completed', async () => {
      const completed = { ...fakeCreatedBooking, bookingStatus: 'COMPLETED' };
      prismaMock.booking.findUnique.mockResolvedValue(completed);
      await expect(
        service.cancelByReferenceSecure('SET-2024-001', 'alice@test.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── findByReferenceLimited ────────────────────────────────────────────────

  describe('findByReferenceLimited', () => {
    it('returns limited fields when booking exists', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        bookingReference: 'SET-2024-001',
        customerName: 'Alice Camara',
        paymentStatus: 'PENDING',
        bookingStatus: 'PENDING',
        room: { id: 'room-1', name: 'Suite', slug: 'suite', images: [] },
      });

      const result = await service.findByReferenceLimited('SET-2024-001');
      expect(result.bookingReference).toBe('SET-2024-001');
    });

    it('throws NotFoundException when booking not found', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);
      await expect(service.findByReferenceLimited('INVALID')).rejects.toThrow(NotFoundException);
    });
  });
});
