//android
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // CREATE
  @Post()
  create(@Body() dto: CreateMessageDto) {
    return this.messageService.create(dto);
  }

  // GET ALL
  @Get()
  findAll() {
    return this.messageService.findAll();
  }

  // GET ONE
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messageService.findOne(id);
  }

  // UPDATE
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateMessageDto) {
    return this.messageService.update(id, dto);
  }

  // DELETE
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messageService.remove(id);
  }

  // 🔥 LISTE DES CONVERSATIONS POUR UN USER
  @Get('conversations')
  getUserConversations(@Query('userId') userId: string) {
    return this.messageService.getUserConversations(userId);
  }

  // CONVERSATION ENTRE DEUX USERS
  @Get('conversation/:u1/:u2')
  getConversation(@Param('u1') u1: string, @Param('u2') u2: string) {
    return this.messageService.getConversation(u1, u2);
  }
}
// message.controller.ts
// message.controller.ts
///ioos
/*import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('messages')
export class MessageController {
  constructor(private readonly service: MessageService) {}

  @Post(':receiverId')
  sendMessage(
    @Param('receiverId') receiverId: string,
    @Body() body: { content: string; senderId: string },
  ) {
    return this.service.sendMessage(receiverId, body);
  }

  @Get('conversation/:u1/:u2')
  getConversation(
    @Param('u1') u1: string,
    @Param('u2') u2: string,
  ) {
    return this.service.getConversationBetween(u1, u2);
  }

  @Get('conversations/:userId')
  getUserConversations(@Param('userId') userId: string) {
    return this.service.getUserConversations(userId);
  }
}
*/