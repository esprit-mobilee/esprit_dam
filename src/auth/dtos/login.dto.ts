import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'robo-clb4912',
    description: "Identifiant unique de l'utilisateur (authentification uniquement par identifiant)",
  })
  @IsString()
  identifiant: string;

  @ApiProperty({
    example: 'Motdepasse123',
    description: 'Mot de passe (au moins 6 caract\u00e8res, avec un chiffre)',
  })
  @IsString()
  password: string;
}
