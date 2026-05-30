import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export const EXPENSE_CATEGORIES = [
  'SUPPLIES',
  'SALARIES',
  'UTILITIES',
  'MAINTENANCE',
  'MARKETING',
  'FOOD_BEVERAGE',
  'RENT',
  'TAXES',
  'OTHER',
] as const;

export const EXPENSE_PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'MOBILE_MONEY',
  'CARD',
  'CHECK',
  'OTHER',
] as const;

export class CreateExpenseDto {
  @IsEnum(EXPENSE_CATEGORIES)
  category: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  expenseDate: string;

  @IsString()
  @IsOptional()
  vendor?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsEnum(EXPENSE_PAYMENT_METHODS)
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateExpenseDto {
  @IsEnum(EXPENSE_CATEGORIES)
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  @IsOptional()
  expenseDate?: string;

  @IsString()
  @IsOptional()
  vendor?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsEnum(EXPENSE_PAYMENT_METHODS)
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ExpenseQueryDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsEnum(EXPENSE_CATEGORIES)
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  search?: string;

  // Bornes optionnelles sur la date de dépense (ISO).
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}
