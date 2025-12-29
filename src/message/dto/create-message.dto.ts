import { IsString, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  readonly senderId: string;

  @IsString()
  readonly receiverId: string;

  @IsString()
  readonly content: string;

  @IsOptional()
  @IsString()
  readonly type?: string;
}
