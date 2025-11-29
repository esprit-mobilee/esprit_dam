import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInternshipOfferDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  company: string;

  @ApiProperty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  location?: string;

  @Type(() => Number)
  @IsNumber()
  duration: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salary?: number;

  // 🔥 Ajouter les nouveaux champs
  @ApiProperty({ example: ['React', 'Node.js'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'Stage d’été', required: false })
  @IsOptional()
  @IsString()
  internshipType?: string;

  @ApiProperty({ example: 'Appel + test technique', required: false })
  @IsOptional()
  @IsString()
  procedure?: string;

  @ApiProperty({ example: 'Appel, test technique', required: false })
  @IsOptional()
  @IsString()
  interviewProcess?: string;

  @ApiProperty({ example: '2025-06-01', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: Date;
  @ApiProperty({ example: 0, required: false })
@IsOptional()
@Type(() => Number)
@IsNumber()
applicationsCount?: number;

@ApiProperty({ example: 5, required: false })
@IsOptional()
@Type(() => Number)
@IsNumber()
positionsAvailable?: number;


  @ApiProperty({ example: 'meet.google.com/xyz', required: false })
  @IsOptional()
  @IsString()
  interviewDetails?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
