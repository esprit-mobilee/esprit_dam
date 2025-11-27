import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Announcement, AnnouncementDocument } from './schemas/announcement.schema';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,
  ) {}

  // CREATE
  async create(dto: CreateAnnouncementDto): Promise<Announcement> {
    return this.announcementModel.create(dto);
  }

  // GET ALL
  async findAll(): Promise<Announcement[]> {
    return this.announcementModel.find().sort({ createdAt: -1 }).exec();
  }

  // GET ONE
  async findOne(id: string): Promise<Announcement> {
    const ann = await this.announcementModel.findById(id).exec();
    if (!ann) throw new NotFoundException('Announcement not found');
    return ann;
  }

  // UPDATE
  async update(id: string, dto: CreateAnnouncementDto): Promise<Announcement> {
    const updated = await this.announcementModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Announcement not found');
    return updated;
  }

  // DELETE
  async remove(id: string): Promise<void> {
    await this.announcementModel.findByIdAndDelete(id).exec();
  }
}
