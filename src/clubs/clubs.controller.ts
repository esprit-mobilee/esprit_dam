import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/common/multer.config';

@ApiTags('Clubs')
@ApiBearerAuth('access-token')
@Controller('clubs')
@UseGuards(AuthenticationGuard, RolesGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Créer un nouveau club' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions('clubs')))
  create(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateClubDto) {
    return this.clubsService.create(dto, file);
  }

  @Put(':id')
  @Roles(Role.Admin)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions('clubs')))
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateClubDto,
  ) {
    return this.clubsService.update(id, dto, file);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.clubsService.remove(id);
  }

  @Get()
  findAll() {
    return this.clubsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

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

  @Get(':clubId/members')
  getMembers(@Param('clubId') clubId: string) {
    return this.clubsService.getMembers(clubId);
  }

  @Get('admin/stats')
  @Roles(Role.Admin)
  getStats() {
    return this.clubsService.getStats();
  }
}
