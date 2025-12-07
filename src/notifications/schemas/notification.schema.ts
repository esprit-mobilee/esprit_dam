import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
    JOIN_REQUEST = 'join_request',
    EVENT_REGISTRATION = 'event_registration',
}

@Schema({ timestamps: true })
export class Notification extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Club', required: true })
    clubId: Types.ObjectId;

    @Prop({ type: String, enum: NotificationType, required: true })
    type: NotificationType;

    @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: true })
    userId: Types.ObjectId;

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
