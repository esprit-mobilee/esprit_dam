import { PartialType } from '@nestjs/swagger';
import { CreateInternshipOfferDto } from './create-internship-offer.dto';

export class UpdateInternshipOfferDto extends PartialType(CreateInternshipOfferDto) {}
