// src/clubs/dto/create-club.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClubDto {
  @ApiProperty({ example: 'Club Robotique' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Club des passionnés de robotique et d’IA.' })
  @IsOptional()
  @IsString()
  description?: string;

  // 👇 IMPORTANT: now it's just a string, not @IsMongoId
  // we accept either a Mongo _id or an identifiant like "PR001"
  @ApiProperty({
    example: 'PR001',
    description: 'ID MongoDB du président OU identifiant (ex: PR001)',
    required: false,
  })
  @IsOptional()
  @IsString()
  president?: string;

  @ApiProperty({
    example: ['robotique', 'innovation'],
    description: 'Mots-clés',
    required: false,
  })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
