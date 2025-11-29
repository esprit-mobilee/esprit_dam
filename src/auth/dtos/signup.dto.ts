import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../enums/role.enum';

export class SignupDto {
  @ApiProperty({
    example: 'ST12345',
    description: "Identifiant de connexion (utilise dans l'application mobile)",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  identifiant: string;

  @ApiProperty({
    description: "Nom complet de l'utilisateur",
    example: 'Oussem Abderrahim',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: 'oussem@esprit.tn',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mot de passe (min 6 caracteres)',
    example: 'P@ssword123',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Classe / groupe (ex: 4SIM4)',
    example: '4SIM4',
    required: false,
  })
  @IsOptional()
  @IsString()
  classGroup?: string;

  @ApiProperty({
    description: "Role de l'utilisateur",
    example: 'student',
    enum: Role,
    required: false,
    default: Role.User,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
