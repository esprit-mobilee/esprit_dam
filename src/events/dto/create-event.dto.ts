import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Hackathon 2025' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Annual Esprit Hackathon event' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2025-12-10T09:00:00Z' })
  @IsDateString()
  date: Date;

  @ApiProperty({ example: 'Amphitheater 1' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    example: '64a8b19d6e3218a7f934a9f1',
    description: 'Organizer (User ID)',
  })
  @IsMongoId()
  @IsNotEmpty()
  organizerId: string;

  @ApiProperty({ example: 'Technology' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Affiche / image de l’événement',
  })
  @IsOptional()
  image?: any;
}
