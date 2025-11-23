import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Club', required: true })
  clubId: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: true })
  authorId: Types.ObjectId; // president user

  @Prop({ default: 0 })
  likes: number;
}

export type PostDocument = Post & Document;
export const PostSchema = SchemaFactory.createForClass(Post);
