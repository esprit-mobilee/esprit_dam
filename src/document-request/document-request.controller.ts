import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DocumentRequestService } from './document-request.service';
import { CreateDocumentRequestDto } from './dto/create-document-request.dto';
import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

@ApiTags('Document Requests')
@ApiBearerAuth('access-token')
@Controller('document-request')
//
@UseGuards(AuthenticationGuard, RolesGuard)
export class DocumentRequestController {
  constructor(private readonly documentRequestService: DocumentRequestService) {}

  /**
   * 📋 Récupérer les champs de formulaire selon le type de document
   */
  @Get('form-fields/:type')
 @Roles(Role.Student, Role.Admin)
  @ApiOperation({ summary: 'Récupérer les champs de formulaire selon le type de document' })
  @ApiParam({ name: 'type', enum: ['attestation', 'relevé', 'convention'], description: 'Type de document' })
  @ApiResponse({ status: 200, description: 'Champs de formulaire pour le type spécifié' })
  getFormFields(@Param('type') type: string) {
    return this.documentRequestService.getFormFields(type);
  }

  /**
   * 📝 Créer une demande de document et récupérer l'URL du fichier existant
   */
  @Post()
  @Roles(Role.Student, Role.Admin)
  @ApiOperation({ 
    summary: 'Créer une demande de document et récupérer l\'URL du fichier existant selon type et année' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Demande créée avec succès. Retourne la demande et l\'URL du fichier (null si non trouvé)' 
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  create(@Request() req: any, @Body() createDto: CreateDocumentRequestDto) {
    return this.documentRequestService.create(req.user.userId, createDto);
  }

  /**
   * 📋 Récupérer toutes les demandes de l'utilisateur
   */
  @Get()
  @Roles(Role.Student, Role.Admin)
  @ApiOperation({ summary: 'Récupérer toutes mes demandes de documents' })
  @ApiResponse({ status: 200, description: 'Liste des demandes' })
  findAll(@Request() req: any) {
    return this.documentRequestService.findAll(req.user.userId);
  }

  /**
   * 🔍 Récupérer une demande par ID
   */
  @Get('request/:id')
  @Roles(Role.Student, Role.Admin)
  @ApiOperation({ summary: 'Récupérer une demande par ID' })
  @ApiParam({ name: 'id', description: 'ID de la demande' })
  @ApiResponse({ status: 200, description: 'Détails de la demande' })
  @ApiResponse({ status: 404, description: 'Demande introuvable' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.documentRequestService.findOne(id, req.user.userId);
  }

  /**
   * 📥 Récupérer toutes les URLs de fichiers de l'utilisateur
   */
  @Get('files')
  @Roles(Role.Student, Role.Admin)
  @ApiOperation({ summary: 'Récupérer toutes les URLs de mes fichiers' })
  @ApiResponse({ status: 200, description: 'Liste des fichiers avec URLs' })
  getFileUrls(@Request() req: any) {
    return this.documentRequestService.getFileUrlByUserId(req.user.userId);
  } 

  /**
   * 📥 Récupérer l'URL d'un fichier par son ID
   */
  @Get('files/:fileId')
  @Roles(Role.Student, Role.Admin)
  @ApiOperation({ summary: 'Récupérer l\'URL d\'un fichier par son ID' })
  @ApiParam({ name: 'fileId', description: 'ID du fichier' })
  @ApiResponse({ status: 200, description: 'Informations du fichier avec URL' })
  @ApiResponse({ status: 404, description: 'Fichier introuvable' })
  getFileUrlById(@Request() req: any, @Param('fileId') fileId: string) {
    return this.documentRequestService.getFileUrlById(fileId, req.user.userId);
  }

  /**
   * 📥 Récupérer l'URL d'un fichier par l'ID de la demande
   */
  @Get('request/:requestId/file')
  @Roles(Role.Student, Role.Admin)
  @ApiOperation({ summary: 'Récupérer l\'URL d\'un fichier par l\'ID de la demande' })
  @ApiParam({ name: 'requestId', description: 'ID de la demande' })
  @ApiResponse({ status: 200, description: 'Informations du fichier avec URL' })
  @ApiResponse({ status: 404, description: 'Fichier introuvable' })
  getFileUrlByRequestId(@Request() req: any, @Param('requestId') requestId: string) {
    return this.documentRequestService.getFileUrlByRequestId(requestId, req.user.userId);
  }

  /**
   * 📊 Obtenir les statistiques des demandes
   */
  @Get('stats')
  @Roles(Role.Student, Role.Admin)
  @ApiOperation({ summary: 'Obtenir les statistiques de mes demandes' })
  @ApiResponse({ status: 200, description: 'Statistiques des demandes' })
  getStats(@Request() req: any) {
    return this.documentRequestService.getStats(req.user.userId);
  }

  /**
   * ❌ Supprimer une demande et son fichier associé
   */
  @Delete(':id')
  @Roles(Role.Student, Role.Admin)
  @ApiOperation({ summary: 'Supprimer une demande et son fichier associé' })
  @ApiParam({ name: 'id', description: 'ID de la demande' })
  @ApiResponse({ status: 200, description: 'Demande supprimée' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.documentRequestService.remove(id, req.user.userId);
  }
}
