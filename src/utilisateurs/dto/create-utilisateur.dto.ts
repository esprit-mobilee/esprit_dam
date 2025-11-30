import { IsString, IsEmail, IsNumber, IsOptional, MinLength, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUtilisateurDto {
  @ApiProperty({
    example: 'ST12345',
    description: "Identifiant unique de connexion de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty()
  identifiant: string;

  @ApiProperty({
    example: 'Amine Sassi',
    description: "Nom complet de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Motdepasse123',
    description: 'Mot de passe du compte',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'ST12345',
    description: "Identifiant etudiant si applicable",
  })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({
    example: 'Amine',
    description: "Prenom de l'utilisateur",
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Sassi',
    description: "Nom de famille de l'utilisateur",
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'amine@example.com',
    description: "Adresse email de l'utilisateur",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 22,
    description: "Age de l'utilisateur",
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({
    example: 'https://cdn.artisfera.tn/uploads/amine-avatar.png',
    description: "Lien vers l'image de profil de l'utilisateur (facultatif)",
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}
