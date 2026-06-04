import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@setifana.com', description: 'Adresse email du compte' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ example: 'Admin@2024!', description: 'Mot de passe (min 8 chars)' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MaxLength(128)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string;

  @ApiProperty({ example: 'Alice Camara' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom complet est requis' })
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({ example: '+224612345678' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;
}

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'Refresh token optionnel si le cookie refresh_token est présent' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  refreshToken?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mot de passe actuel' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe actuel est requis' })
  currentPassword: string;

  @ApiProperty({ description: 'Nouveau mot de passe (min 8 chars)' })
  @IsString()
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token reçu par email' })
  @IsString()
  @IsNotEmpty({ message: 'Le token est requis' })
  token: string;

  @ApiProperty({ description: 'Nouveau mot de passe (min 8 chars)', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(128)
  password: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Alice Camara' })
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide' })
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: '+224612345678' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token de vérification reçu par email' })
  @IsString()
  @IsNotEmpty({ message: 'Le token est requis' })
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;
}
