import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsIn,
  IsEmail,
  MaxLength,
  Matches,
  IsDateString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export const STAFF_DEPARTMENTS = [
  'HOUSEKEEPING',
  'RECEPTION',
  'RESTAURANT',
  'KITCHEN',
  'MAINTENANCE',
  'SECURITY',
  'MANAGEMENT',
  'OTHER',
] as const;

export const SHIFT_STATUSES = [
  'SCHEDULED',
  'COMPLETED',
  'ABSENT',
  'CANCELLED',
] as const;

export class CreateStaffMemberDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @IsIn(STAFF_DEPARTMENTS)
  department: (typeof STAFF_DEPARTMENTS)[number];

  @IsString()
  @IsOptional()
  @MaxLength(100)
  position?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(160)
  email?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  hireDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateStaffMemberDto extends PartialType(CreateStaffMemberDto) {}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateShiftDto {
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @IsDateString()
  date: string;

  @Matches(TIME_REGEX, { message: 'startTime must be HH:mm' })
  startTime: string;

  @Matches(TIME_REGEX, { message: 'endTime must be HH:mm' })
  endTime: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  area?: string;

  @IsIn(SHIFT_STATUSES)
  @IsOptional()
  status?: (typeof SHIFT_STATUSES)[number];

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class UpdateShiftDto extends PartialType(CreateShiftDto) {}
