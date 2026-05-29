import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsNumber()
  @Min(0)
  pricePerNight: number;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsNumber()
  @IsOptional()
  adultsCapacity?: number;

  @IsNumber()
  @IsOptional()
  childrenCapacity?: number;

  @IsString()
  @IsOptional()
  bedType?: string;

  @IsNumber()
  @IsOptional()
  sizeM2?: number;

  @IsArray()
  @IsOptional()
  amenities?: string[];

  @IsEnum(['AVAILABLE', 'MAINTENANCE', 'DISABLED'])
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

export class UpdateRoomDto extends PartialType(CreateRoomDto) {}

export class RoomQueryDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  capacity?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  featured?: boolean;

  @IsString()
  @IsOptional()
  checkIn?: string;

  @IsString()
  @IsOptional()
  checkOut?: string;
}

export class AvailabilityQueryDto {
  @IsString()
  roomId: string;

  @IsString()
  checkIn: string;

  @IsString()
  checkOut: string;
}

export class AddRoomImageDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsOptional()
  altText?: string;
}
