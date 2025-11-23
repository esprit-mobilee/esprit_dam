import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
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
  startDate: Date;

  @ApiProperty({ example: '2025-12-12T17:00:00Z' })
  @IsDateString()
  endDate: Date;

  @ApiProperty({ example: 'Amphitheater 1' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    example: 'PR12345',
    description: "Identifiant du président (login), pas l'ObjectId",
  })
  @IsString()
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
