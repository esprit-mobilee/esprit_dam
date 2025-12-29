import { IsString } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  audience: string;

  @IsString()
  senderId: string;
}
