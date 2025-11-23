import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  location?: string;

  // Identifiant (login) du président créateur, pas l'ObjectId Mongo
  @Prop({ required: true })
  organizerId: string;

  @Prop()
  category?: string;

  @Prop()
  imageUrl?: string;
}

export type EventDocument = Event & Document;
export const EventSchema = SchemaFactory.createForClass(Event);
