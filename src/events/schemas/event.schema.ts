import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Utilisateur } from 'src/utilisateurs/schemas/utilisateur.schema';

@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  date: Date;

  @Prop()
  location?: string;

  @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: true })
  organizerId: Utilisateur;

  @Prop()
  category?: string;
}

export type EventDocument = Event & Document;
export const EventSchema = SchemaFactory.createForClass(Event);
