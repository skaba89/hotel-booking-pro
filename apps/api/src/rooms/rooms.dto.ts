import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, IsNotEmpty, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateRoomDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
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
  @MaxLength(50)
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
  @Max(100)
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
  @MaxLength(500)
  imageUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  altText?: string;
}
