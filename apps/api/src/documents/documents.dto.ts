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
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DocumentLineDto {
  @IsString()
  @IsNotEmpty()
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
  clientName: string;

  @IsEmail()
  clientEmail: string;

  @IsString()
  @IsOptional()
  clientPhone?: string;

  @IsString()
  @IsOptional()
  clientAddress?: string;

  @IsString()
  @IsOptional()
  bookingId?: string;

  @IsString()
  @IsOptional()
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
  clientName?: string;

  @IsEmail()
  @IsOptional()
  clientEmail?: string;

  @IsString()
  @IsOptional()
  clientPhone?: string;

  @IsString()
  @IsOptional()
  clientAddress?: string;

  @IsString()
  @IsOptional()
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
