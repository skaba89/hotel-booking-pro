import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const raw = config.get<string>(
      'DATABASE_URL',
      'postgresql://postgres:postgres@localhost:5432/hotel_booking_pro?schema=public',
    );

    // Neon free tier: add connection_limit=3 to avoid "too many connections" on cold wake.
    // Use connection_timeout=10 so slow wakes fail fast instead of hanging.
    let url = raw;
    try {
      const u = new URL(raw);
      if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '3');
      if (!u.searchParams.has('connect_timeout'))  u.searchParams.set('connect_timeout',  '10');
      if (!u.searchParams.has('pool_timeout'))      u.searchParams.set('pool_timeout',      '10');
      url = u.toString();
    } catch { /* not a valid URL (local fallback) — keep as-is */ }

    super({ datasources: { db: { url } } });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
