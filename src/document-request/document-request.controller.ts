import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Patch,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/common/multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DocumentRequestService } from './document-request.service';
import { CreateDocumentRequestDto } from './dto/create-document-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
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
  constructor(private readonly documentRequestService: DocumentRequestService) { }

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
  /**
   * 📋 Récupérer toutes les demandes (Admin: toutes, User: les siennes)
   */
  @Get()
  @Roles(Role.Student, Role.Admin)
  @ApiOperation({ summary: 'Récupérer toutes mes demandes de documents' })
  @ApiResponse({ status: 200, description: 'Liste des demandes' })
  findAll(@Request() req: any, @Query('status') status?: string) {
    const isAdmin = req.user.role === Role.Admin;
    return this.documentRequestService.findAll(req.user.userId, isAdmin, status);
  }

  /**
   * 👮‍♂️ Changer le statut d'une demande (Admin)
   */
  @Patch(':id/status')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Changer le statut d\'une demande (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.documentRequestService.updateStatus(id, updateStatusDto.status, updateStatusDto.rejectionReason);
  }

  /**
   * 👮‍♂️ Changer le statut d'une demande (Admin) - Route générique
   */
  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Changer le statut d\'une demande (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  update(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.documentRequestService.updateStatus(id, updateStatusDto.status, updateStatusDto.rejectionReason);
  }

  /**
   * 📤 Uploader le document final (Admin)
   */
  @Post(':id/file')
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file', multerOptions('documents')))
  @ApiOperation({ summary: 'Uploader le document final et approuver la demande (Admin uniquement)' })
  @ApiResponse({ status: 201, description: 'Fichier uploadé et demande approuvée' })
  uploadAdminFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.documentRequestService.uploadAdminFile(id, file);
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
    const isAdmin = req.user.role === Role.Admin;
    return this.documentRequestService.findOne(id, req.user.userId, isAdmin);
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
    const isAdmin = req.user.role === Role.Admin;
    return this.documentRequestService.getFileUrlById(fileId, req.user.userId, isAdmin);
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
    const isAdmin = req.user.role === Role.Admin;
    return this.documentRequestService.getFileUrlByRequestId(requestId, req.user.userId, isAdmin);
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
    const isAdmin = req.user.role === Role.Admin;
    return this.documentRequestService.remove(id, req.user.userId, isAdmin);
  }
}
