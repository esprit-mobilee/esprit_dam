import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JoinEventDto } from './dto/join-event.dto';

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

    // Parse date strings to Date objects (multipart form sends strings)
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Validate dates are valid
    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('startDate invalide. Format attendu: ISO 8601 (ex: 2025-12-10T09:00:00Z)');
    }

    if (isNaN(endDate.getTime())) {
      throw new BadRequestException('endDate invalide. Format attendu: ISO 8601 (ex: 2025-12-10T09:00:00Z)');
    }

    if (endDate < startDate) {
      throw new BadRequestException(
        'endDate doit etre posterieure a startDate',
      );
    }

    if (!dto.organizerId) {
      throw new BadRequestException('organizerId est requis');
    }

    const imageUrl = file ? `/uploads/events/${file.filename}` : null;

    const event = new this.eventModel({
      title: dto.title,
      description: dto.description ?? '',
      startDate: startDate,
      endDate: endDate,
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

    // Parse date strings to Date objects if provided
    let nextStartDate = event.startDate;
    let nextEndDate = event.endDate;

    if (dto.startDate !== undefined) {
      nextStartDate = new Date(dto.startDate);
      if (isNaN(nextStartDate.getTime())) {
        throw new BadRequestException('startDate invalide. Format attendu: ISO 8601 (ex: 2025-12-10T09:00:00Z)');
      }
    }

    if (dto.endDate !== undefined) {
      nextEndDate = new Date(dto.endDate);
      if (isNaN(nextEndDate.getTime())) {
        throw new BadRequestException('endDate invalide. Format attendu: ISO 8601 (ex: 2025-12-10T09:00:00Z)');
      }
    }

    if (nextEndDate < nextStartDate) {
      throw new BadRequestException(
        'endDate doit etre posterieure a startDate',
      );
    }

    if (dto.title !== undefined) event.title = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.startDate !== undefined) event.startDate = nextStartDate;
    if (dto.endDate !== undefined) event.endDate = nextEndDate;
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

  async toggleRegistration(id: string): Promise<Event> {
    const event = await this.eventModel.findById(id);
    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    event.registrationOpen = !event.registrationOpen;
    await event.save();
    return event;
  }

  async joinEvent(
    id: string,
    dto: JoinEventDto,
    user?: {
      userId?: string;
      identifiant?: string;
      name?: string;
    },
  ) {
    const event = await this.eventModel.findById(id);
    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    if (!event.registrationOpen) {
      throw new BadRequestException(
        "Les inscriptions pour cet événement sont fermées",
      );
    }

    const userObjectId =
      user?.userId && Types.ObjectId.isValid(user.userId)
        ? new Types.ObjectId(user.userId)
        : null;

    const alreadyRegistered = event.registrations.some((registration) => {
      if (userObjectId && registration.userId) {
        return registration.userId.toString() === userObjectId.toString();
      }
      if (dto.email && registration.email) {
        return registration.email === dto.email;
      }
      if (dto.studentId && registration.identifiant) {
        return registration.identifiant === dto.studentId;
      }
      return false;
    });

    if (alreadyRegistered) {
      throw new BadRequestException('Vous êtes déjà inscrit à cet événement');
    }

    event.registrations.push({
      userId: userObjectId,
      name: dto.fullName ?? user?.name ?? 'Participant',
      identifiant: dto.studentId ?? user?.identifiant ?? undefined,
      email: dto.email,
      message: dto.message,
      createdAt: new Date(),
    });

    await event.save();
    return { message: 'Inscription enregistrée', registrationCount: event.registrations.length };
  }
}
