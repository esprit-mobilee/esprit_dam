import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClubDto {
  @ApiProperty({ example: 'Club Robotique' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Club des passionnés de robotique et d’IA.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'PR001',
    description: 'ID MongoDB du président OU identifiant (ex: PR001)',
    required: false,
  })
  @IsOptional()
  @IsString()
  president?: string;

  @ApiProperty({
    example: 'robotique, innovation',
    description: 'Mots-clés séparés par des virgules',
    required: false,
  })
  @IsOptional()
  @IsString()
  tags?: string;          // 👈 string, plus de string[]

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Logo / image du club',
  })
  @IsOptional()
  image?: any;
}
