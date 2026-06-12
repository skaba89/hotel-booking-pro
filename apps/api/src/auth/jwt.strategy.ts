import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

function extractFromCookieOrHeader(req: Request): string | null {
  const fromCookie = req.cookies?.access_token;
  if (fromCookie) return fromCookie;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: extractFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-secret-change-in-production'),
    });
  }

  /**
   * Called on every authenticated request after the JWT signature is verified.
   * We look up the user in DB so that:
   *  - Deactivated accounts (isActive=false) are rejected immediately, even
   *    within the 15-minute access token window.
   *  - Deleted users don't remain authenticated until token expiry.
   *
   * The DB hit is lightweight (PK lookup, single row) and is acceptable given
   * the security benefit. If this becomes a bottleneck, add Redis caching here.
   */
  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Compte désactivé ou introuvable');
    }

    return { sub: user.id, email: user.email, role: user.role };
  }
}
