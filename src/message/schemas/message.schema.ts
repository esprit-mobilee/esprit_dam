import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Utilisateur } from '../../utilisateurs/schemas/utilisateur.schema';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: true })
  senderId: Types.ObjectId | Utilisateur;

  @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: true })
  receiverId: Types.ObjectId | Utilisateur;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 'text' })
  type: string;
  @Prop()
createdAt?: Date;

@Prop()
updatedAt?: Date;

}

export const MessageSchema = SchemaFactory.createForClass(Message);
