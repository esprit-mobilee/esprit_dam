// src/internship-offers/dto/create-internship-offer.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInternshipOfferDto {
  @ApiProperty({ example: 'Développeur Web' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'ESPRIT' })
  @IsString()
  company: string;

  @ApiProperty({ example: 'Développement d’une application en React' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Tunis', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 8 })
  @Type(() => Number) // 👈 conversion auto
  @IsNumber()
  duration: number;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @Type(() => Number) // 👈 conversion auto
  @IsNumber()
  salary?: number;

  @ApiProperty({ example: '/uploads/logos/esprit.png', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}
