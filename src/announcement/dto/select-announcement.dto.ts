// dto/select-announcement.dto.ts
import { IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class SelectAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  audience: string;

  @IsString()
  @IsNotEmpty()
  instruction: string;

  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsInt()
  @Min(0)
  @Max(2) // car on génère 3 annonces
  selectedIndex: number;
}
