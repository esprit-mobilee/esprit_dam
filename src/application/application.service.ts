// src/application/application.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument } from './schemas/application.schema';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { EmailService } from './email.service';
import { Utilisateur, UtilisateurDocument } from '../utilisateurs/schemas/utilisateur.schema';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,
    @InjectModel(Utilisateur.name)
    private readonly userModel: Model<UtilisateurDocument>,
    private readonly emailService: EmailService,
  ) {}

  // ---------- CREATE ----------
  async create(dto: CreateApplicationDto): Promise<Application> {
    const created = new this.applicationModel(dto);
    const saved = await created.save();
    return saved.populate('internshipId');
  }

  async findAll(): Promise<Application[]> {
    return this.applicationModel.find().populate('internshipId').exec();
  }

 async updateApplicationStatus(id: string, status: string) {
  const application = await this.applicationModel
    .findById(id)
    .populate('internshipId')
    .exec();

  if (!application) {
    throw new NotFoundException('Application not found');
  }

  application.status = status;
  await application.save();

  const user = await this.userModel.findById(application.userId).exec();
  
  if (!user) {
    console.warn(`User not found for userId: ${application.userId}`);
    return application;
  }

  const internship = application.internshipId as any;
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Étudiant';

  console.log('📧 Tentative d\'envoi d\'email à:', user.email); // ← LOG AJOUTÉ
  console.log('👤 Nom:', fullName); // ← LOG AJOUTÉ
  console.log('💼 Stage:', internship.title); // ← LOG AJOUTÉ

  try {
    if (status === 'accepted') {
      await this.emailService.sendAcceptanceEmail(user.email, fullName, internship.title);
      console.log('✅ Email d\'acceptation envoyé avec succès'); // ← LOG AJOUTÉ
    } else if (status === 'rejected') {
      await this.emailService.sendRejectionEmail(user.email, fullName, internship.title);
      console.log('✅ Email de rejet envoyé avec succès'); // ← LOG AJOUTÉ
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error); // ← LOG AJOUTÉ
  }

  return application;
}

  async findOne(id: string): Promise<Application> {
    const app = await this.applicationModel
      .findById(id)
      .populate('internshipId')
      .exec();
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async update(id: string, dto: UpdateApplicationDto): Promise<Application> {
    const updated = await this.applicationModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('internshipId')
      .exec();

    if (!updated) throw new NotFoundException('Application not found');
    return updated;
  }

  async remove(id: string): Promise<Application> {
    const deleted = await this.applicationModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Application not found');
    return deleted;
  }

  async findByIdentifiant(identifiant: string): Promise<Application[]> {
    return this.applicationModel
      .find({ userId: identifiant })
      .populate('internshipId')
      .exec();
  }

  async updateByIdentifiant(
    identifiant: string,
    dto: UpdateApplicationDto,
  ): Promise<Application> {
    const updated = await this.applicationModel
      .findOneAndUpdate({ userId: identifiant }, dto, { new: true })
      .populate('internshipId')
      .exec();

    if (!updated) {
      throw new NotFoundException('No application found for this identifiant');
    }
    return updated;
  }

  async removeByIdentifiant(identifiant: string): Promise<Application[]> {
    const apps = await this.applicationModel.find({ userId: identifiant }).exec();

    if (!apps.length) {
      throw new NotFoundException('No applications found for this identifiant');
    }

    await this.applicationModel.deleteMany({ userId: identifiant }).exec();

    return apps;
  }
}