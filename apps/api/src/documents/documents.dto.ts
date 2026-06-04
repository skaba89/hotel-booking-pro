import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
  Max,
  MaxLength,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DocumentLineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;
}

export class CreateDocumentDto {
  @IsEnum(['QUOTE', 'INVOICE'])
  type: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  clientName: string;

  @IsEmail()
  clientEmail: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  clientPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  clientAddress?: string;

  @IsString()
  @IsOptional()
  bookingId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  taxRate?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DocumentLineDto)
  lines: DocumentLineDto[];
}

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  clientName?: string;

  @IsEmail()
  @IsOptional()
  clientEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  clientPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  clientAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  taxRate?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DocumentLineDto)
  lines?: DocumentLineDto[];
}

export class UpdateDocumentStatusDto {
  @IsEnum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'PAID', 'CANCELLED'])
  status: string;
}

export class CreateDocumentFromBookingDto {
  @IsEnum(['QUOTE', 'INVOICE'])
  type: string;

  @IsString()
  @IsNotEmpty()
  bookingId: string;
}

export class DocumentQueryDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Max(200)
  @Type(() => Number)
  limit?: number = 20;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
