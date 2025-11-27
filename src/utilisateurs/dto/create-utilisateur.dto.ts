import { IsString, IsEmail, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUtilisateurDto {
  @ApiProperty({
    example: 'ST12345',
    description: "Identifiant étudiant unique de l'utilisateur",
  })
  @IsString()
  studentId: string;

  @ApiProperty({
    example: 'Amine',
    description: 'Prénom de l’utilisateur',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    example: 'Sassi',
    description: 'Nom de famille de l’utilisateur',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    example: 'amine@example.com',
    description: "Adresse email de l'utilisateur",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 22,
    description: "Âge de l'utilisateur",
  })
  @Type(() => Number)
  @IsNumber()
  age: number;

  @ApiPropertyOptional({
    example: 'https://cdn.artisfera.tn/uploads/amine-avatar.png',
    description: "Lien vers l'image de profil de l'utilisateur (facultatif)",
  })
  @IsOptional()
  @IsString()
  avatar?: string;
  @ApiProperty({
  example: '123456',
  description: 'Mot de passe du compte utilisateur',
})
@IsString()
password: string;

}
