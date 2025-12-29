import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
    // Club notifications
    JOIN_REQUEST = 'join_request',
    EVENT_REGISTRATION = 'event_registration',

    // Internship notifications
    INTERNSHIP_CREATED = 'internship_created',
    INTERNSHIP_UPDATED = 'internship_updated',
    INTERNSHIP_DELETED = 'internship_deleted',

    // Application notifications
    APPLICATION_SUBMITTED = 'application_submitted',
    APPLICATION_ACCEPTED = 'application_accepted',
    APPLICATION_REJECTED = 'application_rejected',

    // Club content notifications
    CLUB_POST_CREATED = 'club_post_created',
    CLUB_EVENT_CREATED = 'club_event_created',

    // Social interaction notifications
    POST_LIKED = 'post_liked',
    POST_DISLIKED = 'post_disliked',
    COMMENT_LIKED = 'comment_liked',
    COMMENT_REPLIED = 'comment_replied',
    POST_COMMENTED = 'post_commented',
}

@Schema({ timestamps: true })
export class Notification extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Club', required: false })
    clubId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'InternshipOffer', required: false })
    internshipOfferId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Application', required: false })
    applicationId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Post', required: false })
    postId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Comment', required: false })
    commentId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Event', required: false })
    eventId?: Types.ObjectId;

    @Prop({ type: String, enum: NotificationType, required: true })
    type: NotificationType;

    @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: false })
    userId?: Types.ObjectId;

    @Prop({ required: true })
    message: string;

    @Prop({ default: false })
    read: boolean;

    @Prop()
    createdAt?: Date;

    @Prop()
    updatedAt?: Date;
}

export type NotificationDocument = Notification & Document;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
