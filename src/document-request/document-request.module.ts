import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentRequestService } from './document-request.service';
import { DocumentRequestController } from './document-request.controller';
import { DocumentRequest, DocumentRequestSchema } from './schemas/document-request.schema';
import { DocumentFile, DocumentFileSchema } from './schemas/document-file.schema';
import { Utilisateur, UtilisateurSchema } from 'src/utilisateurs/schemas/utilisateur.schema';
import { AuthModule } from 'src/auth/auth.module';
import { ClubsModule } from 'src/clubs/clubs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentRequest.name, schema: DocumentRequestSchema },
      { name: DocumentFile.name, schema: DocumentFileSchema },
      { name: Utilisateur.name, schema: UtilisateurSchema },
    ]),
    AuthModule, // Importé pour utiliser RolesGuard et AuthenticationGuard
    ClubsModule, // Importé pour que RolesGuard puisse utiliser ClubsService
  ],
  controllers: [DocumentRequestController],
  providers: [DocumentRequestService],
  exports: [DocumentRequestService],
})
export class DocumentRequestModule {}
