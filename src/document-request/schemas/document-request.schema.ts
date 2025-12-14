import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DocumentType {
  ATTESTATION = 'attestation',
  RELEVE = 'relevé',
  CONVENTION = 'convention',
}

@Schema({ timestamps: true })
export class DocumentRequest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: DocumentType,
    required: true
  })
  type: DocumentType;

  @Prop({ type: String, required: true })
  annee: string; // Année académique ou année de la demande

  @Prop({
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  })
  status: string;

  @Prop({ type: String, required: false })
  rejectionReason?: string;

  @Prop({ type: String, required: false })
  adminFileUrl?: string;

  @Prop({ type: String, unique: true, sparse: true })
  documentReference?: string;

  @Prop({ type: String })
  verificationHash?: string;

  @Prop({ type: String })
  approvedBy?: string;

  @Prop({ type: Date })
  approvedAt?: Date;
}

export type DocumentRequestDocument = DocumentRequest & Document;
export const DocumentRequestSchema = SchemaFactory.createForClass(DocumentRequest);

// Index pour améliorer les performances des requêtes
DocumentRequestSchema.index({ userId: 1, type: 1 });
DocumentRequestSchema.index({ userId: 1 });
