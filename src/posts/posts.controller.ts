import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/common/multer.config';
import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { IsPresidentGuard } from 'src/auth/guards/is-president.guard';

@Controller('posts')
@UseGuards(AuthenticationGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

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

    const imageUrl = file ? `/uploads/posts/${file.filename}` : undefined;

    return this.postsService.createPost(
      clubId,
      user.userId,
      dto.text,
      imageUrl,
    );
  }

  // PUBLIC: get posts of a club
  @Get('club/:clubId')
  async getClubPosts(@Param('clubId') clubId: string) {
    return this.postsService.getPostsByClub(clubId);
  }
}
