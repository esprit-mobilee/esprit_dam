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
  constructor(private readonly clubsService: ClubsService) { }

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
  findAll(@Req() req: any) {
    return this.clubsService.findAll(req.user?.userId);
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
  // STUDENT → Join club (if enabled)
  // --------------------------------------------------------------------
  @Post(':clubId/join-request')
  async requestJoinClub(
    @Param('clubId') clubId: string,
    @Body() body: { answers?: Array<{ question: string; answer: string }> },
    @Req() req: any,
  ) {
    return this.clubsService.studentJoinClub(clubId, req.user.userId, body.answers);
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
  // PRESIDENT OR ADMIN → Update club settings (join form questions)
  // --------------------------------------------------------------------
  @Put(':id/settings')
  @UseGuards(IsPresidentGuard)
  async updateSettings(
    @Param('id') id: string,
    @Body() body: { joinEnabled?: boolean; joinFormQuestions?: string[] },
    @Req() req: any,
  ) {
    const user = req.user;

    // Admin can manage any club
    if (user.role === Role.Admin) {
      return this.clubsService.updateSettings(id, body);
    }

    // Student-president can manage ONLY his club
    const managedClubId = user.club ?? user.presidentOf;
    if (String(managedClubId) !== id) {
      throw new ForbiddenException(
        'Vous ne pouvez gérer que votre propre club.',
      );
    }

    return this.clubsService.updateSettings(id, body);
  }

  // --------------------------------------------------------------------
  // STUDENT → Check join request status for a club
  // --------------------------------------------------------------------
  @Get(':clubId/join-request-status')
  async checkJoinRequestStatus(
    @Param('clubId') clubId: string,
    @Req() req: any,
  ) {
    return this.clubsService.checkJoinRequestStatus(clubId, req.user.userId);
  }

  // --------------------------------------------------------------------
  // PRESIDENT OR ADMIN → Get pending join requests
  // --------------------------------------------------------------------
  @Get(':clubId/join-requests/pending')
  @UseGuards(IsPresidentGuard)
  async getPendingRequests(
    @Param('clubId') clubId: string,
    @Req() req: any,
  ) {
    const user = req.user;

    // Admin can view any club's requests
    if (user.role === Role.Admin) {
      return this.clubsService.getPendingRequests(clubId);
    }

    // Student-president can view ONLY his club's requests
    const managedClubId = user.club ?? user.presidentOf;
    if (String(managedClubId) !== clubId) {
      throw new ForbiddenException(
        'Vous ne pouvez voir que les demandes de votre propre club.',
      );
    }

    return this.clubsService.getPendingRequests(clubId);
  }

  // --------------------------------------------------------------------
  // PRESIDENT OR ADMIN → Approve join request
  // --------------------------------------------------------------------
  @Post('join-requests/:requestId/approve')
  @UseGuards(IsPresidentGuard)
  async approveJoinRequest(
    @Param('requestId') requestId: string,
  ) {
    return this.clubsService.approveJoinRequest(requestId);
  }

  // --------------------------------------------------------------------
  // PRESIDENT OR ADMIN → Reject join request
  // --------------------------------------------------------------------
  @Post('join-requests/:requestId/reject')
  @UseGuards(IsPresidentGuard)
  async rejectJoinRequest(
    @Param('requestId') requestId: string,
  ) {
    return this.clubsService.rejectJoinRequest(requestId);
  }

  // --------------------------------------------------------------------
  // PRESIDENT OR ADMIN → Toggle join enabled
  // --------------------------------------------------------------------
  @Post(':id/toggle-join')
  @UseGuards(IsPresidentGuard)
  async toggleJoinEnabled(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const user = req.user;

    // Admin can manage any club
    if (user.role === Role.Admin) {
      return this.clubsService.toggleJoinEnabled(id);
    }

    // Student-president can manage ONLY his club
    const managedClubId = user.club ?? user.presidentOf;
    if (String(managedClubId) !== id) {
      throw new ForbiddenException(
        'Vous ne pouvez gérer que votre propre club.',
      );
    }

    return this.clubsService.toggleJoinEnabled(id);
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
