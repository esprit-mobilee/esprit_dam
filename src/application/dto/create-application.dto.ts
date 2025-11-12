import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ example: '671a02b3b9c7a4e8a2fdf12a' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '671a02b3b9c7a4e8a2fdf12b' })
  @IsMongoId()
  @IsNotEmpty()
  internshipId: string;

  @ApiProperty({ example: 'https://cvstorage.com/may_cv.pdf' })
  @IsUrl()
  @IsNotEmpty()
  cvUrl: string;

  @ApiProperty({ example: 'Je suis motivée pour ce stage...' })
  @IsOptional()
  @IsString()
  coverLetter?: string;
}
