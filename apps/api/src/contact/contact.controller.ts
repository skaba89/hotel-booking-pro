import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ConflictException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { Public, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateContactMessageDto, UpdateContactStatusDto, SubscribeNewsletterDto } from './contact.dto';

@Controller()
export class ContactController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('contact')
  create(@Body() dto: CreateContactMessageDto) {
    return this.prisma.contactMessage.create({ data: dto });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Get('admin/contact-messages')
  findAll(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    const where = status ? { status: status as any } : {};
    return this.prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Patch('admin/contact-messages/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateContactStatusDto) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { status: dto.status as any },
    });
  }

  // ---- Newsletter ----

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('newsletter/subscribe')
  async subscribe(@Body() dto: SubscribeNewsletterDto) {
    const normalized = dto.email.toLowerCase().trim();
    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email: normalized } });
    if (existing) {
      if (existing.isActive) return { message: 'Vous êtes déjà inscrit(e).' };
      await this.prisma.newsletterSubscriber.update({
        where: { email: normalized },
        data: { isActive: true, unsubscribedAt: null },
      });
      return { message: 'Réinscription réussie !' };
    }
    await this.prisma.newsletterSubscriber.create({ data: { email: normalized } });
    return { message: 'Inscription réussie ! Merci.' };
  }

  @Public()
  @Post('newsletter/unsubscribe')
  async unsubscribe(@Body() dto: SubscribeNewsletterDto) {
    const normalized = dto.email.toLowerCase().trim();
    const sub = await this.prisma.newsletterSubscriber.findUnique({ where: { email: normalized } });
    if (!sub || !sub.isActive) return { message: 'Email non trouvé dans nos listes.' };
    await this.prisma.newsletterSubscriber.update({
      where: { email: normalized },
      data: { isActive: false, unsubscribedAt: new Date() },
    });
    return { message: 'Désabonnement effectué.' };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('admin/newsletter/subscribers')
  async getSubscribers(@Query('page') page = 1, @Query('limit') limit = 50) {
    const [subscribers, total] = await Promise.all([
      this.prisma.newsletterSubscriber.findMany({
        orderBy: { subscribedAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      this.prisma.newsletterSubscriber.count(),
    ]);
    return { data: subscribers, total, activeCount: await this.prisma.newsletterSubscriber.count({ where: { isActive: true } }) };
  }
}
