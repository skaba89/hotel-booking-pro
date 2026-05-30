import {
  Controller, Get, Post, Patch, Body, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException, Header,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { Public, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';

const uploadsDir = join(process.cwd(), 'uploads', 'branding');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const logoStorage = diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

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
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('settings/public')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600_000)
  @Header('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200')
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
    return { message: 'Parametres mis a jour' };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('admin/settings/logo')
  @UseInterceptors(FileInterceptor('logo', { storage: logoStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier envoye');

    const logoUrl = `/uploads/branding/${file.filename}`;
    await this.prisma.setting.upsert({
      where: { key: 'theme_logo_url' },
      update: { value: logoUrl },
      create: { key: 'theme_logo_url', value: logoUrl, type: 'string' },
    });

    return { url: logoUrl, message: 'Logo mis a jour' };
  }
}
