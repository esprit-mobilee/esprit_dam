import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import axios from 'axios';
import { OpenRouterClientService } from './services/openrouter-client.service';

// ===========================
// Interface réponse Python
// ===========================
interface PythonSummaryResponse {
  summary: string;
  key_points: string[];
}

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    private readonly openRouterClient: OpenRouterClientService,
  ) {}

  // ------------------------------------------------------------
  // CREATE
  // ------------------------------------------------------------
  async create(dto: CreateMessageDto): Promise<Message> {
    const msg = new this.messageModel(dto);
    return msg.save();
  }

  // ------------------------------------------------------------
  // GET ALL
  // ------------------------------------------------------------
  async findAll(): Promise<Message[]> {
    return this.messageModel.find().sort({ createdAt: -1 });
  }

  // ------------------------------------------------------------
  // GET ONE
  // ------------------------------------------------------------
  async findOne(id: string): Promise<Message> {
    const msg = await this.messageModel.findById(id);
    if (!msg) throw new NotFoundException('Message not found');
    return msg;
  }

  // ------------------------------------------------------------
  // UPDATE
  // ------------------------------------------------------------
  async update(id: string, dto: CreateMessageDto): Promise<Message> {
    const updated = await this.messageModel.findByIdAndUpdate(id, dto, {
      new: true,
    });

    if (!updated) throw new NotFoundException('Message not found');
    return updated;
  }

  // ------------------------------------------------------------
  // DELETE
  // ------------------------------------------------------------
  async remove(id: string): Promise<void> {
    await this.messageModel.findByIdAndDelete(id);
  }

  // ------------------------------------------------------------
  // GET USER CONVERSATIONS
  // ------------------------------------------------------------
  async getUserConversations(userId: string) {
    console.log('🔥 [SERVICE] getUserConversations() called with:', userId);

    const messages = await this.messageModel
      .find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      })
      .sort({ createdAt: -1 })
      .populate({
        path: 'senderId',
        select: 'nom prenom firstName lastName role',
      })
      .populate({
        path: 'receiverId',
        select: 'nom prenom firstName lastName role',
      })
      .lean();

    const grouped: Record<string, any> = {};

    for (const msg of messages) {
      const sender: any =
        msg.senderId && typeof msg.senderId === 'object' ? msg.senderId : null;
      const receiver: any =
        msg.receiverId && typeof msg.receiverId === 'object'
          ? msg.receiverId
          : null;

      const other =
        sender && sender._id?.toString() === userId ? receiver : sender;

      if (!other || !other._id) continue;

      const otherId = other._id.toString();

      const fullName =
        `${other.firstName ?? ''} ${other.lastName ?? ''}`.trim() ||
        'Utilisateur';

      if (!grouped[otherId]) {
        grouped[otherId] = {
          userId: otherId,
          fullName,
          role: other.role ?? null,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
        };
      }
    }

    return Object.values(grouped).sort(
      (a, b) =>
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime(),
    );
  }

  // ------------------------------------------------------------
  // GET CONVERSATION
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // GET UNREAD MESSAGES
  // ------------------------------------------------------------
  async getUnreadMessages(userId: string, otherUserId: string) {
    const messages = await this.messageModel
      .find({
        senderId: new Types.ObjectId(otherUserId),
        receiverId: new Types.ObjectId(userId),
        isRead: false,
      })
      .populate({
        path: 'senderId',
        select: 'firstName lastName nom prenom',
      })
      .sort({ createdAt: 1 })
      .lean();

    return messages.map((msg: any) => {
      const sender: any = msg.senderId;
      const senderName =
        sender && typeof sender === 'object'
          ? `${sender.firstName ||
              sender.prenom ||
              ''} ${sender.lastName ||
              sender.nom ||
              ''}`.trim()
          : 'Unknown';

      return {
        sender: senderName,
        message: msg.content,
      };
    });
  }

  // ------------------------------------------------------------
  // MARK AS READ
  // ------------------------------------------------------------
  async markMessagesAsRead(
    userId: string,
    otherUserId: string,
  ): Promise<void> {
    await this.messageModel.updateMany(
      {
        senderId: new Types.ObjectId(otherUserId),
        receiverId: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );
  }

  // ------------------------------------------------------------
  // SUMMARIZE ALL MESSAGES — ANDROID VERSION
  // ------------------------------------------------------------
  async summarizeAllMessages(receiverId: string, senderId: string) {
  const messages = await this.messageModel
    .find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
    .sort({ createdAt: 1 })
    .lean();

  if (!messages.length) {
    throw new NotFoundException('No messages to summarize');
  }

  // -------------------------------
  // 1️⃣ Format messages for Python
  // -------------------------------
  const formatted = messages.map((msg: any) => ({
    sender: msg.senderId.toString() === senderId ? 'Sender' : 'Receiver',
    message: msg.content,
  }));

  // -------------------------------
  // 2️⃣ Call Python API
  // -------------------------------
  try {
    const pythonRes = await axios.post(
      'http://localhost:7860/api/summarize',
      { messages: formatted },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      },
    );

    const result = pythonRes.data as PythonSummaryResponse;

    // -------------------------------
    // 3️⃣ Validate response
    // -------------------------------
    if (!result.summary || !result.key_points) {
      throw new Error('Invalid response from Python summarizer');
    }

    return {
      summary: result.summary,
      key_points: result.key_points,
      messageCount: messages.length,
      timestamp: new Date(),
    };

  } catch (err: any) {
    const errorText = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;

    throw new HttpException(
      'Python summarizer error: ' + errorText,
      HttpStatus.BAD_GATEWAY,
    );
  }
}
async reactToMessage(
  messageId: string,
  userId: string,
  emoji: string
) {
  const message = await this.messageModel.findById(messageId);
  if (!message) throw new Error('Message not found');

  // supprimer ancienne réaction du même user
  message.reactions = message.reactions.filter(
    r => r.userId.toString() !== userId
  );

  // ajouter nouvelle réaction
message.reactions.push({
  userId: new Types.ObjectId(userId),
  emoji,
});


  await message.save();
  return message;
}
async editMessage(
  messageId: string,
  userId: string,
  newContent: string
) {
  const message = await this.messageModel.findById(messageId);

  if (!message) {
    throw new NotFoundException('Message not found');
  }

  if (message.senderId.toString() !== userId) {
    throw new ForbiddenException('Not your message');
  }

  message.content = newContent;
  message.updatedAt = new Date();

  await message.save();
  return message;
}


}
