import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: 'CUSTOMER',
      },
    });

    await this.prisma.customer.create({
      data: {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    });

    // Fire-and-forget: send verification email (non-blocking, does not fail registration)
    this.sendVerificationTokenEmail(user.id, user.email, user.fullName).catch(() => undefined);

    return this.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Verify email — step 2 of email verification flow.
   * Marks the user's emailVerifiedAt and deletes the consumed token (single-use).
   */
  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { id: token } });

    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await this.prisma.emailVerificationToken.delete({ where: { id: token } }).catch(() => undefined);
      }
      throw new BadRequestException('Lien invalide ou expiré. Veuillez demander un nouvel email de vérification.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.delete({ where: { id: token } }),
    ]);

    return { message: 'Adresse email vérifiée avec succès. Vous pouvez maintenant vous connecter.' };
  }

  /**
   * Resend verification email — always returns same message (prevents email enumeration).
   * Does nothing if the account is already verified or does not exist.
   */
  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && user.isActive && !user.emailVerifiedAt) {
      await this.sendVerificationTokenEmail(user.id, user.email, user.fullName).catch(() => undefined);
    }

    return { message: 'Si un compte non vérifié existe pour cet email, un nouveau lien a été envoyé.' };
  }

  /** Creates a fresh verification token (deletes old ones) and sends the email. */
  private async sendVerificationTokenEmail(userId: string, email: string, fullName: string) {
    // One active token per user
    await this.prisma.emailVerificationToken.deleteMany({ where: { userId } }).catch(() => undefined);

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerificationToken.create({
      data: { id: token, userId, expiresAt },
    });

    await this.email.sendEmailVerificationEmail(email, fullName, token);
  }

  async refreshToken(refreshToken: string) {
    let payload: { sub: string; jti?: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
      });
    } catch {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }

    // jti obligatoire : les anciens tokens stateless n'en ont pas -> rejet
    // (cutover : reconnexion unique apres le deploiement).
    if (!payload.jti) {
      throw new UnauthorizedException('Session expirée, veuillez vous reconnecter');
    }

    // Le token doit correspondre a une ligne existante, non rotee ni expiree.
    const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: payload.jti } }).catch(() => undefined);
      }
      throw new UnauthorizedException('Session expirée, veuillez vous reconnecter');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      await this.prisma.refreshToken.delete({ where: { id: payload.jti } }).catch(() => undefined);
      throw new UnauthorizedException('Token invalide');
    }

    // Rotation : on revoque l'ancien token (suppression) puis on en emet un nouveau.
    await this.prisma.refreshToken.delete({ where: { id: payload.jti } }).catch(() => undefined);

    return this.generateTokens(user.id, user.email, user.role);
  }

  /** Revoque le refresh token courant (logout). Best-effort : ne leve jamais. */
  async revokeRefreshToken(refreshToken?: string) {
    if (!refreshToken) return;
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
      }) as { jti?: string };
      if (payload.jti) {
        await this.prisma.refreshToken.delete({ where: { id: payload.jti } }).catch(() => undefined);
      }
    } catch {
      // Token invalide/expire : rien a revoquer.
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Utilisateur non trouvé');

    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Mot de passe modifié avec succès' };
  }

  /**
   * Forgot-password flow — step 1.
   * Always returns the same success message to prevent email enumeration.
   * Deletes any existing token for the user before creating the new one.
   */
  async forgotPassword(email: string) {
    // Constant-time response — do not reveal whether the email exists
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && user.isActive) {
      // Delete any existing token for this user (one active token at a time)
      await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }).catch(() => undefined);

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.passwordResetToken.create({
        data: { id: token, userId: user.id, expiresAt },
      });

      // Fire-and-forget — do not let email errors reveal user existence
      this.email.sendPasswordResetEmail(email, user.fullName, token).catch(() => undefined);
    }

    return { message: 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.' };
  }

  /**
   * Forgot-password flow — step 2.
   * Validates the token, resets the password, and deletes the token (single-use).
   */
  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { id: token } });

    if (!record || record.expiresAt < new Date()) {
      // Delete expired record to keep the table clean
      if (record) await this.prisma.passwordResetToken.delete({ where: { id: token } }).catch(() => undefined);
      throw new BadRequestException('Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.delete({ where: { id: token } }),
      // Revoke all active sessions — forces re-login after password reset
      this.prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    return { message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    if (!user) throw new UnauthorizedException('Utilisateur non trouvé');
    return user;
  }

  async updateProfile(userId: string, data: { fullName?: string; phone?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Utilisateur non trouvé');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      select: { id: true, email: true, fullName: true, phone: true, role: true, emailVerifiedAt: true },
    });

    // Keep customer record in sync
    await this.prisma.customer.updateMany({
      where: { userId },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    }).catch(() => undefined);

    return updated;
  }

  async getMyBookings(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!customer) return [];

    return this.prisma.booking.findMany({
      where: { customerId: customer.id },
      include: { room: { select: { name: true, images: { take: 1, select: { imageUrl: true, altText: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload);

    // jti unique embarque dans le refresh token + ligne correspondante en base.
    const jti = randomUUID();
    const refreshToken = this.jwt.sign(
      { ...payload, jti },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      },
    );

    // expiresAt derive du claim exp du token (cohérent avec sa vraie expiration).
    const decoded = this.jwt.decode(refreshToken) as { exp?: number } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({ data: { id: jti, userId, expiresAt } });

    // Nettoyage opportuniste des tokens expires de cet utilisateur.
    await this.prisma.refreshToken
      .deleteMany({ where: { userId, expiresAt: { lt: new Date() } } })
      .catch(() => undefined);

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, role },
    };
  }
}
