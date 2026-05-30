import { Controller, Get, Res, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';

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
    const dateFilter =
      from || to
        ? {
            expenseDate: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
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
        where: { paymentStatus: 'PAID' },
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
      orderBy: { paidAt: 'asc' },
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

  @Get('customers')
  async getCustomers(@Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

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
    const bookings = await this.prisma.booking.findMany({
      include: { room: true },
      orderBy: { createdAt: 'desc' },
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
}
