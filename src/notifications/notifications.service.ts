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
        clubId: string,
        type: NotificationType,
        userId: string,
        message: string,
    ): Promise<Notification> {
        return this.notificationModel.create({
            clubId: new Types.ObjectId(clubId),
            type,
            userId: new Types.ObjectId(userId),
            message,
            read: false,
        });
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
}
