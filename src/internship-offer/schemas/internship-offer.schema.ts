// src/internship-offers/schemas/internship-offer.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InternshipOfferDocument = InternshipOffer & Document;

@Schema({ timestamps: true })
export class InternshipOffer {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  description: string;

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

  @Prop({ required: true })
  duration: number; // en semaines

  @Prop()
  salary?: number;
  @Prop({ default: 0 })
  applicationsCount: number;

  @Prop({ default: 1 })
  positionsAvailable: number;

  @Prop()
  logoUrl?: string; // <-- nouveau champ pour le logo
  @Prop([String])
  tags?: string[];

  @Prop()
  internshipType?: string;

  @Prop()
  procedure?: string;

  @Prop()
  interviewProcess?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  interviewDetails?: string;

}

export const InternshipOfferSchema = SchemaFactory.createForClass(InternshipOffer);
