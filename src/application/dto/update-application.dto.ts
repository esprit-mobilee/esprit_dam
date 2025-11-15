// src/application/dto/update-application.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationDto } from './create-application.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsIn } from 'class-validator';

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {
  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  aiScore?: number;

  @ApiPropertyOptional({
    example: 'accepted',
    enum: ['pending', 'accepted', 'rejected'],
  })
  @IsOptional()
  @IsIn(['pending', 'accepted', 'rejected'])
  status?: string;

  @ApiPropertyOptional({ example: 'Nouvelle lettre de motivation' })
  @IsOptional()
  @IsString()
  coverLetter?: string;
}
