import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { generateInvoiceNumber } from '../common/utils';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey && stripeKey.startsWith('sk_') && stripeKey.length > 10) {
      this.stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as any });
    }
  }

  async createStripeSession(bookingReference: string) {
    const booking = await this.getBookingByRef(bookingReference);

    if (!this.stripe) throw new BadRequestException('Stripe non configuré');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: booking.currency.toLowerCase(),
            product_data: {
              name: `Réservation ${booking.bookingReference} - ${booking.room.name}`,
              description: `${booking.nights} nuit(s) du ${new Date(booking.checkInDate).toLocaleDateString('fr-FR')} au ${new Date(booking.checkOutDate).toLocaleDateString('fr-FR')}`,
            },
            unit_amount: Math.round(Number(booking.totalAmount) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingReference: booking.bookingReference,
        bookingId: booking.id,
      },
      success_url: `${this.config.get('NEXT_PUBLIC_SITE_URL')}/confirmation/${booking.bookingReference}?status=success`,
      cancel_url: `${this.config.get('NEXT_PUBLIC_SITE_URL')}/payment/${booking.bookingReference}?status=cancelled`,
    });

    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        currency: booking.currency,
        paymentMethod: 'STRIPE',
        provider: 'stripe',
        providerPaymentId: session.id,
        status: 'INITIATED',
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  async createPayPalOrder(bookingReference: string) {
    const booking = await this.getBookingByRef(bookingReference);

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        currency: booking.currency,
        paymentMethod: 'PAYPAL',
        provider: 'paypal',
        status: 'INITIATED',
      },
    });

    return {
      paymentId: payment.id,
      bookingReference: booking.bookingReference,
      amount: Number(booking.totalAmount),
      currency: booking.currency,
    };
  }

  async initiateMobileMoney(bookingReference: string, provider: string, phoneNumber: string) {
    const booking = await this.getBookingByRef(bookingReference);

    const paymentMethod = provider.toUpperCase().replace(' ', '_') as any;

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        currency: booking.currency,
        paymentMethod,
        provider,
        status: 'PENDING',
        rawProviderResponse: { phoneNumber } as any,
      },
    });

    return {
      paymentId: payment.id,
      message: `Un paiement de ${Number(booking.totalAmount)} ${booking.currency} va être initié sur votre numéro ${phoneNumber}. Veuillez confirmer sur votre téléphone.`,
    };
  }

  async payAtHotel(bookingReference: string) {
    const booking = await this.getBookingByRef(bookingReference);

    const payAtHotelSetting = await this.prisma.setting.findUnique({
      where: { key: 'pay_at_hotel_enabled' },
    });

    if (payAtHotelSetting?.value !== 'true') {
      throw new BadRequestException('Le paiement à l\'hôtel n\'est pas disponible');
    }

    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        currency: booking.currency,
        paymentMethod: 'PAY_AT_HOTEL',
        provider: 'hotel',
        status: 'PENDING',
      },
    });

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'PAY_AT_HOTEL',
        bookingStatus: 'CONFIRMED',
      },
    });

    const updatedBooking = await this.prisma.booking.findUnique({
      where: { id: booking.id },
      include: { room: { include: { images: true } } },
    });

    this.emailService.sendPaymentConfirmation(updatedBooking!).catch(console.error);
    this.emailService.sendAdminPaymentReceived(updatedBooking!).catch(console.error);

    return { message: 'Réservation confirmée. Paiement à effectuer à l\'hôtel.' };
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret || !this.stripe) return;

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Signature webhook invalide');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingRef = session.metadata?.bookingReference;
      if (bookingRef) {
        await this.confirmPayment(bookingRef, 'stripe', session.id, session as any);
      }
    }
  }

  async confirmPayment(bookingReference: string, provider: string, providerPaymentId: string, rawResponse?: any) {
    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { bookingReference },
        include: { room: { include: { images: true } } },
      });

      if (!booking) return null;

      // Idempotency: skip if already paid
      if (booking.paymentStatus === 'PAID') return null;

      await tx.payment.updateMany({
        where: { bookingId: booking.id, provider },
        data: {
          status: 'SUCCESS',
          providerPaymentId,
          paidAt: new Date(),
          rawProviderResponse: rawResponse || undefined,
        },
      });

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: 'PAID',
          bookingStatus: 'CONFIRMED',
        },
      });

      const invoiceNumber = generateInvoiceNumber();
      await tx.invoice.create({
        data: {
          bookingId: booking.id,
          invoiceNumber,
          amount: booking.totalAmount,
          currency: booking.currency,
          status: 'GENERATED',
        },
      });

      return tx.booking.findUnique({
        where: { id: booking.id },
        include: { room: { include: { images: true } } },
      });
    });

    if (updatedBooking) {
      this.emailService.sendPaymentConfirmation(updatedBooking).catch(console.error);
      this.emailService.sendAdminPaymentReceived(updatedBooking).catch(console.error);
    }
  }

  async verifyPayPalOrder(orderId: string): Promise<boolean> {
    const clientId = this.config.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.config.get<string>('PAYPAL_CLIENT_SECRET');
    const mode = this.config.get<string>('PAYPAL_MODE') || 'sandbox';

    if (!clientId || !clientSecret || clientId.startsWith('VOTRE_')) {
      this.logger.warn('PayPal not configured — skipping order verification');
      return false;
    }

    const baseUrl = mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    try {
      const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!authResponse.ok) return false;
      const { access_token } = await authResponse.json() as any;

      const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${access_token}` },
      });

      if (!orderResponse.ok) return false;
      const order = await orderResponse.json() as any;
      return order.status === 'COMPLETED' || order.status === 'APPROVED';
    } catch (err) {
      this.logger.error('PayPal order verification failed', err);
      return false;
    }
  }

  verifyMobileMoneySignature(rawBody: string, signature: string): boolean {
    const secret = this.config.get<string>('MOBILE_MONEY_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn('MOBILE_MONEY_WEBHOOK_SECRET not set — rejecting webhook');
      return false;
    }
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    return expected === signature;
  }

  private async getBookingByRef(reference: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingReference: reference },
      include: { room: true },
    });

    if (!booking) throw new NotFoundException('Réservation non trouvée');
    if (booking.paymentStatus === 'PAID') throw new BadRequestException('Cette réservation est déjà payée');

    return booking;
  }
}
