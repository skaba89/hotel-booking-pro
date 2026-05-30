import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PdfService } from '../pdf/pdf.service';

interface EmailAttachment {
  filename: string;
  content: Buffer;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private from: string;
  private adminEmail: string;

  constructor(
    private config: ConfigService,
    private pdf: PdfService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.from = this.config.get<string>('EMAIL_FROM', 'Hotel SETIFANA <noreply@setifana.com>');
    this.adminEmail = this.config.get<string>('HOTEL_EMAIL', 'admin@setifana.com');
  }

  async sendBookingConfirmation(booking: any) {
    const html = this.buildBookingEmail(booking, 'Confirmation de réservation');
    const attachments = await this.buildBookingAttachments(booking);
    await this.send(
      booking.customerEmail,
      `Confirmation - Réservation ${booking.bookingReference}`,
      html,
      attachments,
    );
  }

  /**
   * Génère le reçu PDF + un événement calendrier (.ics) pour le séjour.
   * Best-effort : si la génération échoue, on renvoie ce qui a réussi (ou rien)
   * afin de ne jamais bloquer l'envoi de l'email de confirmation.
   */
  private async buildBookingAttachments(booking: any): Promise<EmailAttachment[]> {
    const attachments: EmailAttachment[] = [];
    try {
      const pdf = await this.pdf.generateBookingReceipt(booking);
      attachments.push({ filename: `reservation-${booking.bookingReference}.pdf`, content: pdf });
    } catch (error) {
      this.logger.warn(`Génération PDF échouée pour ${booking.bookingReference}: ${(error as Error).message}`);
    }
    try {
      const ics = this.buildCalendarEvent(booking);
      attachments.push({ filename: `reservation-${booking.bookingReference}.ics`, content: Buffer.from(ics, 'utf-8') });
    } catch (error) {
      this.logger.warn(`Génération .ics échouée pour ${booking.bookingReference}: ${(error as Error).message}`);
    }
    return attachments;
  }

  /** Construit un événement iCalendar (RFC 5545) pour le séjour réservé. */
  private buildCalendarEvent(booking: any): string {
    const toIcsDate = (d: Date | string) => {
      const date = new Date(d);
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${y}${m}${day}`;
    };
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const escape = (s: string) => String(s ?? '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Hotel SETIFANA//Booking//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${booking.bookingReference}@setifana`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(booking.checkInDate)}`,
      `DTEND;VALUE=DATE:${toIcsDate(booking.checkOutDate)}`,
      `SUMMARY:${escape(`Séjour Hotel SETIFANA - ${booking.room?.name || 'Chambre'}`)}`,
      `DESCRIPTION:${escape(`Réservation ${booking.bookingReference} - ${booking.nights} nuit(s)`)}`,
      'LOCATION:Hotel SETIFANA\\, Conakry\\, Guinée',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    return lines.join('\r\n');
  }

  /**
   * Envoie un devis ou une facture au client, avec le PDF en pièce jointe et
   * un lien de consultation en ligne (page publique sécurisée par token).
   */
  async sendDocument(document: any, pdf: Buffer) {
    const isQuote = document.type === 'QUOTE';
    const label = isQuote ? 'Devis' : 'Facture';
    const filenameLabel = isQuote ? 'devis' : 'facture';
    const siteUrl = this.config.get<string>('SITE_URL')
      || this.config.get<string>('NEXT_PUBLIC_SITE_URL')
      || 'https://hotel-setifana-conakry.netlify.app';
    const viewUrl = `${siteUrl}/documents/${document.publicToken}`;
    const html = this.buildDocumentEmail(document, label, viewUrl);
    await this.send(
      document.clientEmail,
      `${label} ${document.number} - Hotel SETIFANA`,
      html,
      [{ filename: `${filenameLabel}-${document.number}.pdf`, content: pdf }],
    );
  }

  private buildDocumentEmail(document: any, label: string, viewUrl: string): string {
    const total = `${Number(document.total).toLocaleString('fr-FR')} ${document.currency}`;
    const isQuote = document.type === 'QUOTE';
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #071B33; padding: 20px; text-align: center;">
          <h1 style="color: #C8A45D; margin: 0;">Hotel SETIFANA</h1>
          <p style="color: #fff; margin: 5px 0 0;">L'excellence de l'hospitalité à Conakry</p>
        </div>
        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #071B33;">${label} ${document.number}</h2>
          <p>Cher(e) ${document.clientName},</p>
          <p>Veuillez trouver ${isQuote ? 'votre devis' : 'votre facture'} ci-joint(e) au format PDF.</p>
          <div style="background: #F6F7F9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Référence :</strong> ${document.number}</p>
            <p style="margin: 5px 0; font-size: 18px;"><strong>Montant : ${total}</strong></p>
          </div>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${viewUrl}" style="background: #C8A45D; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Consulter en ligne
            </a>
          </p>
          <p style="color: #666;">Pour toute question, n'hésitez pas à nous contacter.</p>
        </div>
        <div style="background: #071B33; padding: 15px; text-align: center; color: #999; font-size: 12px;">
          <p>Hotel SETIFANA - Conakry, Guinée</p>
        </div>
      </div>
    `;
  }

  async sendPaymentConfirmation(booking: any) {
    const html = this.buildPaymentEmail(booking);
    await this.send(booking.customerEmail, `Paiement confirmé - ${booking.bookingReference}`, html);
  }

  async sendBookingCancellation(booking: any) {
    const html = this.buildCancellationEmail(booking);
    await this.send(booking.customerEmail, `Annulation - Réservation ${booking.bookingReference}`, html);
  }

  async sendAdminNewBooking(booking: any) {
    const html = this.buildAdminBookingEmail(booking);
    await this.send(this.adminEmail, `Nouvelle réservation ${booking.bookingReference}`, html);
  }

  async sendAdminPaymentReceived(booking: any) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #071B33; padding: 20px; text-align: center;">
          <h1 style="color: #C8A45D; margin: 0;">Hotel SETIFANA</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #071B33;">Paiement reçu</h2>
          <p><strong>Réservation :</strong> ${booking.bookingReference}</p>
          <p><strong>Client :</strong> ${booking.customerName}</p>
          <p><strong>Montant :</strong> ${Number(booking.totalAmount).toLocaleString()} ${booking.currency}</p>
          <p><strong>Statut :</strong> ${booking.paymentStatus}</p>
        </div>
      </div>
    `;
    await this.send(this.adminEmail, `Paiement reçu - ${booking.bookingReference}`, html);
  }

  private async send(to: string, subject: string, html: string, attachments?: EmailAttachment[]) {
    if (!this.resend) {
      this.logger.warn(`Email non envoyé (Resend non configuré): ${subject} -> ${to}`);
      return;
    }

    // Retry avec back-off sur erreur transitoire. Le SDK Resend ne lève pas
    // d'exception sur erreur API : il renvoie { error }. On le traite comme un
    // échec pour pouvoir réessayer. Cette méthode ne propage jamais l'erreur
    // (contrat "fire-and-forget" des appelants) ; en cas d'échec final, on log.
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { error } = await this.resend.emails.send({
          from: this.from,
          to,
          subject,
          html,
          ...(attachments && attachments.length > 0 ? { attachments } : {}),
        });
        if (error) throw error;
        this.logger.log(`Email envoyé: ${subject} -> ${to}`);
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          this.logger.error(`Échec envoi email après ${maxAttempts} tentatives: ${subject} -> ${to}`, error as any);
          return;
        }
        const delayMs = 500 * 2 ** (attempt - 1); // 500ms, puis 1000ms
        this.logger.warn(`Tentative ${attempt}/${maxAttempts} échouée pour "${subject}", nouvel essai dans ${delayMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  private buildBookingEmail(booking: any, title: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #071B33; padding: 20px; text-align: center;">
          <h1 style="color: #C8A45D; margin: 0;">Hotel SETIFANA</h1>
          <p style="color: #fff; margin: 5px 0 0;">L'excellence de l'hospitalité à Conakry</p>
        </div>
        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #071B33;">${title}</h2>
          <p>Cher(e) ${booking.customerName},</p>
          <p>Votre réservation a été enregistrée avec succès.</p>
          <div style="background: #F6F7F9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Référence :</strong> ${booking.bookingReference}</p>
            <p style="margin: 5px 0;"><strong>Chambre :</strong> ${booking.room?.name || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Arrivée :</strong> ${new Date(booking.checkInDate).toLocaleDateString('fr-FR')}</p>
            <p style="margin: 5px 0;"><strong>Départ :</strong> ${new Date(booking.checkOutDate).toLocaleDateString('fr-FR')}</p>
            <p style="margin: 5px 0;"><strong>Durée :</strong> ${booking.nights} nuit(s)</p>
            <p style="margin: 5px 0;"><strong>Adultes :</strong> ${booking.adults} | <strong>Enfants :</strong> ${booking.children}</p>
            <hr style="border: 1px solid #ddd; margin: 10px 0;" />
            <p style="margin: 5px 0; font-size: 18px;"><strong>Total : ${Number(booking.totalAmount).toLocaleString()} ${booking.currency}</strong></p>
          </div>
          <p style="color: #666;">Merci de votre confiance. Nous avons hâte de vous accueillir !</p>
        </div>
        <div style="background: #071B33; padding: 15px; text-align: center; color: #999; font-size: 12px;">
          <p>Hotel SETIFANA - Conakry, Guinée</p>
        </div>
      </div>
    `;
  }

  private buildPaymentEmail(booking: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #071B33; padding: 20px; text-align: center;">
          <h1 style="color: #C8A45D; margin: 0;">Hotel SETIFANA</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #071B33;">Paiement confirmé</h2>
          <p>Cher(e) ${booking.customerName},</p>
          <p>Votre paiement a été confirmé pour la réservation <strong>${booking.bookingReference}</strong>.</p>
          <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;"><strong>Montant payé : ${Number(booking.totalAmount).toLocaleString()} ${booking.currency}</strong></p>
          </div>
          <p>Votre réservation est maintenant confirmée. Vous recevrez un reçu PDF en pièce jointe.</p>
        </div>
        <div style="background: #071B33; padding: 15px; text-align: center; color: #999; font-size: 12px;">
          <p>Hotel SETIFANA - Conakry, Guinée</p>
        </div>
      </div>
    `;
  }

  private buildCancellationEmail(booking: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #071B33; padding: 20px; text-align: center;">
          <h1 style="color: #C8A45D; margin: 0;">Hotel SETIFANA</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #071B33;">Réservation annulée</h2>
          <p>Cher(e) ${booking.customerName},</p>
          <p>Votre réservation <strong>${booking.bookingReference}</strong> a été annulée.</p>
          ${booking.cancellationReason ? `<p><strong>Raison :</strong> ${booking.cancellationReason}</p>` : ''}
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        </div>
        <div style="background: #071B33; padding: 15px; text-align: center; color: #999; font-size: 12px;">
          <p>Hotel SETIFANA - Conakry, Guinée</p>
        </div>
      </div>
    `;
  }

  private buildAdminBookingEmail(booking: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #071B33; padding: 20px; text-align: center;">
          <h1 style="color: #C8A45D; margin: 0;">Nouvelle Réservation</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p><strong>Référence :</strong> ${booking.bookingReference}</p>
          <p><strong>Client :</strong> ${booking.customerName} (${booking.customerEmail})</p>
          <p><strong>Chambre :</strong> ${booking.room?.name}</p>
          <p><strong>Dates :</strong> ${new Date(booking.checkInDate).toLocaleDateString('fr-FR')} - ${new Date(booking.checkOutDate).toLocaleDateString('fr-FR')}</p>
          <p><strong>Montant :</strong> ${Number(booking.totalAmount).toLocaleString()} ${booking.currency}</p>
        </div>
      </div>
    `;
  }
}
