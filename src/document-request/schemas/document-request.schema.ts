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
}

export type DocumentRequestDocument = DocumentRequest & Document;
export const DocumentRequestSchema = SchemaFactory.createForClass(DocumentRequest);

// Index pour améliorer les performances des requêtes
DocumentRequestSchema.index({ userId: 1, type: 1 });
DocumentRequestSchema.index({ userId: 1 });
