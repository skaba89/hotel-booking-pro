import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DocumentsModule } from './documents/documents.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ServicesModule } from './services/services.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ContactModule } from './contact/contact.module';
import { SettingsModule } from './settings/settings.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';
import { PdfModule } from './pdf/pdf.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ChatModule } from './chat/chat.module';
import { StaffModule } from './staff/staff.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), '..', '..', '.env'),
        '.env',
      ],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    // In-memory response cache for public read-only routes.
    // ttl = 60 s default (individual routes override with @CacheTTL).
    // max = 1000 cache entries (LRU eviction above that).
    CacheModule.register({ isGlobal: true, ttl: 60_000, max: 1000 }),
    PrismaModule,
    AuthModule,
    RoomsModule,
    BookingsModule,
    PaymentsModule,
    InvoicesModule,
    DocumentsModule,
    ExpensesModule,
    ServicesModule,
    ReviewsModule,
    ContactModule,
    SettingsModule,
    AdminModule,
    EmailModule,
    PdfModule,
    WebhooksModule,
    ChatModule,
    StaffModule,
    CloudinaryModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
