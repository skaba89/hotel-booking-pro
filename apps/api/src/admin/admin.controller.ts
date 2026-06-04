import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Res, Body, Query, UseGuards, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IsEmail, IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

class CreateUserDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsString() @IsNotEmpty() fullName: string;
  @IsString() @IsOptional() phone?: string;
  @IsEnum(['ADMIN', 'STAFF', 'CUSTOMER']) role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
}

class UpdateUserDto {
  @IsString() @IsOptional() fullName?: string;
  @IsString() @IsOptional() phone?: string;
  @IsEnum(['ADMIN', 'STAFF', 'CUSTOMER']) @IsOptional() role?: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  @IsBoolean() @IsOptional() @Type(() => Boolean) isActive?: boolean;
  @IsString() @MinLength(8) @IsOptional() password?: string;
}
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'STAFF')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('dashboard/stats')
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalBookings,
      todayBookings,
      confirmedBookings,
      cancelledBookings,
      totalRooms,
      availableRooms,
      maintenanceRooms,
      revenueResult,
      expensesResult,
    ] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      this.prisma.booking.count({ where: { bookingStatus: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { bookingStatus: 'CANCELLED' } }),
      this.prisma.room.count(),
      this.prisma.room.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.room.count({ where: { status: 'MAINTENANCE' } }),
      this.prisma.booking.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);

    const occupiedToday = await this.prisma.booking.count({
      where: {
        bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] },
        checkInDate: { lte: today },
        checkOutDate: { gt: today },
      },
    });

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedToday / totalRooms) * 100) : 0;

    const totalRevenue = Number(revenueResult._sum.totalAmount || 0);
    const totalExpenses = Number(expensesResult._sum.amount || 0);

    return {
      totalBookings,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      todayBookings,
      confirmedBookings,
      cancelledBookings,
      occupancyRate,
      availableRooms,
      maintenanceRooms,
    };
  }

  /**
   * Synthèse financière des dépenses : total, répartition par catégorie et
   * bénéfice net (recettes encaissées − dépenses). Bornable par dates (ISO).
   */
  @Get('dashboard/expenses-summary')
  async getExpensesSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate   = to   ? new Date(to)   : undefined;
    if (fromDate && isNaN(fromDate.getTime())) throw new BadRequestException('Date "from" invalide');
    if (toDate   && isNaN(toDate.getTime()))   throw new BadRequestException('Date "to" invalide');

    const dateFilter =
      fromDate || toDate
        ? {
            expenseDate: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate   && { lte: toDate }),
            },
          }
        : {};

    const [grouped, totalResult, revenueResult] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['category'],
        where: dateFilter,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.expense.aggregate({
        where: dateFilter,
        _sum: { amount: true },
      }),
      this.prisma.booking.aggregate({
        // Build a separate date filter using createdAt (Booking has no expenseDate).
        // createdAt is a good proxy for "bookings made during this period".
        where: {
          paymentStatus: 'PAID',
          ...(fromDate || toDate
            ? { createdAt: { ...(fromDate && { gte: fromDate }), ...(toDate && { lte: toDate }) } }
            : {}),
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const byCategory = grouped
      .map((g) => ({
        category: g.category,
        amount: Number(g._sum.amount || 0),
        count: g._count._all,
      }))
      .sort((a, b) => b.amount - a.amount);

    const totalExpenses = Number(totalResult._sum.amount || 0);
    const totalRevenue = Number(revenueResult._sum.totalAmount || 0);

    return {
      totalExpenses,
      totalRevenue,
      netProfit: totalRevenue - totalExpenses,
      byCategory,
    };
  }

  /**
   * Rapport financier consolidé sur une période (base "encaissements") :
   * recettes (paiements réussis) − dépenses = bénéfice net, avec le détail
   * de chaque ligne pour export PDF/CSV. Défaut = mois en cours.
   */
  @Get('reports/financial')
  async getFinancialReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate   = to   ? new Date(to)   : now;
    if (from && isNaN(fromDate.getTime())) throw new BadRequestException('Date "from" invalide');
    if (to   && isNaN(toDate.getTime()))   throw new BadRequestException('Date "to" invalide');
    const toEnd = new Date(toDate);
    toEnd.setHours(23, 59, 59, 999);

    const [payments, expenses, expenseGrouped] = await Promise.all([
      this.prisma.payment.findMany({
        where: { status: 'SUCCESS', paidAt: { gte: fromDate, lte: toEnd } },
        include: { booking: { select: { bookingReference: true, customerName: true } } },
        orderBy: { paidAt: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: { expenseDate: { gte: fromDate, lte: toEnd } },
        orderBy: { expenseDate: 'asc' },
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where: { expenseDate: { gte: fromDate, lte: toEnd } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

    const byCategory = expenseGrouped
      .map((g) => ({
        category: g.category,
        amount: Number(g._sum.amount || 0),
        count: g._count._all,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      period: { from: fromDate.toISOString(), to: toEnd.toISOString() },
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      byCategory,
      revenues: payments.map((p) => ({
        date: p.paidAt,
        reference: p.booking?.bookingReference || '-',
        customer: p.booking?.customerName || '-',
        method: p.paymentMethod,
        amount: Number(p.amount),
        currency: p.currency,
      })),
      expenses: expenses.map((e) => ({
        date: e.expenseDate,
        reference: e.reference,
        category: e.category,
        description: e.description,
        vendor: e.vendor || '-',
        amount: Number(e.amount),
        currency: e.currency,
      })),
    };
  }

  @Get('dashboard/revenue')
  async getRevenue(@Query('period') period: string = 'month') {
    const now = new Date();
    let startDate: Date;

    if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startDate },
      },
      // Select only the fields needed for the chart — avoids returning rawProviderResponse
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        paidAt: true,
        createdAt: true,
      },
      orderBy: { paidAt: 'asc' },
      take: 2_000,
    });

    return payments;
  }

  @Get('dashboard/latest-bookings')
  getLatestBookings() {
    return this.prisma.booking.findMany({
      include: { room: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Valide manuellement un paiement PAY_AT_HOTEL (ou tout paiement PENDING).
   * Met à jour payment.status → SUCCESS et booking.paymentStatus → PAID
   * dans une transaction atomique.
   */
  @Patch('payments/:id/confirm')
  async confirmPaymentAtHotel(@Param('id') id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!payment) throw new NotFoundException('Paiement non trouvé');
    if (payment.status === 'SUCCESS') return { message: 'Paiement déjà confirmé' };

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id },
        data: { status: 'SUCCESS', paidAt: new Date() },
      }),
      this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: 'PAID' },
      }),
    ]);

    return { message: 'Paiement confirmé avec succès' };
  }

  @Get('dashboard/latest-payments')
  getLatestPayments() {
    return this.prisma.payment.findMany({
      include: { booking: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  @Get('dashboard/occupancy')
  async getOccupancy() {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all data in 2 queries instead of 30
    const [totalRooms, bookings] = await Promise.all([
      this.prisma.room.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.booking.findMany({
        where: {
          bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] },
          checkOutDate: { gt: startDate },
          checkInDate: { lte: today },
        },
        select: { checkInDate: true, checkOutDate: true },
      }),
    ]);

    // Calculate occupancy for each day in memory
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const occupied = bookings.filter(
        (b) => b.checkInDate <= date && b.checkOutDate > date,
      ).length;

      days.push({
        date: date.toISOString().split('T')[0],
        occupancy: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0,
      });
    }

    return days;
  }

  /**
   * Weekly occupancy for the last N weeks (default 8).
   * Returns one data point per week: ISO week start date + avg occupancy %.
   */
  @Get('dashboard/chart/occupancy')
  async getWeeklyOccupancy(@Query('weeks') weeksParam = '8') {
    const weeks = Math.min(Math.max(Number(weeksParam) || 8, 1), 52);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Monday of current week
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    currentMonday.setHours(0, 0, 0, 0);

    const startDate = new Date(currentMonday);
    startDate.setDate(startDate.getDate() - (weeks - 1) * 7);

    const [totalRooms, bookings] = await Promise.all([
      this.prisma.room.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.booking.findMany({
        where: {
          bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] },
          checkOutDate: { gt: startDate },
          checkInDate:  { lte: today },
        },
        select: { checkInDate: true, checkOutDate: true },
      }),
    ]);

    const result = [];
    for (let w = 0; w < weeks; w++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Avg occupancy over the 7 days of the week
      let totalOcc = 0;
      for (let d = 0; d < 7; d++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + d);
        const occupied = bookings.filter(
          (b) => b.checkInDate <= day && b.checkOutDate > day,
        ).length;
        totalOcc += totalRooms > 0 ? (occupied / totalRooms) * 100 : 0;
      }

      result.push({
        weekStart: weekStart.toISOString().split('T')[0],
        occupancy: Math.round(totalOcc / 7),
      });
    }

    return result;
  }

  /**
   * Monthly revenue + booking count for the last N months (default 6).
   */
  @Get('dashboard/chart/revenue')
  async getMonthlyRevenue(@Query('months') monthsParam = '6') {
    const months = Math.min(Math.max(Number(monthsParam) || 6, 1), 24);
    const now = new Date();

    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const payments = await this.prisma.payment.findMany({
      where: { status: 'SUCCESS', paidAt: { gte: startDate } },
      select: { amount: true, paidAt: true },
      take: 5_000,
    });

    const result: { month: string; revenue: number; label: string }[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

      const revenue = payments
        .filter((p) => {
          if (!p.paidAt) return false;
          const pd = new Date(p.paidAt);
          return pd.getFullYear() === year && pd.getMonth() === month;
        })
        .reduce((s, p) => s + Number(p.amount), 0);

      result.push({ month: key, revenue, label });
    }

    return result;
  }

  /**
   * Notifications — PENDING bookings from the last 48h (unread badge).
   * Lightweight endpoint polled every 30s from the admin layout.
   */
  @Get('notifications')
  async getNotifications() {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const recent = await this.prisma.booking.findMany({
      where: {
        bookingStatus: 'PENDING',
        createdAt: { gte: since },
      },
      select: {
        id: true,
        bookingReference: true,
        customerName: true,
        checkInDate: true,
        createdAt: true,
        room: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      pendingCount: recent.length,
      recent,
    };
  }

  @Get('customers')
  async getCustomers(@Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    const skip = (Number(page) - 1) * Number(limit);
    // Hard-cap: prevents ?limit=99999 from loading the entire table
    const take = Math.min(Math.max(Number(limit) || 20, 1), 200);

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { _count: { select: { bookings: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  @Get('export/bookings.csv')
  async exportBookingsCsv(@Res() res: Response) {
    // Hard-cap: prevents loading the entire table into RAM on large datasets.
    // For a full history export, use a paginated/streaming approach instead.
    const bookings = await this.prisma.booking.findMany({
      include: { room: true },
      orderBy: { createdAt: 'desc' },
      take: 5_000,
    });

    const headers = ['Référence', 'Client', 'Email', 'Chambre', 'Arrivée', 'Départ', 'Nuits', 'Montant', 'Devise', 'Statut Paiement', 'Statut Réservation', 'Créée le'];
    const rows = bookings.map((b) => [
      b.bookingReference,
      b.customerName,
      b.customerEmail,
      b.room.name,
      new Date(b.checkInDate).toLocaleDateString('fr-FR'),
      new Date(b.checkOutDate).toLocaleDateString('fr-FR'),
      b.nights,
      Number(b.totalAmount),
      b.currency,
      b.paymentStatus,
      b.bookingStatus,
      new Date(b.createdAt).toLocaleDateString('fr-FR'),
    ]);

    const escapeCsv = (val: any) => {
      let s = String(val).replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return `"${s}"`;
    };
    const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="reservations.csv"',
    });
    res.send('﻿' + csv);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // User management — ADMIN only
  // ══════════════════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Lister tous les utilisateurs (ADMIN)' })
  @Roles('ADMIN')
  @Get('users')
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const where: any = {};
    if (role && ['ADMIN', 'STAFF', 'CUSTOMER'].includes(role)) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { fullName:  { contains: search, mode: 'insensitive' } },
        { email:     { contains: search, mode: 'insensitive' } },
        { phone:     { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerifiedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page: Number(page), totalPages: Math.ceil(total / take) };
  }

  @ApiOperation({ summary: 'Créer un compte utilisateur (ADMIN)' })
  @Roles('ADMIN')
  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Un compte existe déjà avec cet email');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: dto.role as any,
        isActive: true,
      },
      select: { id: true, email: true, fullName: true, phone: true, role: true, isActive: true, createdAt: true },
    });

    // Create customer record if role is CUSTOMER
    if (dto.role === 'CUSTOMER') {
      await this.prisma.customer.create({
        data: { userId: user.id, fullName: dto.fullName, email: dto.email, phone: dto.phone },
      }).catch(() => undefined);
    }

    return user;
  }

  @ApiOperation({ summary: 'Modifier un utilisateur — rôle, statut, mot de passe (ADMIN)' })
  @Roles('ADMIN')
  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const updateData: any = {};
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.phone   !== undefined) updateData.phone    = dto.phone;
    if (dto.role    !== undefined) updateData.role     = dto.role;
    if (dto.isActive!== undefined) updateData.isActive = dto.isActive;
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, fullName: true, phone: true, role: true, isActive: true, createdAt: true },
    });

    // Keep customer record in sync
    if (dto.fullName || dto.phone) {
      await this.prisma.customer.updateMany({
        where: { userId: id },
        data: {
          ...(dto.fullName && { fullName: dto.fullName }),
          ...(dto.phone    !== undefined && { phone: dto.phone }),
        },
      }).catch(() => undefined);
    }

    return updated;
  }

  @ApiOperation({ summary: 'Désactiver un utilisateur — soft-delete (ADMIN)' })
  @Roles('ADMIN')
  @Delete('users/:id')
  async deactivateUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    // Prevent deactivating the last ADMIN
    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (adminCount <= 1) {
        throw new ForbiddenException('Impossible de désactiver le dernier compte ADMIN');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
  }
}
