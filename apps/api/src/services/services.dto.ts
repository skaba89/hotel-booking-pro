import { IsString, IsNumber, IsOptional, IsNotEmpty, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
