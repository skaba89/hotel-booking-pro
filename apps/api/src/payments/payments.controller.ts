import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsEmail, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators';

class BookingReferenceDto {
  @IsString()
  @IsNotEmpty()
  bookingReference: string;
}

class CapturePayPalOrderDto {
  @IsString()
  @IsNotEmpty()
  bookingReference: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;
}

class InitiateMobileMoneyDto {
  @IsString()
  @IsNotEmpty()
  bookingReference: string;

  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

@Controller()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('payments/stripe/create-session')
  createStripeSession(@Body() dto: BookingReferenceDto) {
    return this.paymentsService.createStripeSession(dto.bookingReference);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('payments/paypal/create-order')
  createPayPalOrder(@Body() dto: BookingReferenceDto) {
    return this.paymentsService.createPayPalOrder(dto.bookingReference);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('payments/paypal/capture-order')
  async capturePayPalOrder(@Body() dto: CapturePayPalOrderDto) {
    const verified = await this.paymentsService.verifyPayPalOrder(dto.orderId);
    if (!verified) {
      throw new BadRequestException('PayPal order verification failed');
    }
    return this.paymentsService.confirmPayment(dto.bookingReference, 'paypal', dto.orderId);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('payments/mobile-money/initiate')
  initiateMobileMoney(@Body() dto: InitiateMobileMoneyDto) {
    return this.paymentsService.initiateMobileMoney(dto.bookingReference, dto.provider, dto.phoneNumber);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('payments/pay-at-hotel')
  payAtHotel(@Body() dto: BookingReferenceDto) {
    return this.paymentsService.payAtHotel(dto.bookingReference);
  }

  /**
   * Simulation de paiement Mobile Money pour les tests (test mode uniquement).
   * Bloqué automatiquement en production via NODE_ENV.
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('payments/mobile-money/simulate')
  simulateMobileMoneyConfirm(@Body() dto: BookingReferenceDto) {
    return this.paymentsService.simulateMobileMoneyConfirm(dto.bookingReference);
  }
}
