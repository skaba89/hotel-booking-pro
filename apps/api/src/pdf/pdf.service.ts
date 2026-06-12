import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

// ── Traductions FR / EN pour les reçus de réservation ──────────────────────
const TRANSLATIONS = {
  fr: {
    title: 'Confirmation de Réservation',
    clientInfo: 'Informations Client',
    bookingDetails: 'Détails de la Réservation',
    financialDetails: 'Détails Financiers',
    name: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    room: 'Chambre',
    arrival: 'Arrivée',
    departure: 'Départ',
    nights: 'Nombre de nuits',
    adults: 'Adultes',
    children: 'Enfants',
    baseAmount: 'Montant de base',
    taxes: 'Taxes',
    discount: 'Réduction',
    paymentStatus: 'Statut paiement',
    bookingStatus: 'Statut réservation',
    tagline: "L'excellence de l'hospitalité à Conakry",
    generatedOn: 'Document généré le',
    at: 'à',
    paymentStatuses: {
      PAID: 'Payé',
      PENDING: 'En attente',
      PAY_AT_HOTEL: "Paiement à l'hôtel",
      FAILED: 'Échoué',
      REFUNDED: 'Remboursé',
      INITIATED: 'En cours',
    } as Record<string, string>,
    bookingStatuses: {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
      NO_SHOW: 'Non présenté',
    } as Record<string, string>,
  },
  en: {
    title: 'Booking Confirmation',
    clientInfo: 'Client Information',
    bookingDetails: 'Booking Details',
    financialDetails: 'Financial Details',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    room: 'Room',
    arrival: 'Check-in',
    departure: 'Check-out',
    nights: 'Number of nights',
    adults: 'Adults',
    children: 'Children',
    baseAmount: 'Base amount',
    taxes: 'Taxes',
    discount: 'Discount',
    paymentStatus: 'Payment status',
    bookingStatus: 'Booking status',
    tagline: 'Excellence in hospitality in Conakry',
    generatedOn: 'Document generated on',
    at: 'at',
    paymentStatuses: {
      PAID: 'Paid',
      PENDING: 'Pending',
      PAY_AT_HOTEL: 'Pay at Hotel',
      FAILED: 'Failed',
      REFUNDED: 'Refunded',
      INITIATED: 'Processing',
    } as Record<string, string>,
    bookingStatuses: {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'No Show',
    } as Record<string, string>,
  },
};

@Injectable()
export class PdfService {
  generateBookingReceipt(booking: any, lang = 'fr'): Promise<Buffer> {
    const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] ?? TRANSLATIONS.fr;
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
        .text(t.tagline, 50, 70, { align: 'center' });

      // Title
      doc
        .fillColor('#071B33')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(t.title, 50, 145, { align: 'center' });

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

      const locale = lang === 'en' ? 'en-GB' : 'fr-FR';

      // Client info
      this.addSection(doc, t.clientInfo);
      this.addField(doc, t.name, booking.customerName);
      this.addField(doc, t.email, booking.customerEmail);
      if (booking.customerPhone) this.addField(doc, t.phone, booking.customerPhone);

      doc.moveDown(0.5);

      // Booking details
      this.addSection(doc, t.bookingDetails);
      this.addField(doc, t.room, booking.room?.name || 'N/A');
      this.addField(doc, t.arrival, new Date(booking.checkInDate).toLocaleDateString(locale));
      this.addField(doc, t.departure, new Date(booking.checkOutDate).toLocaleDateString(locale));
      this.addField(doc, t.nights, String(booking.nights));
      this.addField(doc, t.adults, String(booking.adults));
      this.addField(doc, t.children, String(booking.children));

      doc.moveDown(0.5);

      // Financial
      this.addSection(doc, t.financialDetails);
      this.addField(doc, t.baseAmount, `${Number(booking.baseAmount).toLocaleString(locale)} ${booking.currency}`);
      this.addField(doc, t.taxes, `${Number(booking.taxesAmount).toLocaleString(locale)} ${booking.currency}`);
      if (Number(booking.discountAmount) > 0) {
        this.addField(doc, t.discount, `-${Number(booking.discountAmount).toLocaleString(locale)} ${booking.currency}`);
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

      // Payment status — traduit
      const payStatusLabel = t.paymentStatuses[booking.paymentStatus] ?? booking.paymentStatus;
      const bookStatusLabel = t.bookingStatuses[booking.bookingStatus] ?? booking.bookingStatus;

      doc
        .fillColor('#071B33')
        .fontSize(11)
        .font('Helvetica')
        .text(`${t.paymentStatus} : ${payStatusLabel}`, 50);
      doc.text(`${t.bookingStatus} : ${bookStatusLabel}`, 50);

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
        .text(`${t.generatedOn} ${new Date().toLocaleDateString(locale)} ${t.at} ${new Date().toLocaleTimeString(locale)}`, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Génère un devis ou une facture (document commercial avec lignes).
   * `document` provient de DocumentsService (type, number, client, lines, totaux).
   */
  generateDocument(document: any): Promise<Buffer> {
    const isQuote = document.type === 'QUOTE';
    const title = isQuote ? 'DEVIS' : 'FACTURE';
    const fmt = (n: any) => `${Number(n).toLocaleString('fr-FR')} ${document.currency}`;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width;

      // Header
      doc.rect(0, 0, pageW, 110).fill('#071B33');
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#C8A45D')
        .text('HOTEL SETIFANA', 50, 32);
      doc
        .fontSize(10)
        .fillColor('#FFFFFF')
        .font('Helvetica')
        .text('Conakry, République de Guinée', 50, 64)
        .text('Tél: +224 600 000 000 | contact@setifana.com', 50, 78);

      // Document title + number (right aligned)
      doc
        .fontSize(26)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .text(title, pageW - 250, 36, { width: 200, align: 'right' });
      doc
        .fontSize(11)
        .fillColor('#C8A45D')
        .font('Helvetica-Bold')
        .text(`N° ${document.number}`, pageW - 250, 70, { width: 200, align: 'right' });

      doc.y = 135;

      // Meta row : dates + statut
      const issue = new Date(document.issueDate || document.createdAt).toLocaleDateString('fr-FR');
      const due = document.dueDate ? new Date(document.dueDate).toLocaleDateString('fr-FR') : null;
      doc
        .fillColor('#333')
        .fontSize(10)
        .font('Helvetica')
        .text(`Date d'émission : ${issue}`, 50, doc.y);
      if (due) {
        doc.text(`${isQuote ? 'Valable jusqu\'au' : 'Échéance'} : ${due}`, 50, doc.y);
      }

      // Client block (right)
      const clientY = 135;
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#071B33')
        .text('Destinataire', pageW - 250, clientY, { width: 200, align: 'right' });
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#333')
        .text(document.clientName, pageW - 250, clientY + 16, { width: 200, align: 'right' })
        .text(document.clientEmail, { width: 200, align: 'right' });
      if (document.clientPhone) doc.text(document.clientPhone, { width: 200, align: 'right' });
      if (document.clientAddress) doc.text(document.clientAddress, { width: 200, align: 'right' });

      // Line items table
      let y = Math.max(doc.y, clientY + 80) + 20;
      const x = { desc: 50, qty: 320, unit: 380, total: pageW - 50 };

      const drawHeader = (yy: number) => {
        doc.rect(50, yy - 4, pageW - 100, 22).fill('#071B33');
        doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
        doc.text('Description', x.desc + 6, yy);
        doc.text('Qté', x.qty, yy, { width: 50, align: 'right' });
        doc.text('P.U.', x.unit, yy, { width: 90, align: 'right' });
        doc.text('Total', x.unit + 90, yy, { width: x.total - x.unit - 90, align: 'right' });
        return yy + 24;
      };

      y = drawHeader(y);
      doc.font('Helvetica').fontSize(9).fillColor('#333');
      (document.lines || []).forEach((line: any, i: number) => {
        if (y > doc.page.height - 160) {
          doc.addPage();
          y = 50;
          y = drawHeader(y);
          doc.font('Helvetica').fontSize(9).fillColor('#333');
        }
        if (i % 2 === 1) doc.rect(50, y - 3, pageW - 100, 20).fill('#F6F7F9');
        doc.fillColor('#333');
        doc.text(String(line.description), x.desc + 6, y, { width: x.qty - x.desc - 12 });
        doc.text(String(Number(line.quantity)), x.qty, y, { width: 50, align: 'right' });
        doc.text(fmt(line.unitPrice), x.unit, y, { width: 90, align: 'right' });
        doc.text(fmt(line.lineTotal), x.unit + 90, y, { width: x.total - x.unit - 90, align: 'right' });
        y += 20;
      });

      // Totals
      y += 10;
      doc.moveTo(320, y).lineTo(pageW - 50, y).stroke('#C8A45D');
      y += 8;
      const totalRow = (label: string, value: string, bold = false) => {
        doc
          .font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(bold ? 12 : 10)
          .fillColor('#071B33')
          .text(label, 320, y, { width: 120, align: 'right' })
          .text(value, 440, y, { width: pageW - 490, align: 'right' });
        y += bold ? 22 : 18;
      };
      totalRow('Sous-total', fmt(document.subtotal));
      if (Number(document.taxRate) > 0) {
        totalRow(`TVA (${Number(document.taxRate)}%)`, fmt(document.taxAmount));
      }
      if (Number(document.discountAmount) > 0) {
        totalRow('Remise', `-${fmt(document.discountAmount)}`);
      }
      doc.rect(320, y - 2, pageW - 370, 26).fill('#071B33');
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#C8A45D')
        .text('TOTAL', 326, y + 5, { width: 110, align: 'right' })
        .text(fmt(document.total), 440, y + 5, { width: pageW - 490, align: 'right' });
      y += 40;

      // Notes
      if (document.notes) {
        doc.fillColor('#071B33').font('Helvetica-Bold').fontSize(10).text('Notes', 50, y);
        doc.fillColor('#555').font('Helvetica').fontSize(9).text(String(document.notes), 50, y + 14, {
          width: pageW - 100,
        });
      }

      // Footer
      const footerY = doc.page.height - 70;
      doc.moveTo(50, footerY).lineTo(pageW - 50, footerY).stroke('#C8A45D');
      doc
        .fontSize(8)
        .fillColor('#666')
        .font('Helvetica')
        .text(
          isQuote
            ? 'Ce devis est sans engagement. Valable selon la date indiquée ci-dessus.'
            : 'Merci de votre confiance. Paiement à réception, sauf mention contraire.',
          50,
          footerY + 8,
          { align: 'center', width: pageW - 100 },
        )
        .text('Hotel SETIFANA - Conakry, République de Guinée', { align: 'center', width: pageW - 100 });

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
