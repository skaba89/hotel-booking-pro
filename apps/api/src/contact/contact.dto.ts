import { IsString, IsEmail, IsOptional, IsNotEmpty, MaxLength, IsEnum } from 'class-validator';

export class CreateContactMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}

export class UpdateContactStatusDto {
  @IsEnum(['NEW', 'READ', 'REPLIED', 'ARCHIVED'])
  status: string;
}

export class SubscribeNewsletterDto {
  @IsEmail()
  email: string;
}
