import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateClubDto } from './create-club.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateClubDto extends PartialType(CreateClubDto) {
  @ApiPropertyOptional({
    description: 'Nouveau président (Mongo _id ou identifiant)',
  })
  @IsOptional()
  @IsString()
  president?: string;

  @ApiPropertyOptional({
    example: 'robotique, innovation',
    description: 'Liste des tags séparés par des virgules',
  })
  @IsOptional()
  @IsString()
  tags?: string;          // 👈 string, pour matcher le service

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Nouveau logo / nouvelle image du club',
  })
  @IsOptional()
  image?: any;
}
