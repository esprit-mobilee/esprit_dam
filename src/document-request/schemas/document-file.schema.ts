import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DocumentType } from './document-request.schema';

@Schema({ timestamps: true })
export class DocumentFile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: true })
  userId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: DocumentType, 
    required: true 
  })
  type: DocumentType;

  @Prop({ type: String, required: true })
  annee: string; // Année académique (ex: "2024" ou "2024-2025")

  @Prop({ type: String, required: true })
  nomFichier: string;

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: Types.ObjectId, ref: 'DocumentRequest', required: false })
  documentRequestId?: Types.ObjectId;
}

export type DocumentFileDocument = DocumentFile & Document;
export const DocumentFileSchema = SchemaFactory.createForClass(DocumentFile);

// Index pour améliorer les performances des requêtes
DocumentFileSchema.index({ userId: 1, type: 1, annee: 1 }, { unique: true });
DocumentFileSchema.index({ userId: 1 });
DocumentFileSchema.index({ documentRequestId: 1 });

