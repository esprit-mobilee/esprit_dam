//android
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
  ) {}

  // CREATE MESSAGE
  async create(dto: CreateMessageDto): Promise<Message> {
    const msg = new this.messageModel(dto);
    return msg.save();
  }

  // GET ALL
  async findAll(): Promise<Message[]> {
    return this.messageModel.find().sort({ createdAt: -1 });
  }

  // GET ONE
  async findOne(id: string): Promise<Message> {
    const msg = await this.messageModel.findById(id);
    if (!msg) throw new NotFoundException('Message not found');
    return msg;
  }

  // UPDATE
  async update(id: string, dto: CreateMessageDto): Promise<Message> {
    const updated = await this.messageModel.findByIdAndUpdate(id, dto, {
      new: true,
    });

    if (!updated) throw new NotFoundException('Message not found');
    return updated;
  }

  // DELETE
  async remove(id: string): Promise<void> {
    await this.messageModel.findByIdAndDelete(id);
  }

  // 🔥 GET LISTE DES CONVERSATIONS POUR UN USER
  async getUserConversations(userId: string) {
    const messages = await this.messageModel
      .find({
        $or: [
          { senderId: userId },
          { receiverId: userId },
        ],
      })
      .sort({ createdAt: -1 });

    const grouped = {};

    messages.forEach(msg => {
      const other =
        msg.senderId.toString() === userId
          ? msg.receiverId.toString()
          : msg.senderId.toString();

      if (!grouped[other]) {
        grouped[other] = msg; // dernier message
      }
    });

    return Object.keys(grouped).map(otherId => ({
      userId: otherId,
      lastMessage: grouped[otherId].content,
      lastMessageTime: grouped[otherId].createdAt,
    }));
  }

  // GET CONVERSATION ENTRE DEUX USERS
  async getConversation(user1: string, user2: string): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
      })
      .sort({ createdAt: 1 });
  }
}
// message.service.ts
// message.service.ts
//ioooos
/*import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './schemas/message.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
  ) {}

  // ENVOI MESSAGE
  async sendMessage(receiverId: string, body: { content: string, senderId: string }) {
    return await this.messageModel.create({
      senderId: new Types.ObjectId(body.senderId),
      receiverId: new Types.ObjectId(receiverId),
      content: body.content,
      type: 'text',
    });
  }

  // LIRE CONVERSATION ENTRE 2 USERS
  async getConversationBetween(user1: string, user2: string) {
    return this.messageModel.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ createdAt: 1 });
  }

  // LISTE DES CONVERSATIONS POUR LE USER
  async getUserConversations(userId: string) {
    const msgs = await this.messageModel
      .find({
        $or: [
          { senderId: userId },
          { receiverId: userId },
        ]
      })
      .sort({ createdAt: -1 });

    const convs = new Map();

    for (const msg of msgs) {
      const otherId =
        msg.senderId.toString() === userId
          ? msg.receiverId.toString()
          : msg.senderId.toString();

      if (!convs.has(otherId)) {
        convs.set(otherId, {
          userId: otherId,
          userName: "Utilisateur",  // Tu pourras améliorer plus tard
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
        });
      }
    }

    return Array.from(convs.values());
  }
}
*/