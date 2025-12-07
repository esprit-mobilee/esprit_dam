import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateClubDto {
  @ApiPropertyOptional({ example: 'Club Robotique' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Club des passionnes de robotique et dIA.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'PR001',
    description: 'ID MongoDB du president OU identifiant (ex: PR001)',
    required: false,
  })
  @IsOptional()
  @IsString()
  president?: string;

  @ApiPropertyOptional({
    example: 'robotique, innovation',
    description: 'Mots-cles separes par des virgules',
    required: false,
  })
  @IsOptional()
  @IsString()
  tags?: string;
}
