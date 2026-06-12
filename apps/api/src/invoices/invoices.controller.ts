import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Param, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { Public, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@Controller()
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @ApiOperation({ summary: 'Télécharger le reçu PDF d\'une réservation' })
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('invoices/:bookingReference/pdf')
  async downloadPdf(
    @Param('bookingReference') bookingReference: string,
    @Query('lang') lang = 'fr',
    @Res() res: Response,
  ) {
    const { buffer, reference } = await this.invoicesService.generatePdfBuffer(bookingReference, lang);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recu-${reference}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @ApiOperation({ summary: 'Regénérer la facture d\'une réservation (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('admin/invoices/:bookingId/regenerate')
  async regenerate(@Param('bookingId') bookingId: string) {
    const booking = await this.invoicesService.findBookingForRegeneration(bookingId);
    return { message: 'Facture régénérée', bookingReference: booking.bookingReference };
  }
}
