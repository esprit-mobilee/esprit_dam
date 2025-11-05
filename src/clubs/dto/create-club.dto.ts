import { IsString, IsNotEmpty, IsOptional, IsArray, IsMongoId } from 'class-validator';
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

  @ApiProperty({ example: '65f1a4b2c8a4d8c4f8b2a7e9', description: 'ID du président (optionnel)' })
  @IsOptional()
  @IsMongoId()
  president?: string;

  @ApiProperty({ example: ['robotique', 'innovation'], description: 'Mots-clés' })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
