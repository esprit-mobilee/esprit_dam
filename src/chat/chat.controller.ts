import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    UseInterceptors,
    UploadedFile,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('history/:clubId')
    async getHistory(
        @Param('clubId') clubId: string,
        @Query('limit') limit: number,
        @Query('before') before: string,
    ) {
        return this.chatService.getMessages(clubId, limit || 50, before);
    }

    @Get('conversations/:userId')
    async getConversations(@Param('userId') userId: string) {
        return this.chatService.getMyConversations(userId);
    }

    @Get('private/:userId/:partnerId')
    async getPrivateHistory(
        @Param('userId') userId: string,
        @Param('partnerId') partnerId: string,
        @Query('limit') limit: number,
        @Query('before') before: string,
    ) {
        return this.chatService.getPrivateMessages(userId, partnerId, limit || 50, before);
    }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/chat',
                filename: (req, file, cb) => {
                    const randomName = uuidv4();
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (Voice/Image/GIF)
        }),
    )
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        // Return path that matches static file serving at /api/uploads
        return { url: `/uploads/chat/${file.filename}` };
    }
}
