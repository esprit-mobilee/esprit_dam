import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';
import { IsOptional } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Nouvelle affiche / nouvelle image de l’événement',
  })
  @IsOptional()
  image?: any;
}
