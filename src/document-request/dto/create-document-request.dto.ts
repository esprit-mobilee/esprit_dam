import { IsEnum, IsNotEmpty, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '../schemas/document-request.schema';

// DTO pour le formulaire d'attestation
export class AttestationFormDto {
  @ApiProperty({ example: '2024-2025', description: 'Année académique' })
  @IsString()
  @IsNotEmpty()
  annee: string;

  @ApiProperty({ example: 'Raison de la demande', required: false })
  @IsOptional()
  @IsString()
  raison?: string;
}

// DTO pour le formulaire de relevé de notes
export class ReleveFormDto {
  @ApiProperty({ example: '2024-2025', description: 'Année académique' })
  @IsString()
  @IsNotEmpty()
  annee: string;

  @ApiProperty({ example: '1', description: 'Semestre', required: false })
  @IsOptional()
  @IsString()
  semestre?: string;
}

// DTO pour le formulaire de convention de stage
export class ConventionFormDto {
  @ApiProperty({ example: '2024-2025', description: 'Année académique' })
  @IsString()
  @IsNotEmpty()
  annee: string;

  @ApiProperty({ example: 'Nom de l\'entreprise', required: false })
  @IsOptional()
  @IsString()
  entreprise?: string;

  @ApiProperty({ example: '2024-06-01', description: 'Date de début du stage', required: false })
  @IsOptional()
  @IsString()
  dateDebut?: string;

  @ApiProperty({ example: '2024-08-31', description: 'Date de fin du stage', required: false })
  @IsOptional()
  @IsString()
  dateFin?: string;
}

// DTO principal pour créer une demande
export class CreateDocumentRequestDto {
  @ApiProperty({
    example: 'attestation',
    enum: DocumentType,
    description: 'Type de document demandé',
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  type: DocumentType;

  @ApiProperty({
    example: '2024',
    description: 'Année académique',
  })
  @IsString()
  @IsNotEmpty()
  annee: string;
}
