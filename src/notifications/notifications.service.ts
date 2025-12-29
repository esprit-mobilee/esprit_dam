import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    Notification,
    NotificationDocument,
    NotificationType,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name)
        private readonly notificationModel: Model<NotificationDocument>,
    ) { }

    // Create a notification
    async create(
        type: NotificationType,
        message: string,
        options?: {
            clubId?: string;
            userId?: string;
            internshipOfferId?: string;
            applicationId?: string;
            postId?: string;
            commentId?: string;
            eventId?: string;
        }
    ): Promise<Notification> {
        const notificationData: any = {
            type,
            message,
            read: false,
        };

        if (options?.clubId) {
            notificationData.clubId = new Types.ObjectId(options.clubId);
        }
        if (options?.userId) {
            notificationData.userId = new Types.ObjectId(options.userId);
        }
        if (options?.internshipOfferId) {
            notificationData.internshipOfferId = new Types.ObjectId(options.internshipOfferId);
        }
        if (options?.applicationId) {
            notificationData.applicationId = new Types.ObjectId(options.applicationId);
        }
        if (options?.postId) {
            notificationData.postId = new Types.ObjectId(options.postId);
        }
        if (options?.commentId) {
            notificationData.commentId = new Types.ObjectId(options.commentId);
        }
        if (options?.eventId) {
            notificationData.eventId = new Types.ObjectId(options.eventId);
        }

        return this.notificationModel.create(notificationData);
    }

    // Get all notifications for a club
    async getClubNotifications(clubId: string): Promise<Notification[]> {
        return this.notificationModel
            .find({ clubId: new Types.ObjectId(clubId) })
            .populate('userId', 'firstName lastName identifiant avatar')
            .sort({ createdAt: -1 })
            .exec();
    }

    // Mark notification as read
    async markAsRead(id: string): Promise<Notification> {
        const notification = await this.notificationModel.findById(id);
        if (!notification) {
            throw new NotFoundException('Notification introuvable');
        }

        notification.read = true;
        await notification.save();
        return notification;
    }

    // Delete notification
    async delete(id: string): Promise<{ message: string }> {
        const notification = await this.notificationModel.findById(id);
        if (!notification) {
            throw new NotFoundException('Notification introuvable');
        }

        await notification.deleteOne();
        return { message: 'Notification supprimée' };
    }

    // Get unread count for a club
    async getUnreadCount(clubId: string): Promise<number> {
        return this.notificationModel.countDocuments({
            clubId: new Types.ObjectId(clubId),
            read: false,
        });
    }

    // Get all notifications for a user (not just club-specific)
    async getUserNotifications(userId: string): Promise<Notification[]> {
        return this.notificationModel
            .find({
                $or: [
                    { userId: new Types.ObjectId(userId) },
                    { userId: { $exists: false } } // Global notifications
                ]
            })
            .populate('internshipOfferId')
            .populate('applicationId')
            .populate('eventId')
            .populate('userId', 'firstName lastName avatar')
            .sort({ createdAt: -1 })
            .exec();
    }

    // Get unread count for a user
    async getUserUnreadCount(userId: string): Promise<number> {
        return this.notificationModel.countDocuments({
            $or: [
                { userId: new Types.ObjectId(userId), read: false },
                { userId: { $exists: false }, read: false }
            ]
        });
    }
}
