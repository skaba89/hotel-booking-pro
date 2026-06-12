import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactMessageDto, UpdateContactStatusDto, SubscribeNewsletterDto } from './contact.dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  // ── Contact messages ───────────────────────────────────────────────────────

  createMessage(dto: CreateContactMessageDto) {
    return this.prisma.contactMessage.create({ data: dto });
  }

  findAllMessages(page: number, limit: number, status?: string) {
    const where = status ? { status: status as any } : {};
    return this.prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  updateMessageStatus(id: string, dto: UpdateContactStatusDto) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { status: dto.status as any },
    });
  }

  // ── Newsletter ─────────────────────────────────────────────────────────────

  async subscribe(dto: SubscribeNewsletterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });

    if (existing) {
      if (existing.isActive) return { message: 'Vous êtes déjà inscrit(e).' };
      await this.prisma.newsletterSubscriber.update({
        where: { email },
        data: { isActive: true, unsubscribedAt: null },
      });
      return { message: 'Réinscription réussie !' };
    }

    await this.prisma.newsletterSubscriber.create({ data: { email } });
    return { message: 'Inscription réussie ! Merci.' };
  }

  async unsubscribe(dto: SubscribeNewsletterDto) {
    const email = dto.email.toLowerCase().trim();
    const sub = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });

    if (!sub || !sub.isActive) return { message: 'Email non trouvé dans nos listes.' };

    await this.prisma.newsletterSubscriber.update({
      where: { email },
      data: { isActive: false, unsubscribedAt: new Date() },
    });
    return { message: 'Désabonnement effectué.' };
  }

  async getSubscribers(page: number, limit: number) {
    const [subscribers, total, activeCount] = await Promise.all([
      this.prisma.newsletterSubscriber.findMany({
        orderBy: { subscribedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.newsletterSubscriber.count(),
      this.prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    ]);
    return { data: subscribers, total, activeCount };
  }
}
