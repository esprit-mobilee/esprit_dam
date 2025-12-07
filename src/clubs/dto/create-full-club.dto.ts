import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFullClubDto {
  @ApiProperty({ example: 'Club Robotique', description: 'Nom officiel du club' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Club des passionn\u00e9s de robotique et d\u2019IA.',
    description: 'Courte description du club',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'robotique, innovation, IA',
    description: 'Liste de tags s\u00e9par\u00e9s par des virgules',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    example: 'contact@club.tn',
    description: 'Email de contact du club (facultatif)',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description: 'Mot de passe du compte club (sera hach\u00e9)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Logo / image du club',
  })
  @IsOptional()
  image?: any;
}
