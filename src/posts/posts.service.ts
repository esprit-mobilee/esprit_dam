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
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { NotificationType } from 'src/notifications/schemas/notification.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,

    @InjectModel(Club.name)
    private readonly clubModel: Model<ClubDocument>,

    @InjectModel(Utilisateur.name)
    private readonly userModel: Model<UtilisateurDocument>,

    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
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
    });

    // 🔔 Notify all club members of new post
    try {
      const clubWithMembers = await this.clubModel
        .findById(clubId)
        .populate('members')
        .exec();

      if (clubWithMembers && clubWithMembers.members) {
        const members = clubWithMembers.members as any[];

        for (const member of members) {
          // Don't notify the author
          if (member._id.toString() === userId) continue;

          const notification = await this.notificationsService.create(
            NotificationType.CLUB_POST_CREATED,
            `Nouvelle publication dans ${club.name}`,
            {
              userId: member._id.toString(),
              clubId: clubId,
              postId: (post._id as any).toString(),
            }
          );

          this.notificationsGateway.sendToUser(
            member._id.toString(),
            notification
          );
        }

        console.log(`📢 Post creation notifications sent to ${members.length - 1} members`);
      }
    } catch (error) {
      console.error('❌ Failed to send post creation notifications:', error);
    }

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

  // Get single post by ID
  async getPostById(postId: string): Promise<Post> {
    const post = await this.postModel
      .findById(postId)
      .populate('authorId', 'firstName lastName email')
      .populate('clubId', 'name imageUrl')
      .populate('comments.userId', 'firstName lastName email')
      .exec();

    if (!post) {
      throw new NotFoundException('Publication introuvable');
    }

    return post;
  }

  // Get all posts (Global Feed) with optional search/pagination
  async getAllPosts(
    options?: { search?: string; page?: number; limit?: number }
  ): Promise<Post[] | { posts: Post[]; total: number; page: number; totalPages: number }> {
    const { search, page, limit } = options || {};

    const query: any = {};

    if (search) {
      query.text = { $regex: search, $options: 'i' };
    }

    // If no pagination requested, return all (backward compatibility)
    if (!page && !limit) {
      return this.postModel
        .find(query)
        .populate('authorId', 'firstName lastName email')
        .populate('clubId', 'name imageUrl')
        .sort({ createdAt: -1 })
        .exec();
    }

    // Pagination defaults
    const pageNum = page || 1;
    const limitNum = limit || 10;

    const total = await this.postModel.countDocuments(query);

    const posts = await this.postModel
      .find(query)
      .populate('authorId', 'firstName lastName email')
      .populate('clubId', 'name imageUrl')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .exec();

    return {
      posts,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  // Get all posts of a club with optional search/pagination
  async getPostsByClub(
    clubId: string,
    options?: { search?: string; page?: number; limit?: number }
  ): Promise<Post[] | { posts: Post[]; total: number; page: number; totalPages: number }> {
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException('Club introuvable');

    const { search, page, limit } = options || {};

    const query: any = { clubId: new Types.ObjectId(clubId) };

    if (search) {
      query.text = { $regex: search, $options: 'i' };
    }

    // If no pagination requested, return all (backward compatibility)
    if (!page && !limit) {
      return this.postModel
        .find(query)
        .populate('authorId', 'firstName lastName email')
        .populate('clubId', 'name imageUrl')
        .sort({ createdAt: -1 })
        .exec();
    }

    // Pagination defaults
    const pageNum = page || 1;
    const limitNum = limit || 10;

    const total = await this.postModel.countDocuments(query);

    const posts = await this.postModel
      .find(query)
      .populate('authorId', 'firstName lastName email')
      .populate('clubId', 'name imageUrl')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .exec();

    return {
      posts,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
  async likePost(postId: string, userId: string): Promise<Post> {
    const post = await this.postModel.findById(postId).populate('authorId');
    if (!post) throw new NotFoundException('Publication introuvable');

    const userObjectId = new Types.ObjectId(userId);

    // Remove from dislikes if present
    const dislikeIndex = post.dislikes.indexOf(userObjectId);
    if (dislikeIndex > -1) {
      post.dislikes.splice(dislikeIndex, 1);
    }

    // Toggle like
    const likeIndex = post.likes.indexOf(userObjectId);
    const wasLiked = likeIndex > -1;

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userObjectId);
    }

    await post.save();

    // 🔔 Notify post author of new like (only if adding like, not removing)
    if (!wasLiked && (post.authorId as any)._id.toString() !== userId) {
      try {
        const liker = await this.userModel.findById(userId);
        if (liker) {
          const notification = await this.notificationsService.create(
            NotificationType.POST_LIKED,
            `${liker.firstName} ${liker.lastName} a aimé votre publication`,
            {
              userId: (post.authorId as any)._id.toString(),
              postId: (post._id as any).toString(),
            }
          );

          this.notificationsGateway.sendToUser(
            (post.authorId as any)._id.toString(),
            notification
          );
        }
      } catch (error) {
        console.error('❌ Failed to send post like notification:', error);
      }
    }

    return post;
  }

  async dislikePost(postId: string, userId: string): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Publication introuvable');

    const userObjectId = new Types.ObjectId(userId);

    // Remove from likes if present
    const likeIndex = post.likes.indexOf(userObjectId);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    }

    // Toggle dislike
    const dislikeIndex = post.dislikes.indexOf(userObjectId);
    if (dislikeIndex > -1) {
      post.dislikes.splice(dislikeIndex, 1);
    } else {
      post.dislikes.push(userObjectId);
    }

    // 🔔 Notify post author of dislike (only if adding dislike)
    const authorId = (post.authorId as any)._id?.toString() || post.authorId.toString();

    if (dislikeIndex === -1 && authorId !== userId) {
      try {
        const user = await this.userModel.findById(userId);
        if (user) {
          const notification = await this.notificationsService.create(
            NotificationType.POST_DISLIKED,
            `${user.firstName} ${user.lastName} a réagi négativement à votre publication`,
            {
              userId: authorId,
              postId: (post._id as any).toString(),
            }
          );

          this.notificationsGateway.sendToUser(
            authorId,
            notification
          );
        }
      } catch (error) {
        console.error('❌ Failed to send post dislike notification:', error);
      }
    }

    await post.save();
    return post;
  }

  async commentPost(postId: string, userId: string, content: string): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Publication introuvable');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    post.comments.push({
      userId: new Types.ObjectId(userId),
      userName: `${user.firstName} ${user.lastName}`,
      userAvatar: user.avatar,
      content,
      createdAt: new Date()
    });

    await post.save();

    // 🔔 Notify post author of new comment
    const authorId = (post.authorId as any)._id?.toString() || post.authorId.toString();

    if (authorId !== userId) {
      try {
        const notification = await this.notificationsService.create(
          NotificationType.POST_COMMENTED,
          `${user.firstName} ${user.lastName} a commenté votre publication`,
          {
            userId: authorId,
            postId: (post._id as any).toString(),
            commentId: (post.comments[post.comments.length - 1] as any)._id.toString(),
          }
        );

        this.notificationsGateway.sendToUser(
          authorId,
          notification
        );
      } catch (error) {
        console.error('❌ Failed to send post comment notification:', error);
      }
    }

    return post;
  }

  // Update a comment
  async updateComment(
    postId: string,
    commentId: string,
    userId: string,
    newContent: string
  ): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Publication introuvable');

    const comment = post.comments.find(c => c._id?.toString() === commentId);
    if (!comment) throw new NotFoundException('Commentaire introuvable');

    // Only the comment author can update it
    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres commentaires');
    }

    comment.content = newContent;
    await post.save();
    return post;
  }

  // Delete a comment
  async deleteComment(
    postId: string,
    commentId: string,
    userId: string
  ): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Publication introuvable');

    const commentIndex = post.comments.findIndex(c => c._id?.toString() === commentId);
    if (commentIndex === -1) throw new NotFoundException('Commentaire introuvable');

    const comment = post.comments[commentIndex];

    // Only the comment author can delete it
    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres commentaires');
    }

    post.comments.splice(commentIndex, 1);
    await post.save();
    return post;
  }

  // React to a comment with an emoji
  async reactToComment(
    postId: string,
    commentId: string,
    userId: string,
    emoji: string
  ): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Publication introuvable');

    const comment = post.comments.find(c => c._id?.toString() === commentId);
    if (!comment) throw new NotFoundException('Commentaire introuvable');

    // Initialize reactions array if it doesn't exist
    if (!comment.reactions) {
      comment.reactions = [];
    }

    const userObjectId = new Types.ObjectId(userId);

    // Check if user already reacted with this emoji
    const existingReactionIndex = comment.reactions.findIndex(
      r => r.userId.toString() === userId && r.emoji === emoji
    );

    const wasReacted = existingReactionIndex > -1;

    if (existingReactionIndex > -1) {
      // Remove reaction (toggle off)
      comment.reactions.splice(existingReactionIndex, 1);
    } else {
      // Remove any other reaction from this user first (one reaction per user)
      const userReactionIndex = comment.reactions.findIndex(
        r => r.userId.toString() === userId
      );
      if (userReactionIndex > -1) {
        comment.reactions.splice(userReactionIndex, 1);
      }

      // Add new reaction
      comment.reactions.push({
        userId: userObjectId,
        emoji
      });
    }

    await post.save();

    // 🔔 Notify comment author of reaction (only if adding, not removing)
    if (!wasReacted && comment.userId.toString() !== userId && emoji === '❤️') {
      try {
        const reactor = await this.userModel.findById(userId);
        if (reactor) {
          const notification = await this.notificationsService.create(
            NotificationType.COMMENT_LIKED,
            `${reactor.firstName} ${reactor.lastName} a aimé votre commentaire`,
            {
              userId: comment.userId.toString(),
              postId: (post._id as any).toString(),
              commentId: commentId,
            }
          );

          this.notificationsGateway.sendToUser(
            comment.userId.toString(),
            notification
          );
        }
      } catch (error) {
        console.error('❌ Failed to send comment reaction notification:', error);
      }
    }

    return post;
  }

  // Reply to a comment
  async replyToComment(
    postId: string,
    commentId: string,
    userId: string,
    content: string
  ): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Publication introuvable');

    const comment = post.comments.find(c => c._id?.toString() === commentId);
    if (!comment) throw new NotFoundException('Commentaire introuvable');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Initialize replies array if it doesn't exist
    if (!comment.replies) {
      comment.replies = [];
    }

    // Add reply to comment
    comment.replies.push({
      userId: new Types.ObjectId(userId),
      userName: `${user.firstName} ${user.lastName}`,
      userAvatar: user.avatar,
      content,
      createdAt: new Date()
    });

    await post.save();

    // 🔔 Notify comment author of reply
    if (comment.userId.toString() !== userId) {
      try {
        const notification = await this.notificationsService.create(
          NotificationType.COMMENT_REPLIED,
          `${user.firstName} ${user.lastName} a répondu à votre commentaire`,
          {
            userId: comment.userId.toString(),
            postId: (post._id as any).toString(),
            commentId: commentId,
          }
        );

        this.notificationsGateway.sendToUser(
          comment.userId.toString(),
          notification
        );
      } catch (error) {
        console.error('❌ Failed to send comment reply notification:', error);
      }
    }

    return post;
  }
}
