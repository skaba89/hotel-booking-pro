import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
  MaxLength,
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
  @MaxLength(500)
  description: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsDateString()
  expenseDate: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  vendor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  invoiceNumber?: string;

  @IsEnum(EXPENSE_PAYMENT_METHODS)
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  receiptUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateExpenseDto {
  @IsEnum(EXPENSE_CATEGORIES)
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  amount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsDateString()
  @IsOptional()
  expenseDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  vendor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  invoiceNumber?: string;

  @IsEnum(EXPENSE_PAYMENT_METHODS)
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  receiptUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class ExpenseQueryDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Max(200)
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
