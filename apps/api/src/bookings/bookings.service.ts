import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { EmailService } from '../email/email.service';
import { CreateBookingDto, QuoteDto, BookingQueryDto } from './bookings.dto';
import { generateBookingReference, calculateNights } from '../common/utils';
import { isValidTransition, transitionErrorMessage, requiresAvailabilityRecheck } from './booking-status';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private roomsService: RoomsService,
    private emailService: EmailService,
  ) {}

  async getQuote(dto: QuoteDto) {
    const room = await this.roomsService.findById(dto.roomId);
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (checkIn < now) throw new BadRequestException('La date d\'arrivée ne peut pas être dans le passé');
    if (checkOut <= checkIn) throw new BadRequestException('La date de départ doit être après la date d\'arrivée');

    const nights = calculateNights(dto.checkIn, dto.checkOut);

    if (nights < 1) throw new BadRequestException('La date de départ doit être après la date d\'arrivée');

    const pricePerNight = await this.getEffectivePrice(dto.roomId, dto.checkIn, dto.checkOut, Number(room.pricePerNight));
    const baseAmount = pricePerNight * nights;

    const taxRateSetting = await this.prisma.setting.findUnique({ where: { key: 'hotel_tax_rate' } });
    const taxRate = taxRateSetting ? parseFloat(taxRateSetting.value) : 18;
    const taxesAmount = Math.round(baseAmount * taxRate / 100);

    const discount = await this.calculateDiscount(dto.roomId, nights, baseAmount);
    const totalAmount = baseAmount + taxesAmount - discount;

    return {
      roomId: room.id,
      roomName: room.name,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      nights,
      pricePerNight,
      baseAmount,
      taxesAmount,
      discountAmount: discount,
      totalAmount,
      currency: 'GNF',
    };
  }

  async create(dto: CreateBookingDto) {
    const room = await this.roomsService.findById(dto.roomId);
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (checkIn < now) throw new BadRequestException('La date d\'arrivée ne peut pas être dans le passé');
    if (checkOut <= checkIn) throw new BadRequestException('La date de départ doit être après la date d\'arrivée');

    const nights = calculateNights(dto.checkIn, dto.checkOut);

    if (nights < 1) throw new BadRequestException('Dates invalides');
    if (dto.adults > room.adultsCapacity) throw new BadRequestException('Trop d\'adultes pour cette chambre');
    if (dto.children > room.childrenCapacity) throw new BadRequestException('Trop d\'enfants pour cette chambre');

    const available = await this.roomsService.checkAvailability(dto.roomId, checkIn, checkOut);
    if (!available) throw new ConflictException('Cette chambre n\'est pas disponible pour ces dates');

    const quote = await this.getQuote({
      roomId: dto.roomId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      adults: dto.adults,
      children: dto.children,
    });

    const bookingReference = generateBookingReference();

    const result = await this.prisma.$transaction(async (tx) => {
      // Verrou de ligne sur la chambre : sérialise les créations de réservation
      // concurrentes pour une MÊME chambre. Sans ce verrou, sous l'isolation
      // Read Committed (défaut Postgres), deux transactions simultanées peuvent
      // toutes deux passer le contrôle de chevauchement ci-dessous (aucune ne
      // voit l'insertion non-commitée de l'autre) et créer un double-booking.
      // La 2e transaction attend ici que la 1re commit, puis voit la réservation
      // et lève le conflit. Les autres chambres ne sont pas impactées (verrou
      // par ligne). roomId existe déjà (findById plus haut le garantit).
      await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${dto.roomId} FOR UPDATE`;

      const overlapping = await tx.booking.findFirst({
        where: {
          roomId: dto.roomId,
          bookingStatus: { in: ['PENDING', 'CONFIRMED'] },
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
      });

      if (overlapping) throw new ConflictException('Cette chambre vient d\'être réservée pour ces dates');

      let customer = await tx.customer.findFirst({
        where: { email: dto.email },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            fullName: dto.fullName,
            email: dto.email,
            phone: dto.phone,
            country: dto.country,
          },
        });
      }

      const booking = await tx.booking.create({
        data: {
          bookingReference,
          customerId: customer.id,
          roomId: dto.roomId,
          customerName: dto.fullName,
          customerEmail: dto.email,
          customerPhone: dto.phone,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          nights,
          adults: dto.adults,
          children: dto.children,
          baseAmount: quote.baseAmount,
          taxesAmount: quote.taxesAmount,
          discountAmount: quote.discountAmount,
          totalAmount: quote.totalAmount,
          currency: quote.currency,
          specialRequest: dto.specialRequest,
          paymentStatus: 'PENDING',
          bookingStatus: 'PENDING',
        },
        include: { room: { include: { images: true } } },
      });

      return booking;
    });

    this.emailService.sendBookingConfirmation(result).catch(console.error);
    this.emailService.sendAdminNewBooking(result).catch(console.error);

    return result;
  }

  async findByReference(reference: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingReference: reference },
      include: {
        room: { include: { images: true } },
        payments: true,
        invoices: true,
      },
    });

    if (!booking) throw new NotFoundException('Réservation non trouvée');
    return booking;
  }

  async findAll(query: BookingQueryDto) {
    const { page = 1, limit = 10, status, paymentStatus, search, from, to } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      ...(status && { bookingStatus: status as any }),
      ...(paymentStatus && { paymentStatus: paymentStatus as any }),
      ...(from && { checkInDate: { gte: new Date(from) } }),
      ...(to && { checkOutDate: { lte: new Date(to) } }),
      ...(search && {
        OR: [
          { customerName: { contains: search, mode: 'insensitive' as const } },
          { customerEmail: { contains: search, mode: 'insensitive' as const } },
          { bookingReference: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: { room: true, payments: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(id: string, status: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Réservation non trouvée');

    if (!isValidTransition(booking.bookingStatus, status)) {
      throw new BadRequestException(transitionErrorMessage(booking.bookingStatus, status));
    }

    // Réactivation d'une réservation terminale : la chambre avait été libérée,
    // on s'assure qu'aucune autre réservation/blocage n'occupe désormais ces
    // dates avant de la remettre en CONFIRMED (anti double-booking).
    if (requiresAvailabilityRecheck(booking.bookingStatus, status)) {
      const available = await this.roomsService.checkAvailability(
        booking.roomId,
        booking.checkInDate,
        booking.checkOutDate,
      );
      if (!available) {
        throw new ConflictException(
          'Impossible de réactiver : la chambre est déjà réservée ou bloquée pour ces dates.',
        );
      }
    }

    const data: any = { bookingStatus: status };
    if (status === 'CANCELLED' && reason) {
      data.cancellationReason = reason;
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data,
      include: { room: true },
    });

    if (status === 'CANCELLED') {
      this.emailService.sendBookingCancellation(updated).catch(console.error);
    }

    return updated;
  }

  async cancelByReference(reference: string) {
    const booking = await this.findByReference(reference);

    if (booking.bookingStatus === 'CANCELLED') {
      throw new BadRequestException('Cette réservation est déjà annulée');
    }

    if (booking.bookingStatus === 'COMPLETED') {
      throw new BadRequestException('Impossible d\'annuler une réservation terminée');
    }

    return this.updateStatus(booking.id, 'CANCELLED', 'Annulé par le client');
  }

  /**
   * Secure booking lookup — requires both reference AND email to match.
   * Returns full booking data only if the email matches the booking.
   */
  async findByReferenceSecure(reference: string, email: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingReference: reference },
      include: {
        room: { include: { images: true } },
        payments: true,
        invoices: true,
      },
    });

    if (!booking || booking.customerEmail.toLowerCase() !== email.toLowerCase()) {
      throw new NotFoundException('Réservation introuvable. Vérifiez votre référence et votre email.');
    }

    return booking;
  }

  /**
   * Secure cancellation — requires both reference AND email to match.
   */
  async cancelByReferenceSecure(reference: string, email: string) {
    const booking = await this.findByReferenceSecure(reference, email);

    if (booking.bookingStatus === 'CANCELLED') {
      throw new BadRequestException('Cette réservation est déjà annulée');
    }

    if (booking.bookingStatus === 'COMPLETED') {
      throw new BadRequestException('Impossible d\'annuler une réservation terminée');
    }

    return this.updateStatus(booking.id, 'CANCELLED', 'Annulé par le client');
  }

  /**
   * Limited data lookup by reference only — used by payment page.
   * Returns only non-sensitive fields needed for payment processing.
   */
  async findByReferenceLimited(reference: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingReference: reference },
      select: {
        id: true,
        bookingReference: true,
        customerName: true,
        checkInDate: true,
        checkOutDate: true,
        nights: true,
        adults: true,
        children: true,
        baseAmount: true,
        taxesAmount: true,
        discountAmount: true,
        totalAmount: true,
        currency: true,
        paymentStatus: true,
        bookingStatus: true,
        room: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: { select: { id: true, imageUrl: true, altText: true }, take: 1 },
          },
        },
      },
    });

    if (!booking) throw new NotFoundException('Réservation non trouvée');
    return booking;
  }

  private async getEffectivePrice(roomId: string, checkIn: string, checkOut: string, defaultPrice: number): Promise<number> {
    const rule = await this.prisma.priceRule.findFirst({
      where: {
        roomId,
        isActive: true,
        startDate: { lte: new Date(checkIn) },
        endDate: { gte: new Date(checkOut) },
      },
    });

    return rule ? Number(rule.pricePerNight) : defaultPrice;
  }

  private async calculateDiscount(roomId: string, nights: number, baseAmount: number): Promise<number> {
    const rule = await this.prisma.priceRule.findFirst({
      where: {
        roomId,
        isActive: true,
        minNights: { lte: nights },
        discountPercent: { gt: 0 },
      },
      orderBy: { discountPercent: 'desc' },
    });

    if (rule?.discountPercent) {
      return Math.round(baseAmount * Number(rule.discountPercent) / 100);
    }
    return 0;
  }
}
