import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/schemas/notification.schema';

import { EmailService } from 'src/email/email.service';
import { CalendarService } from 'src/calendar/calendar.service';

import { Club, ClubDocument } from 'src/clubs/schemas/club.schema';
import { Utilisateur, UtilisateurDocument } from 'src/utilisateurs/schemas/utilisateur.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(Club.name)
    private readonly clubModel: Model<ClubDocument>,
    @InjectModel(Utilisateur.name)
    private readonly userModel: Model<UtilisateurDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly calendarService: CalendarService,
  ) { }

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

    const imageUrl = file ? `/api/uploads/events/${file.filename}` : null;

    // Parse tags from comma-separated string
    const tags = dto.tags ? dto.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    // Parse formQuestions from JSON string if needed, or assume array. 
    // Since this is likely multipart/form-data, it might come as a stringified JSON.
    let formQuestions: string[] = [];
    if (dto.formQuestions) {
      if (typeof dto.formQuestions === 'string') {
        try {
          formQuestions = JSON.parse(dto.formQuestions);
        } catch (e) {
          // If not JSON, maybe comma separated? Or just single string?
          // Let's assume frontend sends JSON string for array
          formQuestions = [dto.formQuestions];
        }
      } else if (Array.isArray(dto.formQuestions)) {
        formQuestions = dto.formQuestions;
      }
    }

    // Build location object if coordinates are provided
    let location: { address?: string; latitude?: number; longitude?: number } | undefined = undefined;
    if (dto.location || dto.latitude !== undefined || dto.longitude !== undefined) {
      location = {
        address: dto.location,
        latitude: dto.latitude,
        longitude: dto.longitude,
      };
    }

    const event = new this.eventModel({
      title: dto.title,
      description: dto.description ?? '',
      startDate: startDate,
      endDate: endDate,
      location,
      organizerId: dto.organizerId,
      category: dto.category ?? '',
      tags,
      formQuestions,
      imageUrl,
    });

    return event.save();
  }

  async findAll(options?: {
    search?: string;
    sortBy?: 'date' | 'title' | 'category';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<Event[] | { events: Event[]; total: number; page: number; totalPages: number }> {
    const { search, sortBy = 'date', order = 'desc', page, limit, category } = options || {};

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    // Build sort
    const sortField = sortBy === 'date' ? 'startDate' : sortBy;
    const sortOrder = order === 'asc' ? 1 : -1;

    // If no pagination params, return simple array (backward compatibility)
    if (!page && !limit) {
      return this.eventModel
        .find(query)
        .sort({ [sortField]: sortOrder })
        .exec();
    }

    // With pagination
    const pageNum = page || 1;
    const limitNum = limit || 10;

    const total = await this.eventModel.countDocuments(query);

    const events = await this.eventModel
      .find(query)
      .sort({ [sortField]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .exec();

    return {
      events,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel
      .findById(id)
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

    // Update location object if any location field is provided
    if (dto.location !== undefined || dto.latitude !== undefined || dto.longitude !== undefined) {
      event.location = {
        address: dto.location ?? event.location?.address,
        latitude: dto.latitude ?? event.location?.latitude,
        longitude: dto.longitude ?? event.location?.longitude,
      };
    }

    // Ne pas laisser modifier l'organizerId
    if (dto.category !== undefined) event.category = dto.category;
    if (dto.tags !== undefined) {
      const tags = dto.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      event.tags = tags;
    }
    if (file) event.imageUrl = `/api/uploads/events/${file.filename}`;

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

    const participantName = dto.fullName ?? user?.name ?? 'Participant';

    event.registrations.push({
      userId: userObjectId,
      name: participantName,
      identifiant: dto.studentId ?? user?.identifiant ?? undefined,
      email: dto.email,
      message: dto.message,
      answers: dto.answers ?? [],
      status: 'pending',
      createdAt: new Date(),
    });

    await event.save();

    // Create notification for event organizer (club)
    if (event.organizerId && userObjectId) {
      try {
        // Resolve organizerId (identifiant) to a Club
        // 1. Find the User who created the event
        const organizerUser = await this.userModel.findOne({ identifiant: event.organizerId });

        if (organizerUser) {
          // 2. Find the Club associated with this user
          // Either the user IS the club account, or the user is the President
          const club = await this.clubModel.findOne({
            $or: [
              { account: organizerUser._id },
              { president: organizerUser._id }
            ]
          });

          if (club) {
            await this.notificationsService.create(
              String(club._id),
              NotificationType.EVENT_REGISTRATION,
              String(userObjectId),
              `${participantName} s'est inscrit à l'événement "${event.title}"`,
            );
          } else {
            console.warn(`Club not found for organizer ${event.organizerId}`);
          }
        } else {
          console.warn(`Organizer user not found: ${event.organizerId}`);
        }
      } catch (e) {
        console.error('Failed to send notification for event registration:', e);
        // Do not fail the registration if notification fails
      }
    }

    return { message: 'Inscription enregistrée', registrationCount: event.registrations.length };
  }

  async getRegistrations(eventId: string) {
    const event = await this.eventModel.findById(eventId);
    if (!event) throw new NotFoundException('Event not found');
    return event.registrations;
  }

  async approveRegistration(eventId: string, userId: string) {
    const event = await this.eventModel.findById(eventId);
    if (!event) throw new NotFoundException('Event not found');

    const registration = event.registrations.find(
      (r) => r.userId && r.userId.toString() === userId
    );

    if (!registration) throw new NotFoundException('Registration not found');

    registration.status = 'accepted';
    // Mongoose subdocument array change detection sometimes needs this
    event.markModified('registrations');
    await event.save();

    // Send calendar invitation email with .ics file after approval
    if (registration.email) {
      try {
        await this.calendarService.sendEventInvitation(
          registration.email,
          registration.name,
          {
            title: event.title,
            description: event.description || 'Événement ESPRIT',
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
            location: event.location?.address,
            organizerName: 'ESPRIT Club',
            organizerEmail: 'messaoudmay6@gmail.com',
          }
        );
        console.log(`📧 Calendar invitation sent to ${registration.email} after approval`);
      } catch (emailError) {
        console.error('Failed to send calendar invitation:', emailError);
        // Don't fail approval if email fails
      }
    }

    return { message: 'Registration accepted', status: 'accepted' };
  }

  async rejectRegistration(eventId: string, userId: string) {
    const event = await this.eventModel.findById(eventId);
    if (!event) throw new NotFoundException('Event not found');

    const registration = event.registrations.find(
      (r) => r.userId && r.userId.toString() === userId
    );

    if (!registration) throw new NotFoundException('Registration not found');

    registration.status = 'rejected';
    event.markModified('registrations');
    await event.save();

    if (registration.email) {
      this.emailService.sendEventRejectionEmail(
        registration.email,
        registration.name,
        event.title
      );
    }

    return { message: 'Registration rejected', status: 'rejected' };
  }
}
