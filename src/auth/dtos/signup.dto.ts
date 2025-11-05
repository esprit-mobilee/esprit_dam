import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../enums/role.enum';

export class SignupDto {
  @ApiProperty({
    description: 'Nom complet de l’utilisateur',
    example: 'Mohamed Amine Sassi',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Adresse email de l’utilisateur',
    example: 'amine.sassi@esprit.tn',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mot de passe de connexion (min 6 caractères)',
    example: 'P@ssword123',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Rôle de l’utilisateur (Admin, President, User)',
    example: 'User',
    enum: Role,
    default: Role.User,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
