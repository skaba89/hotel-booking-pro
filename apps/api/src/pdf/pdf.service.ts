import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
  generateBookingReceipt(booking: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .rect(0, 0, doc.page.width, 120)
        .fill('#071B33');

      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#C8A45D')
        .text('HOTEL SETIFANA', 50, 35, { align: 'center' });

      doc
        .fontSize(11)
        .fillColor('#FFFFFF')
        .font('Helvetica')
        .text("L'excellence de l'hospitalité à Conakry", 50, 70, { align: 'center' });

      // Title
      doc
        .fillColor('#071B33')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('Confirmation de Réservation', 50, 145, { align: 'center' });

      doc.moveDown(1.5);

      // Reference box
      const refY = doc.y;
      doc
        .rect(50, refY, doc.page.width - 100, 40)
        .fill('#F6F7F9');

      doc
        .fillColor('#071B33')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`Référence : ${booking.bookingReference}`, 70, refY + 12);

      doc.y = refY + 60;

      // Client info
      this.addSection(doc, 'Informations Client');
      this.addField(doc, 'Nom', booking.customerName);
      this.addField(doc, 'Email', booking.customerEmail);
      if (booking.customerPhone) this.addField(doc, 'Téléphone', booking.customerPhone);

      doc.moveDown(0.5);

      // Booking details
      this.addSection(doc, 'Détails de la Réservation');
      this.addField(doc, 'Chambre', booking.room?.name || 'N/A');
      this.addField(doc, 'Arrivée', new Date(booking.checkInDate).toLocaleDateString('fr-FR'));
      this.addField(doc, 'Départ', new Date(booking.checkOutDate).toLocaleDateString('fr-FR'));
      this.addField(doc, 'Nombre de nuits', String(booking.nights));
      this.addField(doc, 'Adultes', String(booking.adults));
      this.addField(doc, 'Enfants', String(booking.children));

      doc.moveDown(0.5);

      // Financial
      this.addSection(doc, 'Détails Financiers');
      this.addField(doc, 'Montant de base', `${Number(booking.baseAmount).toLocaleString()} ${booking.currency}`);
      this.addField(doc, 'Taxes', `${Number(booking.taxesAmount).toLocaleString()} ${booking.currency}`);
      if (Number(booking.discountAmount) > 0) {
        this.addField(doc, 'Réduction', `-${Number(booking.discountAmount).toLocaleString()} ${booking.currency}`);
      }

      doc.moveDown(0.3);
      const totalY = doc.y;
      doc
        .rect(50, totalY, doc.page.width - 100, 35)
        .fill('#071B33');

      doc
        .fillColor('#C8A45D')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`TOTAL : ${Number(booking.totalAmount).toLocaleString()} ${booking.currency}`, 70, totalY + 10);

      doc.y = totalY + 50;

      // Payment status
      doc
        .fillColor('#071B33')
        .fontSize(11)
        .font('Helvetica')
        .text(`Statut paiement : ${booking.paymentStatus}`, 50);
      doc.text(`Statut réservation : ${booking.bookingStatus}`, 50);

      // Footer
      doc.moveDown(2);
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke('#C8A45D');

      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .fillColor('#666')
        .text('Hotel SETIFANA - Conakry, République de Guinée', 50, doc.y, { align: 'center' })
        .text('Tél: +224 600 000 000 | Email: contact@setifana.com', { align: 'center' })
        .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center' });

      doc.end();
    });
  }

  private addSection(doc: any, title: string) {
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#C8A45D')
      .text(title, 50);

    doc
      .moveTo(50, doc.y + 2)
      .lineTo(200, doc.y + 2)
      .stroke('#C8A45D');

    doc.moveDown(0.5);
  }

  private addField(doc: any, label: string, value: string) {
    const y = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#071B33')
      .text(`${label} :`, 70, y, { width: 150, continued: false });

    doc
      .font('Helvetica')
      .fillColor('#333')
      .text(value, 220, y);

    doc.y = Math.max(doc.y, y + 16);
  }
}
