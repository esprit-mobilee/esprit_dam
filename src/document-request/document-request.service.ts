import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DocumentRequest, DocumentRequestDocument, DocumentType } from './schemas/document-request.schema';
import { DocumentFile, DocumentFileDocument } from './schemas/document-file.schema';
import { CreateDocumentRequestDto } from './dto/create-document-request.dto';
import { Utilisateur, UtilisateurDocument } from 'src/utilisateurs/schemas/utilisateur.schema';

@Injectable()
export class DocumentRequestService {
  constructor(
    @InjectModel(DocumentRequest.name)
    private readonly documentRequestModel: Model<DocumentRequestDocument>,
    @InjectModel(DocumentFile.name)
    private readonly documentFileModel: Model<DocumentFileDocument>,
    @InjectModel(Utilisateur.name)
    private readonly userModel: Model<UtilisateurDocument>,
  ) { }

  /**
   * 📋 Récupérer les champs de formulaire selon le type de document
   */
  getFormFields(type: string): { fields: any[] } {
    switch (type) {
      case 'attestation':
        return {
          fields: [
            { name: 'annee', type: 'string', label: 'Année académique', required: true },

          ],
        };

      case 'relevé':
        return {
          fields: [
            { name: 'annee', type: 'string', label: 'Année académique', required: true },

          ],
        };

      case 'convention':
        return {
          fields: [
            { name: 'annee', type: 'string', label: 'Année académique', required: true },
            { name: 'entreprise', type: 'string', label: 'Nom de l\'entreprise', required: false },
            { name: 'dateDebut', type: 'date', label: 'Date de début du stage', required: false },
            { name: 'dateFin', type: 'date', label: 'Date de fin du stage', required: false },
          ],
        };

      default:
        throw new BadRequestException(`Type de document ${type} non reconnu`);
    }
  }

  /**
   * 📝 Créer une demande de document et récupérer l'URL du fichier existant
   */
  async create(userId: string, createDto: CreateDocumentRequestDto): Promise<{
    documentRequest: DocumentRequest;
    fileUrl: string | null;
  }> {
    // Vérifier que l'utilisateur existe
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // 1️⃣ Créer la demande de document
    const documentRequest = await this.documentRequestModel.create({
      userId: new Types.ObjectId(userId),
      type: createDto.type,
      annee: createDto.annee,
    });

    // 2️⃣ Chercher le fichier existant dans DocumentFile
    const documentFile = await this.documentFileModel.findOne({
      userId: new Types.ObjectId(userId),
      type: createDto.type,
      annee: createDto.annee,
    });

    // 2️⃣a️⃣ Lier le documentFile à la nouvelle documentRequest
    if (documentFile) {
      documentFile.documentRequestId = documentRequest._id as Types.ObjectId;
      await documentFile.save();
    }


    // 3️⃣ Retourner la demande + l'URL trouvée
    return {
      documentRequest: await this.findOne(String(documentRequest._id)),
      fileUrl: documentFile?.url || null,
    };
  }


  /**
   * 📋 Récupérer toutes les demandes (Admin: toutes, User: les siennes)
   */
  async findAll(userId: string, isAdmin: boolean = false, status?: string): Promise<DocumentRequest[]> {
    const filter: any = {};

    if (!isAdmin) {
      filter.userId = new Types.ObjectId(userId);
    }

    if (status) {
      filter.status = status;
    }

    return this.documentRequestModel
      .find(filter)
      .populate('userId', 'firstName lastName email studentId')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * 🔍 Récupérer une demande par ID
   */
  async findOne(id: string, userId?: string, isAdmin: boolean = false): Promise<DocumentRequest> {
    const request = await this.documentRequestModel
      .findById(id)
      .populate('userId', 'firstName lastName email studentId')
      .exec();

    if (!request) {
      throw new NotFoundException(`Demande de document avec id ${id} introuvable`);
    }

    // Vérifier que l'utilisateur peut accéder à cette demande (sauf si admin)
    if (userId && !isAdmin) {
      const requestUserId = request.userId instanceof Types.ObjectId
        ? String(request.userId)
        : String((request.userId as any)?._id || request.userId);
      if (requestUserId !== userId) {
        throw new BadRequestException('Accès refusé : vous ne pouvez accéder qu\'à vos propres demandes');
      }
    }

    return request;
  }

  /**
   * 📥 Récupérer l'URL du fichier selon l'ID de l'utilisateur
   */
  async getFileUrlByUserId(userId: string): Promise<DocumentFile[]> {
    return this.documentFileModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'firstName lastName email studentId')
      .sort({ createdAt: -1 })
      .exec();
  }
  async findAllWithUserDetails() {
    return this.documentRequestModel
      .find()
      .populate({
        path: 'userId',
        select: 'firstName lastName email studentId inscriptionPaid'  // Ajouter inscriptionPaid
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * 📥 Récupérer l'URL d'un fichier spécifique par son ID
   */
  async getFileUrlById(fileId: string, userId: string, isAdmin: boolean = false): Promise<DocumentFile> {
    const file = await this.documentFileModel
      .findById(fileId)
      .populate('userId', 'firstName lastName email studentId')
      .exec();

    if (!file) {
      throw new NotFoundException(`Fichier avec id ${fileId} introuvable`);
    }

    // Vérifier que l'utilisateur peut accéder à ce fichier (sauf si admin)
    if (!isAdmin) {
      const fileUserId = file.userId instanceof Types.ObjectId
        ? String(file.userId)
        : String((file.userId as any)?._id || file.userId);

      if (fileUserId !== userId) {
        throw new BadRequestException('Accès refusé : vous ne pouvez accéder qu\'à vos propres fichiers');
      }
    }

    return file;
  }

  /**
   * 📥 Récupérer l'URL d'un fichier par l'ID de la demande
   */
  async getFileUrlByRequestId(requestId: string, userId: string, isAdmin: boolean = false): Promise<DocumentFile> {
    // Vérifier que la demande appartient à l'utilisateur (sauf si admin)
    const request = await this.findOne(requestId, userId, isAdmin);

    const file = await this.documentFileModel
      .findOne({ documentRequestId: new Types.ObjectId(requestId) })
      .populate('userId', 'firstName lastName email studentId')
      .exec();

    if (!file) {
      throw new NotFoundException(`Fichier pour la demande ${requestId} introuvable`);
    }

    return file;
  }

  /**
   * ❌ Supprimer une demande et son fichier associé
   */
  async remove(id: string, userId: string, isAdmin: boolean = false): Promise<{ message: string }> {
    const request = await this.findOne(id, userId, isAdmin);

    // Supprimer le fichier associé
    await this.documentFileModel.deleteMany({ documentRequestId: request._id });

    // Supprimer la demande
    await request.deleteOne();

    return { message: 'Demande de document supprimée avec succès' };
  }

  /**
   * 👮‍♂️ Mettre à jour le statut d'une demande (Admin)
   */
  async updateStatus(id: string, status: string, rejectionReason?: string): Promise<DocumentRequest> {
    const request = await this.documentRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException(`Demande ${id} introuvable`);
    }

    request.status = status;
    if (status === 'REJECTED') {
      if (!rejectionReason) {
        throw new BadRequestException('La raison du rejet est obligatoire');
      }
      request.rejectionReason = rejectionReason;
    }

    return request.save();
  }

  /**
   * 📤 Uploader le document final (Admin)
   */
  async uploadAdminFile(id: string, file: Express.Multer.File): Promise<DocumentRequest> {
    const request = await this.documentRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException(`Demande ${id} introuvable`);
    }

    // 1. Sauvegarder le fichier dans DocumentFile
    // On utilise une URL relative ou absolue selon la config. Ici on suppose que le serveur sert les fichiers statiques.
    const fileUrl = `${process.env.API_URL || 'http://localhost:3000'}/api/uploads/documents/${file.filename}`;

    await this.documentFileModel.create({
      userId: request.userId,
      type: request.type,
      annee: request.annee,
      nomFichier: file.originalname,
      url: fileUrl,
      documentRequestId: request._id,
    });

    // 2. Mettre à jour la demande
    request.status = 'APPROVED';
    request.adminFileUrl = fileUrl;

    return request.save();
  }

  /**
   * 📊 Obtenir les statistiques des demandes d'un utilisateur
   */
  async getStats(userId: string): Promise<{
    totalRequests: number;
    totalFiles: number;
    byType: Record<DocumentType, number>;
  }> {
    const totalRequests = await this.documentRequestModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    const totalFiles = await this.documentFileModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    const byType = await this.documentRequestModel.aggregate([
      {
        $match: { userId: new Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const byTypeResult: Record<DocumentType, number> = {
      [DocumentType.ATTESTATION]: 0,
      [DocumentType.RELEVE]: 0,
      [DocumentType.CONVENTION]: 0,
    };

    byType.forEach((item) => {
      byTypeResult[item._id as DocumentType] = item.count;
    });

    return {
      totalRequests,
      totalFiles,
      byType: byTypeResult,
    };
  }


  /**
   * 📥 Récupérer un fichier selon userId, type et année
   */
  async getFileByUserTypeAndYear(
    userId: string,
    type: DocumentType,
    annee: string
  ): Promise<DocumentFile> {
    const file = await this.documentFileModel.findOne({
      userId: new Types.ObjectId(userId),
      type,
      annee
    }).populate('userId', 'firstName lastName email studentId');

    if (!file) {
      throw new NotFoundException(
        `Fichier pour l'utilisateur ${userId}, type ${type}, année ${annee} introuvable`
      );
    }

    return file;
  }


  async findByReference(reference: string): Promise<DocumentRequest | null> {
    return this.documentRequestModel
      .findOne({ documentReference: reference })
      .populate('userId', 'firstName lastName email studentId')
      .exec();
  }
}
