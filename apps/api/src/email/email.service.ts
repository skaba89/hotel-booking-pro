import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import { PdfService } from '../pdf/pdf.service';

interface EmailAttachment {
  filename: string;
  content: Buffer;
}

/**
 * EmailService — deux fournisseurs supportés, par ordre de priorité :
 *
 * 1. Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD)
 *    → Aucun domaine requis, envoie à n'importe quelle adresse, 500 emails/jour.
 *    → Créer un compte Gmail dédié + activer la validation en 2 étapes + générer
 *      un "Mot de passe d'application" sur myaccount.google.com/apppasswords.
 *
 * 2. Resend (RESEND_API_KEY)
 *    → Nécessite un domaine vérifié pour envoyer aux clients. Sans domaine, seul
 *      l'email du compte Resend peut recevoir des messages.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private gmailTransporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;

  private from: string;
  private _adminEmail: string;
  private _provider: 'gmail' | 'resend' | 'none' = 'none';

  get isEnabled(): boolean { return this._provider !== 'none'; }
  get fromAddress(): string { return this.from; }
  get adminEmail(): string { return this._adminEmail; }
  get provider(): string { return this._provider; }

  constructor(
    private config: ConfigService,
    private pdf: PdfService,
  ) {
    const gmailUser = this.config.get<string>('GMAIL_USER');
    const gmailPass = this.config.get<string>('GMAIL_APP_PASSWORD');

    if (gmailUser && gmailPass) {
      this.gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
        // Prevent the SMTP connection from hanging indefinitely on Render free tier
        connectionTimeout: 8_000,  // 8s max to connect
        socketTimeout:     12_000, // 12s max for socket inactivity
        greetingTimeout:   5_000,  // 5s max for server greeting
      });
      this._provider = 'gmail';
      // Gmail SMTP rejects FROM addresses that don't match the authenticated account.
      // Always use the Gmail address, never an external "from" override.
      this.from = `Hotel SETIFANA <${gmailUser}>`;
      this.logger.log(`Gmail SMTP configuré — envoi depuis ${this.from}`);
    } else {
      const resendKey = this.config.get<string>('RESEND_API_KEY');
      if (resendKey) {
        this.resend = new Resend(resendKey);
        this._provider = 'resend';
        // Resend sans domaine vérifié → from doit être onboarding@resend.dev
        this.from = this.config.get<string>(
          'EMAIL_FROM',
          'Hotel SETIFANA <onboarding@resend.dev>',
        );
        this.logger.log(`Resend configuré — envoi depuis ${this.from}`);
        this.logger.warn(
          'Resend sans domaine vérifié : les emails n\'arrivent qu\'à l\'adresse du compte Resend. ' +
          'Pour envoyer aux clients, configurez GMAIL_USER + GMAIL_APP_PASSWORD.',
        );
      } else {
        this.logger.warn('Aucun fournisseur email configuré (GMAIL_USER ou RESEND_API_KEY manquant)');
      }
    }

    this._adminEmail = this.config.get<string>('HOTEL_EMAIL', 'admin@setifana.com');
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
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hotel SETIFANA//Booking//FR',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `UID:${booking.bookingReference}@setifana`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(booking.checkInDate)}`,
      `DTEND;VALUE=DATE:${toIcsDate(booking.checkOutDate)}`,
      `SUMMARY:${escape(`Séjour Hotel SETIFANA - ${booking.room?.name || 'Chambre'}`)}`,
      `DESCRIPTION:${escape(`Réservation ${booking.bookingReference} - ${booking.nights} nuit(s)`)}`,
      'LOCATION:Hotel SETIFANA\\, Conakry\\, Guinée', 'STATUS:CONFIRMED',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
  }

  async sendDocument(document: any, pdf: Buffer) {
    const isQuote = document.type === 'QUOTE';
    const label = isQuote ? 'Devis' : 'Facture';
    const filenameLabel = isQuote ? 'devis' : 'facture';
    const siteUrl = this.config.get<string>('NEXT_PUBLIC_SITE_URL')
      || this.config.get<string>('SITE_URL')
      || 'https://setifana-hotel-conakry.netlify.app';
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
    await this.send(this._adminEmail, `Nouvelle réservation ${booking.bookingReference}`, html);
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
    await this.send(this._adminEmail, `Paiement reçu - ${booking.bookingReference}`, html);
  }

  // ─── Transport Layer ─────────────────────────────────────────────────────────

  private async send(to: string, subject: string, html: string, attachments?: EmailAttachment[]) {
    if (this._provider === 'gmail') {
      // May throw — let the caller decide whether to catch or propagate
      await this.sendViaGmail(to, subject, html, attachments);
    } else if (this._provider === 'resend') {
      await this.sendViaResend(to, subject, html, attachments);
    } else {
      this.logger.warn(`Email non envoyé (aucun fournisseur configuré): ${subject} -> ${to}`);
    }
  }

  private async sendViaGmail(to: string, subject: string, html: string, attachments?: EmailAttachment[]) {
    if (!this.gmailTransporter) return;
    const maxAttempts = 2; // reduced to 2 to avoid Render 30s timeout
    let lastError: any;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.gmailTransporter.sendMail({
          from: this.from,
          to,
          subject,
          html,
          attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content })),
        });
        this.logger.log(`[Gmail] Email envoyé: ${subject} -> ${to}`);
        return;
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`[Gmail] Tentative ${attempt}/${maxAttempts} échouée: ${error?.message}`);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }
    // Re-throw so callers (e.g. sendTestEmail) can catch and report the real error
    this.logger.error(`[Gmail] Échec après ${maxAttempts} tentatives: ${subject} -> ${to}`, lastError);
    throw lastError;
  }

  private async sendViaResend(to: string, subject: string, html: string, attachments?: EmailAttachment[]) {
    if (!this.resend) return;
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
        this.logger.log(`[Resend] Email envoyé: ${subject} -> ${to}`);
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          this.logger.error(`[Resend] Échec après ${maxAttempts} tentatives: ${subject} -> ${to}`, error as any);
          return;
        }
        await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
      }
    }
  }

  // ─── Email Templates ─────────────────────────────────────────────────────────

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
          <p>Votre réservation est maintenant confirmée.</p>
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

  // ─── Test & Diagnostic ───────────────────────────────────────────────────────

  async sendTestEmail(to: string): Promise<{ success: boolean; message: string; from?: string; provider?: string }> {
    if (!this.isEnabled) {
      return {
        success: false,
        message: 'Aucun fournisseur email configuré. Ajoutez GMAIL_USER + GMAIL_APP_PASSWORD sur Render.',
      };
    }
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: #071B33; padding: 20px; text-align: center;">
          <h1 style="color: #C8A45D; margin: 0; font-size: 22px;">Hotel SETIFANA</h1>
          <p style="color: #fff; margin: 6px 0 0; font-size: 13px;">Test de configuration email</p>
        </div>
        <div style="padding: 28px; background: #fff;">
          <p style="margin: 0 0 12px;">Bonjour,</p>
          <p style="margin: 0 0 16px;">✅ Le service email fonctionne correctement.</p>
          <div style="background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 6px; padding: 14px; margin-bottom: 16px;">
            <p style="margin: 0; color: #065f46; font-weight: bold;">Fournisseur : ${this._provider.toUpperCase()}</p>
            <p style="margin: 4px 0 0; color: #065f46; font-size: 13px;">Depuis : ${this.from}</p>
          </div>
          <p style="color: #6b7280; font-size: 13px; margin: 0;">Envoyé le ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      </div>
    `;
    try {
      await this.send(to, '✅ Test email — Hotel SETIFANA', html);
      return { success: true, message: `Email envoyé à ${to}`, from: this.from, provider: this._provider };
    } catch (err: any) {
      return { success: false, message: `Erreur: ${err?.message || err}`, provider: this._provider };
    }
  }

  async sendEmailVerificationEmail(to: string, fullName: string, token: string) {
    const siteUrl = this.config.get<string>('NEXT_PUBLIC_SITE_URL', 'https://hotel-setifana-conakry.netlify.app');
    const verifyUrl = `${siteUrl}/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: #071B33; padding: 24px 32px; text-align: center;">
          <h1 style="color: #C9A84C; margin: 0; font-size: 22px; letter-spacing: 2px;">HÔTEL SETIFANA</h1>
          <p style="color: #9ca3af; margin: 6px 0 0; font-size: 13px;">Vérification de votre adresse email</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #1f2937; font-size: 16px; margin: 0 0 16px;">Bonjour ${fullName},</p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Merci de vous être inscrit(e) à l'Hôtel SETIFANA. Veuillez confirmer votre adresse email
            en cliquant sur le bouton ci-dessous.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background: #C9A84C; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
              Vérifier mon adresse email
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0 0 8px;">
            Ce lien est valable <strong>24 heures</strong>.
          </p>
          <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0 0 24px;">
            Si vous n'avez pas créé de compte, ignorez simplement cet email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Lien direct : <a href="${verifyUrl}" style="color: #C9A84C;">${verifyUrl}</a>
          </p>
        </div>
        <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Hôtel SETIFANA — Baie de Sangareya, Conakry, Guinée
          </p>
        </div>
      </div>
    `;

    await this.send(to, '✉️ Vérifiez votre email — Hôtel SETIFANA', html);
  }

  async sendPasswordResetEmail(to: string, fullName: string, token: string) {
    const siteUrl = this.config.get<string>('NEXT_PUBLIC_SITE_URL', 'https://hotel-setifana-conakry.netlify.app');
    const resetUrl = `${siteUrl}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: #071B33; padding: 24px 32px; text-align: center;">
          <h1 style="color: #C9A84C; margin: 0; font-size: 22px; letter-spacing: 2px;">HÔTEL SETIFANA</h1>
          <p style="color: #9ca3af; margin: 6px 0 0; font-size: 13px;">Réinitialisation de mot de passe</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #1f2937; font-size: 16px; margin: 0 0 16px;">Bonjour ${fullName},</p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.
            Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #C9A84C; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0 0 8px;">
            Ce lien expire dans <strong>1 heure</strong>.
          </p>
          <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0 0 24px;">
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre mot de passe reste inchangé.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Lien direct : <a href="${resetUrl}" style="color: #C9A84C;">${resetUrl}</a>
          </p>
        </div>
        <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Hôtel SETIFANA — Baie de Sangareya, Conakry, Guinée
          </p>
        </div>
      </div>
    `;

    await this.send(to, '🔑 Réinitialisation de mot de passe — Hôtel SETIFANA', html);
  }
}
