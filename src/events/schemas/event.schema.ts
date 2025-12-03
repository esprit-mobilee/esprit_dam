import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  @Prop({
    type: {
      address: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
  })
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };

  // Identifiant (login) du président créateur, pas l'ObjectId Mongo
  @Prop({ required: true })
  organizerId: string;

  @Prop()
  category?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  imageUrl?: string;

  @Prop({ default: true })
  registrationOpen: boolean;

  @Prop({
    type: [
      {
        userId: { type: Types.ObjectId, ref: 'Utilisateur', default: null },
        name: { type: String, required: true },
        identifiant: { type: String },
        email: { type: String },
        message: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  registrations: {
    userId?: Types.ObjectId | null;
    name: string;
    identifiant?: string;
    email?: string;
    message?: string;
    createdAt: Date;
  }[];
}

export type EventDocument = Event & Document;
export const EventSchema = SchemaFactory.createForClass(Event);
