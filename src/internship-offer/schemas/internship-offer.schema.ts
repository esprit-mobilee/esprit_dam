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

  @Prop()
  location: string;

  @Prop({ required: true })
  duration: number; // en semaines

  @Prop()
  salary?: number;

  @Prop()
  logoUrl?: string; // <-- nouveau champ pour le logo
}

export const InternshipOfferSchema = SchemaFactory.createForClass(InternshipOffer);
