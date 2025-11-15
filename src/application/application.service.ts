// src/application/application.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument } from './schemas/application.schema';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,
  ) {}

  // ---------- CREATE ----------
  // On sauvegarde puis on populate('internshipId') pour que
  // Android reçoive toujours un OBJET pour internshipId.
  async create(dto: CreateApplicationDto): Promise<Application> {
    const created = new this.applicationModel(dto);
    const saved = await created.save();
    return saved.populate('internshipId');
  }

  async findAll(): Promise<Application[]> {
    return this.applicationModel.find().populate('internshipId').exec();
  }

  /** ------- PAR ID MONGODB ------- */

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

  /** ---------- PAR IDENTIFIANT (matricule stocké dans userId) ---------- */

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
