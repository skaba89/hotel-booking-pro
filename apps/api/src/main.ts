import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Trust the first proxy hop so X-Forwarded-For is used as the real client IP.
  // Essential when behind Netlify CDN, Cloudflare, or any reverse proxy so the
  // per-IP throttler uses actual user IPs instead of the proxy/CDN IP.
  app.set('trust proxy', 1);

  const config = app.get(ConfigService);
  // Render (and most PaaS) inject the port via process.env.PORT; fall back to API_PORT for local dev.
  const port = parseInt(process.env.PORT ?? '', 10) || config.get<number>('API_PORT', 4005);
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  // ---- Environment validation ----
  const requiredKeys = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missingKeys = requiredKeys.filter((key) => !config.get(key));
  if (missingKeys.length > 0) {
    logger.error(`MISSING REQUIRED ENV VARS: ${missingKeys.join(', ')}`);
    if (isProduction) process.exit(1);
  }

  // Warn about placeholder secrets in production
  const jwtSecret = config.get<string>('JWT_SECRET', '');
  if (isProduction && (jwtSecret.includes('change') || jwtSecret.includes('CHANGEZ') || jwtSecret.length < 32)) {
    logger.error('JWT_SECRET is insecure! Generate a strong random key for production.');
    process.exit(1);
  }

  // Non-fatal: a distinct, strong refresh secret limits blast radius if one
  // secret leaks. We only WARN (never exit) so an existing prod where both
  // secrets are identical keeps running until the operator rotates it.
  const refreshSecret = config.get<string>('JWT_REFRESH_SECRET', '');
  if (isProduction) {
    if (refreshSecret && refreshSecret === jwtSecret) {
      logger.warn('JWT_REFRESH_SECRET is identical to JWT_SECRET — set a distinct value for better security.');
    }
    if (refreshSecret && refreshSecret.length < 32) {
      logger.warn('JWT_REFRESH_SECRET is short (<32 chars) — use a strong random key.');
    }
  }

  // Warn about unconfigured optional services
  if (!config.get('STRIPE_SECRET_KEY') || config.get('STRIPE_SECRET_KEY') === 'sk_test_...') {
    logger.warn('Stripe not configured - card payments will be disabled');
  }
  if (!config.get('RESEND_API_KEY') || config.get('RESEND_API_KEY') === 're_...') {
    logger.warn('Resend not configured - transactional emails will be disabled');
  }
  if (!config.get('PAYPAL_CLIENT_ID') || config.get('PAYPAL_CLIENT_ID')?.startsWith('your-')) {
    logger.warn('PayPal not configured - PayPal payments will be disabled');
  }

  // ---- Static files for uploads ----
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ---- Cookie parser ----
  app.use(cookieParser());

  // ---- Security ----
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: isProduction ? undefined : false,
  }));

  // ---- CORS - Dynamic from env ----
  const corsOrigins: string[] = [];

  // Always allow the configured site URL
  const siteUrl = config.get<string>('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
  corsOrigins.push(siteUrl);

  // Add custom CORS origins from env (comma-separated)
  const extraOrigins = config.get<string>('CORS_ORIGINS', '');
  if (extraOrigins) {
    extraOrigins.split(',').map((o) => o.trim()).filter(Boolean).forEach((o) => corsOrigins.push(o));
  }

  // In development, add localhost variants
  if (!isProduction) {
    corsOrigins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://192.168.1.21:3000',
    );
  }

  app.enableCors({
    origin: [...new Set(corsOrigins)],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ---- Global exception filter (prevents stack trace leaks) ----
  app.useGlobalFilters(new AllExceptionsFilter());

  // ---- Input sanitization & validation ----
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ---- Global prefix ----
  app.setGlobalPrefix('api', {
    exclude: ['webhooks/stripe', 'webhooks/paypal', 'webhooks/mobile-money', 'uploads/(.*)'],
  });

  // ---- Graceful shutdown ----
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  logger.log(`Hotel Booking API running on port ${port} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  logger.log(`CORS allowed: ${[...new Set(corsOrigins)].join(', ')}`);
}
bootstrap();
