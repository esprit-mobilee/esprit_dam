// src/application/dto/create-application.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({
    example: 'HT12345',
    description:
      "Identifiant étudiant (matricule ESPRIT ou ObjectId sous forme de string)",
  })
  @IsString()
  @IsNotEmpty()
  userId: string; // identifiant étudiant

  @ApiProperty({
    example: '671a02b3b9c7a4e8a2fdf12b',
    description: "ID MongoDB de l'offre de stage (InternshipOffer)",
  })
  @IsString()
  @IsNotEmpty()
  internshipId: string;

  @ApiProperty({
    example: 'https://cvstorage.com/may_cv.pdf',
    description:
      "CV de l'étudiant – peut être une URL http(s) OU un content:// URI de fichier",
    required: false,
  })
  @IsOptional()
  @IsString()
  cvUrl?: string;

  @ApiProperty({
    example: 'Je suis motivée pour ce stage...',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverLetter?: string;

  @ApiProperty({
    example: '/uploads/applications/coverletter_may.pdf',
    required: false,
    description: 'Lien vers un fichier de lettre de motivation (optionnel)',
  })
  @IsOptional()
  @IsString()
  coverLetterFileUrl?: string;
}
