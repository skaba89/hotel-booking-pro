import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryDto,
} from './expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Référence séquentielle par année : DEP-2026-0001. Calculée dans la
   * transaction de création ; la contrainte d'unicité sur `reference` sert de
   * filet de sécurité en cas de course (faible volume).
   */
  private async generateReference(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const count = await tx.expense.count({
      where: { reference: { startsWith: `DEP-${year}-` } },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `DEP-${year}-${seq}`;
  }

  async create(dto: CreateExpenseDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const reference = await this.generateReference(tx);
      return tx.expense.create({
        data: {
          reference,
          category: dto.category as any,
          description: dto.description,
          amount: dto.amount,
          currency: dto.currency || 'GNF',
          expenseDate: new Date(dto.expenseDate),
          vendor: dto.vendor,
          invoiceNumber: dto.invoiceNumber,
          paymentMethod: (dto.paymentMethod as any) || 'CASH',
          receiptUrl: dto.receiptUrl,
          notes: dto.notes,
          createdById: userId || null,
        },
      });
    });
  }

  async findAll(query: ExpenseQueryDto) {
    const { page = 1, limit = 20, category, search, from, to } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = {
      ...(category && { category: category as any }),
      ...((from || to) && {
        expenseDate: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
      ...(search && {
        OR: [
          { reference: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { vendor: { contains: search, mode: 'insensitive' as const } },
          { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total, sum] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: { expenseDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
      this.prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      // Total (filtré) pratique pour l'en-tête de la liste.
      totalAmount: Number(sum._sum.amount || 0),
    };
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Dépense non trouvée');
    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findOne(id);
    const data: Prisma.ExpenseUpdateInput = {
      ...(dto.category !== undefined && { category: dto.category as any }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.expenseDate !== undefined && {
        expenseDate: new Date(dto.expenseDate),
      }),
      ...(dto.vendor !== undefined && { vendor: dto.vendor }),
      ...(dto.invoiceNumber !== undefined && {
        invoiceNumber: dto.invoiceNumber,
      }),
      ...(dto.paymentMethod !== undefined && {
        paymentMethod: dto.paymentMethod as any,
      }),
      ...(dto.receiptUrl !== undefined && { receiptUrl: dto.receiptUrl }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    };
    return this.prisma.expense.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.expense.delete({ where: { id } });
    return { message: 'Dépense supprimée' };
  }
}
