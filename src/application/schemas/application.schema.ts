import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Application extends Document {
  @Prop({ required: true })
  userId: string; // identifiant étudiant (HT12345 ou ObjectId string)

  @Prop({ type: Types.ObjectId, ref: 'InternshipOffer', required: true })
  // en base c'est un ObjectId, mais on tape large côté TS
  internshipId: Types.ObjectId | string;

  @Prop()
  cvUrl?: string; // URL externe OU content:// URI OU chemin /uploads/...

  @Prop()
  coverLetter?: string; // texte

  @Prop()
  coverLetterFileUrl?: string; // fichier uploadé (optionnel)

  @Prop({ default: 0 })
  aiScore: number;

  @Prop({ default: 'pending', enum: ['pending', 'accepted', 'rejected'] })
  status: string;

  @Prop({ default: Date.now })
  submittedAt: Date;

  // Interview information for Google Calendar integration
  @Prop({
    type: {
      scheduledAt: Date,
      googleEventId: String,
      meetingLink: String,
      notes: String,
      status: { type: String, enum: ['scheduled', 'completed', 'cancelled'] }
    },
    required: false
  })
  interview?: {
    scheduledAt?: Date;
    googleEventId?: string;
    meetingLink?: string;
    notes?: string;
    status?: 'scheduled' | 'completed' | 'cancelled';
  };
}

export type ApplicationDocument = Application & Document;
export const ApplicationSchema = SchemaFactory.createForClass(Application);