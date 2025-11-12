import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Application extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: 'InternshipOffer', required: true })
  internshipId: string;

  @Prop({ required: true })
  cvUrl: string;

  @Prop()
  coverLetter: string;

  @Prop({ default: 0 })
  aiScore: number;

  @Prop({ default: 'pending', enum: ['pending', 'accepted', 'rejected'] })
  status: string;

  @Prop({ default: Date.now })
  submittedAt: Date;
}

export type ApplicationDocument = Application & Document;
export const ApplicationSchema = SchemaFactory.createForClass(Application);
