// src/application/application.controller.ts
import {
  Controller, Get, Post, Body, Param, Delete, Patch,
  UploadedFile, UseInterceptors
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { CalendarService } from '../calendar/calendar.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { Application } from './schemas/application.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { extname } from 'path';

@ApiTags('Applications')
@Controller('applications')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly calendarService: CalendarService,
  ) { }

  // ---------- CREATE (JSON : lien ou URI) ----------
  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle candidature (CV lien ou URI de fichier)',
  })
  create(@Body() dto: CreateApplicationDto): Promise<Application> {
    return this.applicationService.create(dto);
  }

  // ---------- UPLOAD PDF + CREATE APPLICATION ----------
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('cv', {
      storage: diskStorage({
        destination: './uploads/cv',
        filename: (req, file, cb) => {
          const uniqueName = uuid() + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadCvAndCreate(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    if (!file) {
      return { error: 'No file uploaded' };
    }

    const fileUrl = `/uploads/cv/${file.filename}`;

    // Construire un vrai DTO pour créer la candidature
    const createDto: CreateApplicationDto = {
      userId: body.userId,
      internshipId: body.internshipId,
      cvUrl: fileUrl,
      coverLetter: body.coverLetter ?? '',
    };

    // Création dans MongoDB
    const created = await this.applicationService.create(createDto);

    return created;
  }

  // ---------- READ / UPDATE / DELETE standards (par _id MongoDB) ----------
  @Get()
  @ApiOperation({ summary: 'Afficher toutes les candidatures' })
  findAll(): Promise<Application[]> {
    return this.applicationService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Afficher une candidature spécifique (par _id MongoDB)',
  })
  findOne(@Param('id') id: string): Promise<Application> {
    return this.applicationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour une candidature (status, score, etc.)',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ): Promise<Application> {
    // ← MODIFICATION ICI : Si le statut change, utiliser updateApplicationStatus
    if (dto.status && (dto.status === 'accepted' || dto.status === 'rejected')) {
      return this.applicationService.updateApplicationStatus(id, dto.status);
    }
    // Sinon, utiliser la méthode update normale
    return this.applicationService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une candidature (par _id MongoDB)' })
  remove(@Param('id') id: string): Promise<Application> {
    return this.applicationService.remove(id);
  }

  // ---------- ENDPOINTS PAR IDENTIFIANT ÉTUDIANT ----------
  @Get('by-identifiant/:identifiant')
  @ApiOperation({
    summary: "Afficher toutes les candidatures d'un étudiant via son identifiant",
  })
  findByIdentifiant(
    @Param('identifiant') identifiant: string,
  ): Promise<Application[]> {
    return this.applicationService.findByIdentifiant(identifiant);
  }

  @Patch('by-identifiant/:identifiant')
  @ApiOperation({
    summary: "Mettre à jour une candidature via l'identifiant étudiant",
  })
  updateByIdentifiant(
    @Param('identifiant') identifiant: string,
    @Body() dto: UpdateApplicationDto,
  ): Promise<Application> {
    return this.applicationService.updateByIdentifiant(identifiant, dto);
  }

  @Delete('by-identifiant/:identifiant')
  @ApiOperation({
    summary: 'Supprimer toutes les candidatures liées à un identifiant étudiant',
  })
  removeByIdentifiant(
    @Param('identifiant') identifiant: string,
  ): Promise<Application[]> {
    return this.applicationService.removeByIdentifiant(identifiant);
  }

  // ---------- INTERVIEW SCHEDULING ENDPOINTS ----------
  @Post(':id/schedule-interview')
  @ApiOperation({ summary: 'Planifier un entretien avec Google Calendar' })
  async scheduleInterview(
    @Param('id') id: string,
    @Body() dto: ScheduleInterviewDto,
  ): Promise<Application> {
    // Récupérer l'application
    const application = await this.applicationService.findOne(id);

    // Créer l'événement Google Calendar
    const { eventId, meetingLink } = await this.calendarService.scheduleInterview(
      dto.studentEmail,
      dto.studentEmail.split('@')[0], // Nom temporaire extrait de l'email
      new Date(dto.scheduledAt),
      dto.duration,
      dto.notes,
    );

    // Mettre à jour l'application avec les infos de l'entretien
    const updated = await this.applicationService.update(id, {
      interview: {
        scheduledAt: new Date(dto.scheduledAt),
        googleEventId: eventId,
        meetingLink: meetingLink,
        notes: dto.notes,
        status: 'scheduled',
      },
    });

    return updated;
  }

  @Delete(':id/cancel-interview')
  @ApiOperation({ summary: 'Annuler un entretien planifié' })
  async cancelInterview(@Param('id') id: string): Promise<Application> {
    // Récupérer l'application
    const application = await this.applicationService.findOne(id);

    if (application.interview?.googleEventId) {
      // Annuler l'événement Google Calendar
      await this.calendarService.cancelInterview(application.interview.googleEventId);
    }

    // Mettre à jour l'application
    const updated = await this.applicationService.update(id, {
      interview: {
        ...application.interview,
        status: 'cancelled',
      },
    });

    return updated;
  }

  @Get(':id/interview')
  @ApiOperation({ summary: 'Récupérer les détails de l\'entretien' })
  async getInterview(@Param('id') id: string): Promise<any> {
    const application = await this.applicationService.findOne(id);
    return application.interview || null;
  }
}
