import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async create(
    dto: CreateEventDto,
    file?: Express.Multer.File,
  ): Promise<Event> {
    const imageUrl = file ? `/uploads/events/${file.filename}` : null;

    const event = new this.eventModel({
      title: dto.title,
      description: dto.description ?? '',
      date: dto.date,
      location: dto.location ?? '',
      organizerId: dto.organizerId,
      category: dto.category ?? '',
      imageUrl,
    });

    return event.save();
  }

  async findAll(): Promise<Event[]> {
    return this.eventModel
      .find()
      .populate('organizerId', 'firstName lastName email')
      .exec();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel
      .findById(id)
      .populate('organizerId', 'firstName lastName email')
      .exec();

    if (!event) {
      throw new NotFoundException(`Événement avec id ${id} introuvable`);
    }
    return event;
  }

  async update(
    id: string,
    dto: UpdateEventDto,
    file?: Express.Multer.File,
  ): Promise<Event> {
    const event = await this.eventModel.findById(id);
    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (dto.title !== undefined) event.title = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.date !== undefined) event.date = dto.date as any;
    if (dto.location !== undefined) event.location = dto.location;
    if (dto.organizerId !== undefined) event.organizerId = dto.organizerId as any;
    if (dto.category !== undefined) event.category = dto.category;
    if (file) event.imageUrl = `/uploads/events/${file.filename}`;

    await event.save();
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.eventModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException(`Événement avec id ${id} introuvable`);
    }
    return { message: 'Événement supprimé avec succès' };
  }
}
