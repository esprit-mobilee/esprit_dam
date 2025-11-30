import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { Application, ApplicationSchema } from './schemas/application.schema';
import { EmailService } from './email.service';
import { Utilisateur, UtilisateurSchema } from '../utilisateurs/schemas/utilisateur.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Utilisateur.name, schema: UtilisateurSchema },
    ])
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, EmailService],
})
export class ApplicationModule {}