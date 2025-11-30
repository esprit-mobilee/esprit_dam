import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { UpdateClubDto } from './dto/update-club.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';

import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

import { IsPresidentGuard } from 'src/auth/guards/is-president.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/common/multer.config';

@ApiTags('Clubs')
@ApiBearerAuth('access-token')
@Controller('clubs')
@UseGuards(AuthenticationGuard, RolesGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  // --------------------------------------------------------------------
  // ADMIN or STUDENT-PRESIDENT → Update club
  // --------------------------------------------------------------------
  @Put(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profileImage', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
      ],
      multerOptions('clubs'),
    ),
  )
  async update(
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      profileImage?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    },
    @Body() dto: UpdateClubDto,
    @Req() req: any,
  ) {
    const user = req.user;
    const profileImage = files?.profileImage?.[0];
    const coverImage = files?.coverImage?.[0];

    // Admin has global rights
    if (user.role === Role.Admin) {
      return this.clubsService.update(id, dto, profileImage, coverImage);
    }

    // Student-president → must match the club he presides
    if (user.role === Role.Student) {
      if (!user.presidentOf || String(user.presidentOf) !== id) {
        throw new ForbiddenException(
          'Vous ne pouvez modifier que votre propre club.',
        );
      }
      return this.clubsService.update(id, dto, profileImage, coverImage);
    }

    throw new ForbiddenException('Action non autorisée.');
  }

  // --------------------------------------------------------------------
  // ADMIN ONLY → Delete club
  // --------------------------------------------------------------------
  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.clubsService.remove(id);
  }

  // --------------------------------------------------------------------
  // PUBLIC → Get all clubs
  // --------------------------------------------------------------------
  @Get()
  findAll() {
    return this.clubsService.findAll();
  }

  // --------------------------------------------------------------------
  // PUBLIC → Get single club
  // --------------------------------------------------------------------
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

  // --------------------------------------------------------------------
  // PRESIDENT OR ADMIN → Add member
  // --------------------------------------------------------------------
  @Post(':clubId/join/:userId')
  @UseGuards(IsPresidentGuard)   // Ensures user.presidentOf exists
  async joinClub(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    const user = req.user;

    // Admin can manage any club
    if (user.role === Role.Admin) {
      return this.clubsService.joinClub(clubId, userId);
    }

    // Student-president can manage ONLY his club
    if (String(user.presidentOf) !== clubId) {
      throw new ForbiddenException(
        'Vous ne pouvez gérer que les membres de votre propre club.',
      );
    }

    return this.clubsService.joinClub(clubId, userId);
  }

  // --------------------------------------------------------------------
  // PRESIDENT OR ADMIN → Remove member
  // --------------------------------------------------------------------
  @Post(':clubId/leave/:userId')
  @UseGuards(IsPresidentGuard)
  async leaveClub(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    const user = req.user;

    // Admin allowed anywhere
    if (user.role === Role.Admin) {
      return this.clubsService.leaveClub(clubId, userId);
    }

    // Student-president restriction
    if (String(user.presidentOf) !== clubId) {
      throw new ForbiddenException(
        'Vous ne pouvez gérer que les membres de votre propre club.',
      );
    }

    return this.clubsService.leaveClub(clubId, userId);
  }

  // --------------------------------------------------------------------
  // PUBLIC → Get club members
  // --------------------------------------------------------------------
  @Get(':clubId/members')
  getMembers(@Param('clubId') clubId: string) {
    return this.clubsService.getMembers(clubId);
  }

  // --------------------------------------------------------------------
  // ADMIN ONLY → Statistics
  // --------------------------------------------------------------------
  @Get('admin/stats')
  @Roles(Role.Admin)
  getStats() {
    return this.clubsService.getStats();
  }
}
