import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Notre événement commence bientôt !' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Image optionnelle du post',
  })
  @IsOptional()
  image?: any;
}
