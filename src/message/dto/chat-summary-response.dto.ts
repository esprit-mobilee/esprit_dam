import { ApiProperty } from '@nestjs/swagger';

export class ChatSummaryResponseDto {
  @ApiProperty()
  summary: string;

  @ApiProperty({ type: [String] })
  key_points: string[];

  @ApiProperty()
  messageCount: number;

  @ApiProperty()
  timestamp: Date;
}
