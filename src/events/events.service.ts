import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException('startDate et endDate sont requis');
    }

    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException(
        'endDate doit etre posterieure a startDate',
      );
    }

    const imageUrl = file ? `/uploads/events/${file.filename}` : null;

    const event = new this.eventModel({
      title: dto.title,
      description: dto.description ?? '',
      startDate: dto.startDate,
      endDate: dto.endDate,
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
      .exec();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel
      .findById(id)
      .exec();

    if (!event) {
      throw new NotFoundException(`�%vǸnement avec id ${id} introuvable`);
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
      throw new NotFoundException('�%vǸnement introuvable');
    }

    const nextStartDate =
      dto.startDate !== undefined ? new Date(dto.startDate) : event.startDate;
    const nextEndDate =
      dto.endDate !== undefined ? new Date(dto.endDate) : event.endDate;

    if (nextEndDate < nextStartDate) {
      throw new BadRequestException(
        'endDate doit etre posterieure a startDate',
      );
    }

    if (dto.title !== undefined) event.title = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.startDate !== undefined) event.startDate = dto.startDate as any;
    if (dto.endDate !== undefined) event.endDate = dto.endDate as any;
    if (dto.location !== undefined) event.location = dto.location;
    // Ne pas laisser modifier l'organizerId
    if (dto.category !== undefined) event.category = dto.category;
    if (file) event.imageUrl = `/uploads/events/${file.filename}`;

    await event.save();
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.eventModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException(`�%vǸnement avec id ${id} introuvable`);
    }
    return { message: '�%vǸnement supprimǸ avec succ��s' };
  }
}
