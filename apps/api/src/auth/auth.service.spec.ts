/**
 * Auth service — unit tests with mocked Prisma, JwtService, ConfigService, and EmailService.
 *
 * Coverage:
 *  - login: success, inactive user, wrong password
 *  - register: success, duplicate email
 *  - forgotPassword: always returns same message (no enumeration), token created
 *  - resetPassword: success, expired / unknown token
 *  - verifyEmail: success, expired token, unknown token
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  email: 'alice@example.com',
  passwordHash: 'hashed-password',
  fullName: 'Alice Dupont',
  phone: null,
  role: 'CUSTOMER',
  isActive: true,
  emailVerifiedAt: null,
  ...overrides,
});

const mockToken = (overrides: Partial<any> = {}) => ({
  id: 'token-uuid',
  userId: 'user-1',
  expiresAt: new Date(Date.now() + 3600_000), // 1 hour from now
  createdAt: new Date(),
  ...overrides,
});

// ─── Mocks ────────────────────────────────────────────────────────────────────

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  customer: { create: jest.fn() },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  passwordResetToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  emailVerificationToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
};

const jwtMock = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
  decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 7 * 86400 }),
};

const configMock = {
  get: jest.fn((key: string, fallback?: string) => fallback ?? null),
};

const emailMock = {
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendEmailVerificationEmail: jest.fn().mockResolvedValue(undefined),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService,  useValue: prismaMock  },
        { provide: JwtService,     useValue: jwtMock     },
        { provide: ConfigService,  useValue: configMock  },
        { provide: EmailService,   useValue: emailMock   },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens on valid credentials', async () => {
      const user = mockUser();
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.refreshToken.create.mockResolvedValue({});
      prismaMock.refreshToken.deleteMany.mockResolvedValue({});

      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await service.login({ email: user.email, password: 'password' });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(user.email);
    });

    it('throws UnauthorizedException for unknown email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'nope@example.com', password: 'x' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for inactive account', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser({ isActive: false }));
      await expect(service.login({ email: 'alice@example.com', password: 'x' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser());
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
      await expect(service.login({ email: 'alice@example.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // ── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates user + customer and returns tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser());
      prismaMock.customer.create.mockResolvedValue({});
      prismaMock.refreshToken.create.mockResolvedValue({});
      prismaMock.refreshToken.deleteMany.mockResolvedValue({});
      prismaMock.emailVerificationToken.deleteMany.mockResolvedValue({});
      prismaMock.emailVerificationToken.create.mockResolvedValue({});

      const result = await service.register({
        email: 'alice@example.com',
        password: 'Password1!',
        fullName: 'Alice Dupont',
      });

      expect(result).toHaveProperty('accessToken');
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.customer.create).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser());
      await expect(
        service.register({ email: 'alice@example.com', password: 'pass', fullName: 'Alice' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── forgotPassword ────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('always returns the same neutral message', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // unknown email
      const res = await service.forgotPassword('unknown@example.com');
      expect(res.message).toContain('Si un compte existe');
    });

    it('creates a reset token for an active user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser());
      prismaMock.passwordResetToken.deleteMany.mockResolvedValue({});
      prismaMock.passwordResetToken.create.mockResolvedValue({});

      await service.forgotPassword('alice@example.com');

      expect(prismaMock.passwordResetToken.create).toHaveBeenCalledTimes(1);
      expect(emailMock.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    });

    it('does NOT create a token or send email for an inactive user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser({ isActive: false }));
      await service.forgotPassword('alice@example.com');
      expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
      expect(emailMock.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  // ── resetPassword ─────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('updates password hash and returns success message', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(mockToken());
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.passwordResetToken.delete.mockResolvedValue({});
      prismaMock.refreshToken.deleteMany.mockResolvedValue({});

      const res = await service.resetPassword('token-uuid', 'NewPassword1!');
      expect(res.message).toContain('réinitialisé');
    });

    it('throws BadRequestException for an unknown token', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword('bad-token', 'pass')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for an expired token', async () => {
      const expired = mockToken({ expiresAt: new Date(Date.now() - 1000) }); // in the past
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(expired);
      prismaMock.passwordResetToken.delete.mockResolvedValue({});
      await expect(service.resetPassword('expired-token', 'pass')).rejects.toThrow(BadRequestException);
    });
  });

  // ── verifyEmail ───────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('marks emailVerifiedAt and returns success message', async () => {
      prismaMock.emailVerificationToken.findUnique.mockResolvedValue(mockToken());
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.emailVerificationToken.delete.mockResolvedValue({});

      const res = await service.verifyEmail('token-uuid');
      expect(res.message).toContain('vérifiée');
    });

    it('throws BadRequestException for an unknown token', async () => {
      prismaMock.emailVerificationToken.findUnique.mockResolvedValue(null);
      await expect(service.verifyEmail('bad-token')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for an expired token and deletes it', async () => {
      const expired = mockToken({ expiresAt: new Date(Date.now() - 1000) });
      prismaMock.emailVerificationToken.findUnique.mockResolvedValue(expired);
      prismaMock.emailVerificationToken.delete.mockResolvedValue({});

      await expect(service.verifyEmail('expired-token')).rejects.toThrow(BadRequestException);
      expect(prismaMock.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { id: 'expired-token' },
      });
    });
  });

  // ── resendVerification ────────────────────────────────────────────────────

  describe('resendVerification', () => {
    it('always returns the same neutral message', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const res = await service.resendVerification('unknown@example.com');
      expect(res.message).toContain('Si un compte');
    });

    it('sends a new token if user is unverified', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser({ emailVerifiedAt: null }));
      prismaMock.emailVerificationToken.deleteMany.mockResolvedValue({});
      prismaMock.emailVerificationToken.create.mockResolvedValue({});

      await service.resendVerification('alice@example.com');

      expect(prismaMock.emailVerificationToken.create).toHaveBeenCalledTimes(1);
      expect(emailMock.sendEmailVerificationEmail).toHaveBeenCalledTimes(1);
    });

    it('does NOT send a new token if user is already verified', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser({ emailVerifiedAt: new Date() }));
      await service.resendVerification('alice@example.com');
      expect(prismaMock.emailVerificationToken.create).not.toHaveBeenCalled();
    });
  });
});
