import { ApiProperty } from '@nestjs/swagger';

export class UnreadMessageDto {
  @ApiProperty({
    description: 'Sender name',
    example: 'David',
  })
  sender: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Good morning! Just checking in on the project status.',
  })
  message: string;
}
