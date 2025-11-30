import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateEventDto {
  @ApiProperty({ example: 'Hackathon 2025' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty({ example: 'Annual Esprit Hackathon event' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiProperty({ 
    example: '2025-12-10T09:00:00Z',
    description: 'Date de début au format ISO 8601 (ex: 2025-12-10T09:00:00Z)'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, {
    message: 'startDate doit être au format ISO 8601 (ex: 2025-12-10T09:00:00Z)'
  })
  startDate: string;

  @ApiProperty({ 
    example: '2025-12-12T17:00:00Z',
    description: 'Date de fin au format ISO 8601 (ex: 2025-12-12T17:00:00Z)'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, {
    message: 'endDate doit être au format ISO 8601 (ex: 2025-12-12T17:00:00Z)'
  })
  endDate: string;

  @ApiProperty({ example: 'Amphitheater 1' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  location?: string;

  @ApiProperty({
    example: 'PR12345',
    description: "Identifiant du président (login), pas l'ObjectId. Défini automatiquement par le backend.",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  organizerId?: string;

  @ApiProperty({ example: 'Technology' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
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
