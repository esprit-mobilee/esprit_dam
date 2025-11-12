// src/clubs/dto/update-club.dto.ts
import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateClubDto } from './create-club.dto';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateClubDto extends PartialType(CreateClubDto) {
  @ApiPropertyOptional({
    description: 'Nouveau président (Mongo _id ou identifiant)',
  })
  @IsOptional()
  @IsString()
  president?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
