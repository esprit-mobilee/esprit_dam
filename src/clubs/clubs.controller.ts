import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('Clubs')
@ApiBearerAuth('access-token')
@Controller('clubs')
@UseGuards(AuthenticationGuard, RolesGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  // 👑 Admin — créer un club
  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Créer un nouveau club (Admin uniquement)' })
  @ApiResponse({ status: 201, description: 'Club créé avec succès.' })
  create(@Body() dto: CreateClubDto) {
    return this.clubsService.create(dto);
  }

  // 👑 Admin — assigner un président
  @Put(':clubId/president/:userId')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Assigner un président à un club (Admin)' })
  assignPresident(@Param('clubId') clubId: string, @Param('userId') userId: string) {
    return this.clubsService.assignPresident(clubId, userId);
  }

  // 👑 Admin — update & delete
  @Put(':id')
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() dto: UpdateClubDto) {
    return this.clubsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.clubsService.remove(id);
  }

  // 📚 Tous — liste & détails
  @Get()
  findAll() {
    return this.clubsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

  // 🧑‍💼 Président — gérer les membres
  @Post(':clubId/join/:userId')
  @Roles(Role.President)
  joinClub(@Param('clubId') clubId: string, @Param('userId') userId: string) {
    return this.clubsService.joinClub(clubId, userId);
  }

  @Post(':clubId/leave/:userId')
  @Roles(Role.President)
  leaveClub(@Param('clubId') clubId: string, @Param('userId') userId: string) {
    return this.clubsService.leaveClub(clubId, userId);
  }

  // 👥 Voir les membres
  @Get(':clubId/members')
  getMembers(@Param('clubId') clubId: string) {
    return this.clubsService.getMembers(clubId);
  }

  // 📊 Stats globales
  @Get('admin/stats')
  @Roles(Role.Admin)
  getStats() {
    return this.clubsService.getStats();
  }
}