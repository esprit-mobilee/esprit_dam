
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

@ApiTags('Events')
@ApiBearerAuth('access-token')
@Controller('events')
@UseGuards(AuthenticationGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // 🧑‍💼 Admin or President can create events
  @Post()
  @Roles(Role.Admin, Role.President)
  @ApiOperation({ summary: 'Créer un nouvel événement (Admin/Président)' })
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  // 📋 Tous — liste
  @Get()
  @ApiOperation({ summary: 'Lister tous les événements' })
  findAll() {
    return this.eventsService.findAll();
  }

  // 📋 Tous — détail
  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un événement par ID' })
  @ApiParam({ name: 'id', description: 'ID de l’événement' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  // 👑 Admin — update
  @Put(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Mettre à jour un événement (Admin uniquement)' })
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  // 👑 Admin — delete
  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Supprimer un événement (Admin uniquement)' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
