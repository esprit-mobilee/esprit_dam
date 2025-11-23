import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Club, ClubDocument } from 'src/clubs/schemas/club.schema';
import { Utilisateur, UtilisateurDocument } from 'src/utilisateurs/schemas/utilisateur.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,

    @InjectModel(Club.name)
    private readonly clubModel: Model<ClubDocument>,

    @InjectModel(Utilisateur.name)
    private readonly userModel: Model<UtilisateurDocument>,
  ) {}

  // Create a post — ONLY PRESIDENT
  async createPost(
    clubId: string,
    userId: string,
    text: string,
    imageUrl?: string,
  ): Promise<Post> {
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException('Club introuvable');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // President check
    if (!user.presidentOf || user.presidentOf.toString() !== clubId) {
      throw new ForbiddenException(
        'Vous devez être le président de ce club pour publier.',
      );
    }

    const post = await this.postModel.create({
      clubId: new Types.ObjectId(clubId),
      text,
      imageUrl,
      authorId: user._id,
      likes: 0,
    });

    return post;
  }

  // Get all posts of a club
  async getPostsByClub(clubId: string): Promise<Post[]> {
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException('Club introuvable');

    return this.postModel
      .find({ clubId })
      .sort({ createdAt: -1 })
      .populate('authorId', 'firstName lastName email')
      .exec();
  }
}
