import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private from: string;
  private adminEmail: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.from = this.config.get<string>('EMAIL_FROM', 'Hotel SETIFANA <noreply@setifana.com>');
    this.adminEmail = this.config.get<string>('HOTEL_EMAIL', 'admin@setifana.com');
  }

  async sendBookingConfirmation(booking: any) {
    const html = this.buildBookingEmail(booking, 'Confirmation de réservation');
    await this.send(booking.customerEmail, `Confirmation - Réservation ${booking.bookingReference}`, html);
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

  private async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      this.logger.warn(`Email non envoyé (Resend non configuré): ${subject} -> ${to}`);
      return;
    }

    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
      this.logger.log(`Email envoyé: ${subject} -> ${to}`);
    } catch (error) {
      this.logger.error(`Erreur envoi email: ${subject}`, error);
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
