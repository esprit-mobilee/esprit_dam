import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'ST12345',
    description: "Identifiant unique de l'utilisateur (étudiant, parent, enseignant, admin)",
  })
  @IsString()
  identifiant: string;

  @ApiProperty({
    example: 'Motdepasse123',
    description: 'Mot de passe (au moins 6 caractères, avec un chiffre)',
  })
  @IsString()
  password: string;
}
