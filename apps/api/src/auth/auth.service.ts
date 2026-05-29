import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
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

    return this.generateTokens(user.id, user.email, user.role);
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

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) throw new UnauthorizedException('Utilisateur non trouvé');
    return user;
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
