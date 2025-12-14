import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { translate } from 'google-translate-api-x';
import Filter = require('bad-words');
import { tunisianBadWords } from './profanity/tunisian-bad-words';

@Injectable()
export class ChatService {
    private filter: Filter;

    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    ) {
        this.filter = new Filter();
        this.filter.addWords(...tunisianBadWords);
    }

    async createMessage(data: {
        clubId?: string;
        senderId: string;
        content: string;
        type?: string;
        attachmentUrl?: string;
        replyTo?: string;
        recipientId?: string;
    }) {
        const cleanContent = data.type === 'TEXT' ? this.filter.clean(data.content) : data.content;

        const message = new this.messageModel({
            clubId: data.clubId ? new Types.ObjectId(data.clubId) : null,
            senderId: new Types.ObjectId(data.senderId),
            recipientId: data.recipientId ? new Types.ObjectId(data.recipientId) : null,
            content: cleanContent,
            type: data.type || 'TEXT',
            attachmentUrl: data.attachmentUrl,
            replyTo: data.replyTo ? new Types.ObjectId(data.replyTo) : null,
        });
        return (await message.save()).populate([
            { path: 'senderId', select: 'firstName lastName imageUrl isOnline lastSeen' }, // Added presence fields
            { path: 'replyTo', select: 'content senderId type' }
        ]);
    }

    async getMessages(clubId: string, limit: number = 50, before?: string) {
        const query: any = { clubId: new Types.ObjectId(clubId), isDeleted: false };
        if (before) {
            query._id = { $lt: new Types.ObjectId(before) };
        }
        return this.messageModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('senderId', 'firstName lastName imageUrl')
            .populate('replyTo')
            .exec();
    }

    async addReaction(messageId: string, userId: string, emoji: string) {
        const msg = await this.messageModel.findById(messageId);
        if (!msg) return null;

        // Remove existing reaction by this user if any
        msg.reactions = msg.reactions.filter(
            (r) => r.userId.toString() !== userId,
        );
        // Add new reaction
        msg.reactions.push({ userId: new Types.ObjectId(userId), emoji });
        return (await msg.save()).populate('senderId', 'firstName lastName imageUrl isOnline lastSeen');
    }

    async getPrivateMessages(userId: string, partnerId: string, limit: number = 50, before?: string) {
        const uid = new Types.ObjectId(userId);
        const pid = new Types.ObjectId(partnerId);

        const query: any = {
            $or: [
                { senderId: uid, recipientId: pid },
                { senderId: pid, recipientId: uid }
            ],
            isDeleted: false
        };

        if (before) {
            query._id = { $lt: new Types.ObjectId(before) };
        }

        return this.messageModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('senderId', 'firstName lastName imageUrl isOnline lastSeen')
            .populate('replyTo')
            .exec();
    }

    async getMyConversations(userId: string) {
        const uid = new Types.ObjectId(userId);
        return await this.messageModel.aggregate([
            {
                $match: {
                    $or: [{ senderId: uid }, { recipientId: uid }],
                    recipientId: { $ne: null }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ["$senderId", uid] },
                            then: "$recipientId",
                            else: "$senderId"
                        }
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "utilisateurs",
                    localField: "_id",
                    foreignField: "_id",
                    as: "partner"
                }
            },
            {
                $unwind: "$partner"
            },
            {
                $project: {
                    partner: {
                        _id: "$partner._id",
                        firstName: "$partner.firstName",
                        lastName: "$partner.lastName",
                        imageUrl: "$partner.avatar",
                        isOnline: "$partner.isOnline",
                        lastSeen: "$partner.lastSeen"
                    },
                    lastMessage: {
                        content: "$lastMessage.content",
                        createdAt: "$lastMessage.createdAt",
                        type: "$lastMessage.type",
                        senderId: "$lastMessage.senderId",
                        readBy: "$lastMessage.readBy"
                    }
                }
            },
            { $sort: { "lastMessage.createdAt": -1 } }
        ]);
    }

    async markAsRead(messageId: string, userId: string) {
        return this.messageModel.findByIdAndUpdate(
            messageId,
            {
                $addToSet: {
                    readBy: { userId: new Types.ObjectId(userId), readAt: new Date() },
                },
            },
            { new: true },
        ).populate('senderId', 'firstName lastName imageUrl');
    }

    async editMessage(messageId: string, userId: string, content: string) {
        const msg = await this.messageModel.findOne({ _id: messageId, senderId: new Types.ObjectId(userId) });
        if (!msg || msg.isDeleted) return null;

        msg.content = this.filter.clean(content);
        msg.isEdited = true;
        return (await msg.save()).populate('senderId', 'firstName lastName imageUrl');
    }

    async deleteMessage(messageId: string, userId: string) {
        const msg = await this.messageModel.findOne({ _id: messageId, senderId: new Types.ObjectId(userId) });
        if (!msg) return null;

        msg.isDeleted = true;
        // Optionally keep content for audit, but flag as deleted
        return (await msg.save()).populate('senderId', 'firstName lastName imageUrl');
    }

    async translateMessage(messageId: string, targetLang: string) {
        const message = await this.messageModel.findById(messageId);
        if (!message) return null;

        try {
            const res = await translate(message.content, { to: targetLang });
            return {
                original: message.content,
                translated: res.text,
                lang: targetLang
            };
        } catch (error) {
            console.error('Translation error:', error);
            throw new Error('Translation failed');
        }
    }
}
