import {
  Controller, Get, Post, Patch, Body, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException, Header, Inject,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL, CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { Public, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EmailService } from '../email/email.service';

const imageFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
  const mimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  const ext = extname(file.originalname).toLowerCase();
  if (allowed.includes(ext) && mimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Format non supporte. Utilisez JPG, PNG, WebP ou SVG.'), false);
  }
};

@Controller()
export class SettingsController {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private cloudinary: CloudinaryService,
    private email: EmailService,
  ) {}

  @Public()
  @Get('settings/public')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(10_000)
  @Header('Cache-Control', 'no-store')
  async getPublicSettings() {
    const publicKeys = [
      // Hotel info
      'hotel_name', 'hotel_email', 'hotel_phone', 'hotel_whatsapp',
      'hotel_address', 'hotel_currency', 'hotel_tax_rate',
      'check_in_time', 'check_out_time', 'cancellation_hours',
      // Payment methods
      'stripe_enabled', 'paypal_enabled', 'mobile_money_enabled', 'pay_at_hotel_enabled',
      // Appearance / theme
      'theme_primary_color', 'theme_accent_color', 'theme_font',
      'theme_logo_url', 'theme_hero_style',
      // Feature toggles
      'feature_whatsapp', 'feature_chatbot', 'feature_social_proof',
      'feature_newsletter', 'feature_reviews', 'feature_loyalty',
      'feature_transfers', 'feature_comparison', 'feature_cookie_consent',
      'maintenance_mode',
    ];
    const settings = await this.prisma.setting.findMany({
      where: { key: { in: publicKeys } },
    });
    const map: Record<string, string> = {};
    settings.forEach((s) => (map[s.key] = s.value));
    return map;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('admin/settings')
  findAll() {
    return this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/settings')
  async update(@Body() body: Record<string, string>) {
    const updates = Object.entries(body).map(([key, value]) =>
      this.prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), type: 'string' },
      }),
    );
    await Promise.all(updates);
    // Invalider le cache de la route publique pour que les couleurs/paramètres
    // soient immédiatement visibles sur le site sans attendre l'expiration du cache.
    try { await (this.cacheManager as any).reset?.(); } catch { /* ignore */ }
    return { message: 'Parametres mis a jour' };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('admin/settings/logo')
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage(), fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier envoye');

    const logoUrl = await this.cloudinary.store(file.buffer, 'hotel/branding', file.originalname);
    await this.prisma.setting.upsert({
      where: { key: 'theme_logo_url' },
      update: { value: logoUrl },
      create: { key: 'theme_logo_url', value: logoUrl, type: 'string' },
    });

    try { await (this.cacheManager as any).reset?.(); } catch { /* ignore */ }
    return { url: logoUrl, message: 'Logo mis a jour' };
  }

  /**
   * GET /api/admin/settings/services-status
   * Vérifie l'état des services externes (Cloudinary + Resend) sans rien envoyer.
   * Accessible admin uniquement — utile pour diagnostiquer rapidement.
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('admin/settings/services-status')
  getServicesStatus() {
    return {
      cloudinary: {
        enabled: this.cloudinary.isEnabled,
        status: this.cloudinary.isEnabled ? 'ok' : 'non_configure',
        message: this.cloudinary.isEnabled
          ? 'CLOUDINARY_URL détecté — uploads persistants actifs'
          : 'CLOUDINARY_URL absent sur Render → ajouter la variable (format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME)',
      },
      resend: {
        enabled: this.email.isEnabled,
        from: this.email.fromAddress,
        status: this.email.isEnabled ? 'ok' : 'non_configure',
        message: this.email.isEnabled
          ? `Resend actif — envoi depuis "${this.email.fromAddress}"`
          : 'RESEND_API_KEY absent sur Render → ajouter la variable',
      },
    };
  }

  /**
   * POST /api/admin/settings/test-email
   * Envoie un email de test à l'adresse fournie (ou à l'admin par défaut).
   * Body: { to?: string }
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('admin/settings/test-email')
  async testEmail(@Body() body: { to?: string }) {
    const to = body.to || this.email.adminEmail;
    const result = await this.email.sendTestEmail(to);
    return result;
  }

  /**
   * POST /api/admin/settings/test-cloudinary
   * Upload un pixel 1×1 transparent vers Cloudinary pour vérifier la connexion.
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('admin/settings/test-cloudinary')
  async testCloudinary() {
    if (!this.cloudinary.isEnabled) {
      return {
        success: false,
        message: 'CLOUDINARY_URL non configuré sur Render',
        fix: 'Aller sur Render → Environment → Ajouter CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME (copier depuis Cloudinary Dashboard → Settings → API Keys → API environment variable)',
      };
    }
    try {
      // PNG 1×1 pixel transparent (minimal valid PNG)
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );
      const url = await this.cloudinary.uploadBuffer(pixel, 'hotel/test');
      return {
        success: true,
        message: 'Cloudinary fonctionne correctement',
        testImageUrl: url,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Cloudinary erreur: ${err?.message || err}`,
        fix: 'Vérifier que CLOUDINARY_URL sur Render est au format exact: cloudinary://API_KEY:API_SECRET@CLOUD_NAME',
      };
    }
  }
}
