import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { Club, ClubSchema } from './schemas/club.schema';
import { Utilisateur, UtilisateurSchema } from 'src/utilisateurs/schemas/utilisateur.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Club.name, schema: ClubSchema },
      { name: Utilisateur.name, schema: UtilisateurSchema },
    ]),
  ],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [ClubsService], // ✅ exported so EventsModule & AuthModule can use it
})
export class ClubsModule {}
