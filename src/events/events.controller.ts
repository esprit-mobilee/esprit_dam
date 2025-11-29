import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JoinEventDto } from './dto/join-event.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/common/multer.config';
import { IsPresidentGuard } from 'src/auth/guards/is-president.guard';
import { Role } from 'src/auth/enums/role.enum';

@ApiTags('Events')
@ApiBearerAuth('access-token')
@Controller('events')
@UseGuards(AuthenticationGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ---------------------------------------------------------
  // ADMIN or PRESIDENT → create event
  // PRESIDENT checked by IsPresidentGuard
  // ---------------------------------------------------------
  @Post()
  @UseGuards(IsPresidentGuard) // allow presidents too
  @ApiOperation({ summary: 'Créer un nouvel événement (Admin/Président)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions('events')))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateEventDto,
    @Req() req: any,
  ) {
    // organizerId is ALWAYS owner
    dto.organizerId = req.user?.identifiant || req.user?.userId;
    
    // Log for debugging
    console.log('Received event data:', {
      title: dto.title,
      startDate: dto.startDate,
      endDate: dto.endDate,
      location: dto.location,
      description: dto.description,
      category: dto.category,
      organizerId: dto.organizerId,
    });
    
    return this.eventsService.create(dto, file);
  }

  // ---------------------------------------------------------
  // PUBLIC : list all events
  // ---------------------------------------------------------
  @Get()
  @ApiOperation({ summary: 'Lister tous les événements' })
  findAll() {
    return this.eventsService.findAll();
  }

  // ---------------------------------------------------------
  // PUBLIC : get event by ID
  // ---------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un événement par ID' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  // ---------------------------------------------------------
  // ADMIN or PRESIDENT → update event
  // PRESIDENT checked by IsPresidentGuard + ownership check
  // ---------------------------------------------------------
  @Put(':id')
  @UseGuards(IsPresidentGuard)
  @ApiOperation({ summary: 'Mettre à jour un événement (Admin/Président)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions('events')))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateEventDto,
    @Req() req: any,
  ) {
    const user = req.user;

    // Admin → always allowed
    if (user.role !== Role.Admin) {
      const event = await this.eventsService.findOne(id);
      const organizerId = (event.organizerId as any).toString();

      const userIdent = user.identifiant;
      const fallbackId = user.userId || user._id?.toString();

      const isOwner =
        organizerId === userIdent || organizerId === fallbackId;

      if (!isOwner) {
        throw new ForbiddenException(
          'Vous ne pouvez modifier que les événements de votre club.',
        );
      }
    }

    dto.organizerId = undefined;
    return this.eventsService.update(id, dto, file);
  }

  // ---------------------------------------------------------
  // ADMIN or PRESIDENT → delete event
  // PRESIDENT checked by IsPresidentGuard + ownership check
  // ---------------------------------------------------------
  @Delete(':id')
  @UseGuards(IsPresidentGuard)
  @ApiOperation({ summary: 'Supprimer un événement (Admin/Président)' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;

    if (user.role !== Role.Admin) {
      const event = await this.eventsService.findOne(id);
      const organizerId = (event.organizerId as any).toString();

      const userIdent = user.identifiant;
      const fallbackId = user.userId || user._id?.toString();

      const isOwner =
        organizerId === userIdent || organizerId === fallbackId;

      if (!isOwner) {
        throw new ForbiddenException(
          'Vous ne pouvez supprimer que les événements de votre club.',
        );
      }
    }

    return this.eventsService.remove(id);
  }

  // ---------------------------------------------------------
  // ADMIN or PRESIDENT → toggle registrations
  // ---------------------------------------------------------
  @Post(':id/toggle-registration')
  @UseGuards(IsPresidentGuard)
  @ApiOperation({ summary: 'Activer/désactiver les inscriptions' })
  toggleRegistration(@Param('id') id: string) {
    return this.eventsService.toggleRegistration(id);
  }

  // ---------------------------------------------------------
  // STUDENT → join event (registration form)
  // ---------------------------------------------------------
  @Post(':id/join')
  @ApiOperation({ summary: "Soumettre une inscription à l'événement" })
  async joinEvent(
    @Param('id') id: string,
    @Body() dto: JoinEventDto,
    @Req() req: any,
  ) {
    return this.eventsService.joinEvent(id, dto, req.user);
  }
}
