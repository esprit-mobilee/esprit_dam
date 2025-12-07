import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum JoinRequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Schema({ timestamps: true })
export class JoinRequest extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Club', required: true })
    clubId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    userName: string;

    @Prop({ required: true })
    userEmail: string;

    @Prop({
        type: [
            {
                question: { type: String, required: true },
                answer: { type: String, required: true },
            },
        ],
        default: [],
    })
    answers: Array<{ question: string; answer: string }>;

    @Prop({ type: String, enum: JoinRequestStatus, default: JoinRequestStatus.PENDING })
    status: JoinRequestStatus;
}

export type JoinRequestDocument = JoinRequest & Document;
export const JoinRequestSchema = SchemaFactory.createForClass(JoinRequest);
