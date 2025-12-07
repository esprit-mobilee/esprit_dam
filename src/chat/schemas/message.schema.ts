import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VOICE = 'VOICE',
    GIF = 'GIF',
}

@Schema()
export class Reaction {
    @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    emoji: string;
}

const ReactionSchema = SchemaFactory.createForClass(Reaction);

@Schema({ timestamps: true })
export class Message {
    @Prop({ type: Types.ObjectId, ref: 'Club', required: false, index: true, default: null }) // Optional for DMs
    clubId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: true, index: true })
    senderId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Utilisateur', index: true, default: null })
    recipientId: Types.ObjectId; // For Private Chats

    @Prop({ required: true })
    content: string;

    @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
    type: MessageType;

    @Prop()
    attachmentUrl?: string;

    @Prop({ type: [ReactionSchema], default: [] })
    reactions: Reaction[];

    @Prop({
        type: [{ userId: { type: Types.ObjectId, ref: 'Utilisateur' }, readAt: Date }],
        default: [],
    })
    readBy: { userId: Types.ObjectId; readAt: Date }[];

    @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
    replyTo: Types.ObjectId;

    @Prop({ default: false })
    isEdited: boolean;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
export type MessageDocument = Message & Document;
