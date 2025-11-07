import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InternshipOfferService } from './internship-offer.service';
import { InternshipOfferController } from './internship-offer.controller';
import { InternshipOffer, InternshipOfferSchema } from './schemas/internship-offer.schema';
import { ClubsModule } from '../clubs/clubs.module'; // ✅ AJOUTE CETTE LIGNE
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: InternshipOffer.name, schema: InternshipOfferSchema }]),
    ClubsModule, // ✅ AJOUTÉ
  ],
  controllers: [InternshipOfferController],
  providers: [InternshipOfferService, RolesGuard],
})
export class InternshipOfferModule {}
