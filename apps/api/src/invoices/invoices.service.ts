import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  /**
   * Generates a PDF receipt for the given booking reference.
   * Returns the PDF buffer and the booking reference for use in HTTP headers.
   * Throws NotFoundException if the booking does not exist.
   */
  async generatePdfBuffer(bookingReference: string, lang: string): Promise<{ buffer: Buffer; reference: string }> {
    const safeLang = ['fr', 'en'].includes(lang) ? lang : 'fr';

    const booking = await this.prisma.booking.findUnique({
      where: { bookingReference },
      include: { room: true, invoices: true },
    });

    if (!booking) throw new NotFoundException('Réservation non trouvée');

    const buffer = await this.pdfService.generateBookingReceipt(booking, safeLang);
    return { buffer, reference: bookingReference };
  }

  /**
   * Finds a booking by ID for invoice regeneration.
   * Throws NotFoundException if the booking does not exist.
   */
  async findBookingForRegeneration(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });

    if (!booking) throw new NotFoundException('Réservation non trouvée');
    return booking;
  }
}
