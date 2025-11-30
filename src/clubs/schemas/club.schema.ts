import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Utilisateur } from 'src/utilisateurs/schemas/utilisateur.schema';

@Schema({ timestamps: true })
export class Club extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Utilisateur', default: null })
  president: Types.ObjectId | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Utilisateur' }], default: [] })
  members: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  imageUrl?: string;

  @Prop()
  coverImageUrl?: string;

  @Prop({ default: true })
  joinEnabled: boolean;

  @Prop({ type: Types.ObjectId, ref: Utilisateur.name, default: null })
  account?: Types.ObjectId | null;
}

export type ClubDocument = Club & Document;
export const ClubSchema = SchemaFactory.createForClass(Club);
