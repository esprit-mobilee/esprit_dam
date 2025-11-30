import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { AdminClubsController } from './admin-clubs.controller';
import { Club, ClubSchema } from './schemas/club.schema';
import { Utilisateur, UtilisateurSchema } from 'src/utilisateurs/schemas/utilisateur.schema';
import { Event, EventSchema } from 'src/events/schemas/event.schema';
import { Post, PostSchema } from 'src/posts/schemas/post.schema';
import { ClubPortalController } from './club-portal.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Club.name, schema: ClubSchema },
      { name: Utilisateur.name, schema: UtilisateurSchema },
      { name: Event.name, schema: EventSchema },
      { name: Post.name, schema: PostSchema },
    ]),
  ],
  controllers: [ClubsController, AdminClubsController, ClubPortalController],
  providers: [ClubsService],
  exports: [ClubsService], // ✅ exported so EventsModule & AuthModule can use it
})
export class ClubsModule {}
