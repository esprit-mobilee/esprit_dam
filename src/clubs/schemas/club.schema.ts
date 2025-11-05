import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Utilisateur } from 'src/utilisateurs/schemas/utilisateur.schema';

@Schema({ timestamps: true })
export class Club extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  // 👑 Président du club
  @Prop({ type: Types.ObjectId, ref: 'Utilisateur', default: null })
  president: Types.ObjectId | null;

  // 👥 Liste des membres
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Utilisateur' }], default: [] })
  members: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: Date.now })
  foundedAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export type ClubDocument = Club & Document;
export const ClubSchema = SchemaFactory.createForClass(Club);
