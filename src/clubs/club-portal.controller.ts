import {
  Controller,
  Get,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { ClubsService } from './clubs.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from 'src/events/schemas/event.schema';
import { Post, PostDocument } from 'src/posts/schemas/post.schema';

@ApiTags('Club Portal')
@ApiBearerAuth('access-token')
@Controller('club')
@UseGuards(AuthenticationGuard, RolesGuard)
@Roles(Role.Club, Role.Student)
export class ClubPortalController {
  constructor(
    private readonly clubsService: ClubsService,
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
  ) {}

  @Get('home')
  @ApiOperation({ summary: 'Retourne les informations du club connecté' })
  async getHome(@Req() req: any) {
    const user = req.user;
    const targetClubId = user.club ?? user.presidentOf;
    if (!targetClubId) {
      throw new NotFoundException(
        'Aucun club n’est associé à ce compte.',
      );
    }

    const club = await this.clubsService.findOne(String(targetClubId));

    const totalEvents = await this.eventModel.countDocuments({
      organizerId: user.identifiant,
    });

    const latestPost = await this.postModel
      .findOne({ clubId: club._id })
      .sort({ createdAt: -1 })
      .lean();

    return {
      id: String(club._id),
      name: club.name,
      description: club.description ?? '',
      imageUrl: club.imageUrl ?? null,
      coverImageUrl: club.coverImageUrl ?? null,
      totalEvents,
      totalMembers: club.members?.length ?? 0,
      latestPost: latestPost
        ? {
            id: String(latestPost._id),
            content: latestPost.text,
            imageUrl: latestPost.imageUrl ?? null,
            createdAt: latestPost.createdAt,
          }
        : null,
    };
  }
}

