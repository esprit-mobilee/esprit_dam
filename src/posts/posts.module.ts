import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post, PostSchema } from './schemas/post.schema';
import { Club, ClubSchema } from 'src/clubs/schemas/club.schema';
import { Utilisateur, UtilisateurSchema } from 'src/utilisateurs/schemas/utilisateur.schema';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Club.name, schema: ClubSchema },
      { name: Utilisateur.name, schema: UtilisateurSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule { }
