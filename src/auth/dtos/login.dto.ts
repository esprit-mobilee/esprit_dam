import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
      example: 'amine@example.com',
      description: "Adresse email de l'utilisateur",
    })
  @IsEmail()
  email: string;

  
      @ApiProperty({
    example: 'Motdepasse123',
    description: 'Mot de passe (au moins 6 caractères, avec un chiffre)',
  })
  @IsString()
  password: string;
}
