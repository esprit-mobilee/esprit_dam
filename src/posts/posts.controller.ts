import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/common/multer.config';
import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { IsPresidentGuard } from 'src/auth/guards/is-president.guard';
import { Role } from 'src/auth/enums/role.enum';

@Controller('posts')
@UseGuards(AuthenticationGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  // PRESIDENT: create post
  @Post(':clubId')
  @UseGuards(IsPresidentGuard)
  @UseInterceptors(FileInterceptor('image', multerOptions('posts')))
  async create(
    @Param('clubId') clubId: string,
    @Body() dto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const user = req.user;
    const managedClubId = user.club ?? user.presidentOf;
    const isAdmin = user.role === Role.Admin;

    if (!isAdmin && (!managedClubId || String(managedClubId) !== clubId)) {
      throw new ForbiddenException(
        'Vous ne pouvez publier que dans votre propre club.',
      );
    }

    const imageUrl = file ? `/uploads/posts/${file.filename}` : undefined;

    return this.postsService.createPost(
      clubId,
      user.userId,
      dto.text,
      imageUrl,
    );
  }

  // PUBLIC: get all posts (Global Feed)
  @Get()
  async getAllPosts(@Req() req: any) {
    const { search, page, limit } = req.query;
    return this.postsService.getAllPosts({
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // PUBLIC: get posts of a club with optional search/pagination
  @Get('club/:clubId')
  async getClubPosts(
    @Param('clubId') clubId: string,
    @Req() req: any,
  ) {
    const { search, page, limit } = req.query;
    return this.postsService.getPostsByClub(clubId, {
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // PUBLIC: get single post by ID
  @Get('detail/:id')
  async getPostById(@Param('id') id: string) {
    return this.postsService.getPostById(id);
  }

  // COMPATIBILITY: alias for getClubPosts to support iOS app using /api/posts/:clubId
  @Get(':clubId')
  async getClubPostsAlias(
    @Param('clubId') clubId: string,
    @Req() req: any,
  ) {
    const { search, page, limit } = req.query;
    return this.postsService.getPostsByClub(clubId, {
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // PRESIDENT/CLUB: update post
  @Put(':postId')
  @UseGuards(IsPresidentGuard)
  @UseInterceptors(FileInterceptor('image', multerOptions('posts')))
  async update(
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const imageUrl = file ? `/uploads/posts/${file.filename}` : undefined;

    return this.postsService.updatePost(
      postId,
      dto.text,
      imageUrl,
      req.user,
    );
  }

  // PRESIDENT/CLUB: delete post
  @Delete(':postId')
  @UseGuards(IsPresidentGuard)
  async remove(@Param('postId') postId: string, @Req() req: any) {
    return this.postsService.deletePost(postId, req.user);
  }
  // PUBLIC: like post
  @Post(':postId/like')
  async like(@Param('postId') postId: string, @Req() req: any) {
    return this.postsService.likePost(postId, req.user.userId);
  }

  // PUBLIC: dislike post
  @Post(':postId/dislike')
  async dislike(@Param('postId') postId: string, @Req() req: any) {
    return this.postsService.dislikePost(postId, req.user.userId);
  }

  // PUBLIC: comment post
  @Post(':postId/comment')
  async comment(
    @Param('postId') postId: string,
    @Body('content') content: string,
    @Req() req: any,
  ) {
    return this.postsService.commentPost(postId, req.user.userId, content);
  }

  // PUBLIC: update own comment
  @Put(':postId/comments/:commentId')
  async updateComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body('content') content: string,
    @Req() req: any,
  ) {
    return this.postsService.updateComment(
      postId,
      commentId,
      req.user.userId,
      content
    );
  }

  // PUBLIC: delete own comment
  @Delete(':postId/comments/:commentId')
  async deleteComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    return this.postsService.deleteComment(
      postId,
      commentId,
      req.user.userId
    );
  }

  // PUBLIC: react to comment with emoji
  @Post(':postId/comments/:commentId/react')
  async reactToComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body('emoji') emoji: string,
    @Req() req: any,
  ) {
    return this.postsService.reactToComment(
      postId,
      commentId,
      req.user.userId,
      emoji
    );
  }

  // PUBLIC: reply to a comment
  @Post(':postId/comments/:commentId/reply')
  async replyToComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body('content') content: string,
    @Req() req: any,
  ) {
    return this.postsService.replyToComment(
      postId,
      commentId,
      req.user.userId,
      content
    );
  }
}
