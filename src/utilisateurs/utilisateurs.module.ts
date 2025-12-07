import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UtilisateursService } from './utilisateurs.service';
import { UtilisateursController } from './utilisateurs.controller';
import { Utilisateur, UtilisateurSchema } from './schemas/utilisateur.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Utilisateur.name, schema: UtilisateurSchema }])],
  controllers: [UtilisateursController],
  providers: [UtilisateursService],
  exports: [UtilisateursService],
})
export class UtilisateursModule { }
