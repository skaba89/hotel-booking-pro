import { Controller, Post, Req, Headers, RawBodyRequest, BadRequestException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from '../payments/payments.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private paymentsService: PaymentsService) {}

  @Post('stripe')
  async handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) return { received: false };
    await this.paymentsService.handleStripeWebhook(rawBody, signature);
    return { received: true };
  }

  @Post('paypal')
  async handlePayPal(@Req() req: Request) {
    const { event_type, resource } = req.body;

    if (event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const bookingRef = resource?.custom_id;
      const captureId = resource?.id;

      if (!bookingRef || !captureId) {
        this.logger.warn('PayPal webhook missing booking reference or capture ID');
        return { received: true };
      }

      const verified = await this.paymentsService.verifyPayPalOrder(captureId);
      if (!verified) {
        this.logger.warn(`PayPal webhook verification failed for capture ${captureId}`);
        throw new BadRequestException('PayPal verification failed');
      }

      await this.paymentsService.confirmPayment(bookingRef, 'paypal', captureId, resource);
    }
    return { received: true };
  }

  @Post('mobile-money')
  async handleMobileMoney(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-webhook-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody || !signature) {
      throw new BadRequestException('Missing signature');
    }

    const valid = this.paymentsService.verifyMobileMoneySignature(rawBody.toString(), signature);
    if (!valid) {
      this.logger.warn('Mobile Money webhook signature verification failed');
      throw new BadRequestException('Invalid signature');
    }

    const { bookingReference, transactionId, status, provider } = req.body;
    if (status === 'SUCCESS' && bookingReference) {
      await this.paymentsService.confirmPayment(bookingReference, provider, transactionId, req.body);
    }
    return { received: true };
  }
}
