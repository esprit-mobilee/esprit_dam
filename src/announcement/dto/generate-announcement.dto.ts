import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class GenerateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  audience: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  instruction: string;
}
