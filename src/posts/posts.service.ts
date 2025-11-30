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
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,

    @InjectModel(Club.name)
    private readonly clubModel: Model<ClubDocument>,

    @InjectModel(Utilisateur.name)
    private readonly userModel: Model<UtilisateurDocument>,
  ) { }

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
    // President or Club Account check
    const isPresident = user.presidentOf && user.presidentOf.toString() === clubId;
    const isClubAccount = user.role === Role.Club && user.club && user.club.toString() === clubId;

    if (!isPresident && !isClubAccount) {
      throw new ForbiddenException(
        'Vous devez être le président de ce club ou le compte club pour publier.',
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

  private ensureCanManagePost(
    user: any,
    postClubId: string,
  ) {
    const isAdmin = user.role === Role.Admin;
    const managedClubId = user.club ?? user.presidentOf;

    if (isAdmin) {
      return;
    }

    if (!managedClubId || String(managedClubId) !== String(postClubId)) {
      throw new ForbiddenException(
        'Vous ne pouvez gérer que les publications de votre club.',
      );
    }
  }

  async updatePost(
    postId: string,
    text: string | undefined,
    imageUrl: string | undefined,
    user: any,
  ): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Publication introuvable');
    }

    this.ensureCanManagePost(user, String(post.clubId));

    if (text !== undefined) {
      post.text = text;
    }
    if (imageUrl !== undefined) {
      post.imageUrl = imageUrl;
    }

    await post.save();
    return post;
  }

  async deletePost(postId: string, user: any) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Publication introuvable');
    }

    this.ensureCanManagePost(user, String(post.clubId));
    await post.deleteOne();
    return { message: 'Publication supprimée' };
  }

  // Get all posts of a club
  async getPostsByClub(clubId: string): Promise<Post[]> {
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException('Club introuvable');

    return this.postModel
      .find({ clubId: new Types.ObjectId(clubId) })
      .sort({ createdAt: -1 })
      .populate('authorId', 'firstName lastName email')
      .exec();
  }
}
