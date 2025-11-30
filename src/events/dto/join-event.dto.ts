import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class JoinEventDto {
  @ApiProperty({
    example: 'Ahmed Ben Ali',
    description: 'Nom complet du participant',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    example: 'ST12345',
    description: "Identifiant étudiant ou matricule",
    required: false,
  })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({
    example: 'ahmed.benali@esprit.tn',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    example: 'Je suis intéressé par la logistique.',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}


