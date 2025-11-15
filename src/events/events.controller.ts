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
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/common/multer.config';

@ApiTags('Events')
@ApiBearerAuth('access-token')
@Controller('events')
@UseGuards(AuthenticationGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(Role.Admin, Role.President)
  @ApiOperation({ summary: 'Créer un nouvel événement (Admin/Président)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions('events')))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateEventDto,
    @Req() req: any,
  ) {
    // Optionnel : on pourrait forcer dto.organizerId = req.user._id ici
    return this.eventsService.create(dto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les événements' })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un événement par ID' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.President)
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
    const userId: string = user.userId || user._id?.toString();

    // 🔐 Admin : accès complet
    if (user.role !== Role.Admin) {
      // Ici, on est forcément Président (grâce à @Roles)
      const event = await this.eventsService.findOne(id);

      // organizerId peut être un ObjectId ou un objet peuplé
      const organizerId =
        (event.organizerId as any)?._id?.toString() ??
        (event.organizerId as any)?.toString();

      if (!organizerId || organizerId !== userId) {
        throw new ForbiddenException(
          'Vous ne pouvez modifier que les événements de votre club.',
        );
      }
    }

    return this.eventsService.update(id, dto, file);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.President)
  @ApiOperation({ summary: 'Supprimer un événement (Admin/Président)' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userId: string = user.userId || user._id?.toString();

    // 🔐 Admin : accès complet
    if (user.role !== Role.Admin) {
      const event = await this.eventsService.findOne(id);

      const organizerId =
        (event.organizerId as any)?._id?.toString() ??
        (event.organizerId as any)?.toString();

      if (!organizerId || organizerId !== userId) {
        throw new ForbiddenException(
          'Vous ne pouvez supprimer que les événements de votre club.',
        );
      }
    }

    return this.eventsService.remove(id);
  }
}
