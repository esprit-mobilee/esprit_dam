import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

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
  @IsNumber()
  duration: number;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  salary?: number;
}

