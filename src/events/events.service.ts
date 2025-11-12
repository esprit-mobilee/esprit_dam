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

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = new this.eventModel(createEventDto);
    return event.save();
  }

  async findAll(): Promise<Event[]> {
    return this.eventModel.find().populate('organizerId', 'firstName lastName email');
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel
      .findById(id)
      .populate('organizerId', 'firstName lastName email');
    if (!event) throw new NotFoundException(`Événement avec id ${id} introuvable`);
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const updated = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .populate('organizerId', 'firstName lastName email');
    if (!updated) throw new NotFoundException(`Événement avec id ${id} introuvable`);
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.eventModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException(`Événement avec id ${id} introuvable`);
    return { message: 'Événement supprimé avec succès' };
  }
}
