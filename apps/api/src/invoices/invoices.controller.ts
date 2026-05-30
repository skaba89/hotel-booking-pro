import { Controller, Get, Post, Param, Query, Res, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { Public, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller()
export class InvoicesController {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('invoices/:bookingReference/pdf')
  async downloadPdf(
    @Param('bookingReference') bookingReference: string,
    @Query('lang') lang = 'fr',
    @Res() res: Response,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingReference },
      include: { room: true, invoices: true },
    });

    if (!booking) throw new NotFoundException('Réservation non trouvée');

    const safeLang = ['fr', 'en'].includes(lang) ? lang : 'fr';
    const pdfBuffer = await this.pdfService.generateBookingReceipt(booking, safeLang);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recu-${bookingReference}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('admin/invoices/:bookingId/regenerate')
  async regenerate(@Param('bookingId') bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });

    if (!booking) throw new NotFoundException('Réservation non trouvée');

    return { message: 'Facture régénérée', bookingReference: booking.bookingReference };
  }
}
