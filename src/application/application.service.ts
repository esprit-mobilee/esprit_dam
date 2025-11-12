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

  async create(dto: CreateApplicationDto): Promise<Application> {
    const created = new this.applicationModel(dto);
    return created.save();
  }

  async findAll(): Promise<Application[]> {
    return this.applicationModel.find().populate('userId internshipId').exec();
  }

  async findOne(id: string): Promise<Application> {
    const app = await this.applicationModel.findById(id).populate('userId internshipId').exec();
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async update(id: string, dto: UpdateApplicationDto): Promise<Application> {
    const updated = await this.applicationModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('userId internshipId')
      .exec();
    if (!updated) throw new NotFoundException('Application not found');
    return updated;
  }

  async remove(id: string): Promise<Application> {
    const deleted = await this.applicationModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Application not found');
    return deleted;
  }
}
