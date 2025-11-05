import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/auth/enums/role.enum';

@Schema({ timestamps: true })
export class Utilisateur extends Document {
  @Prop()
  studentId?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  age?: number;

  @Prop()
  avatar?: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: Role, default: Role.User })
  role: Role;

  // 👥 Liste des clubs dont l'utilisateur est membre
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Club' }], default: [] })
  clubs: Types.ObjectId[];

  // 👑 Club présidé (si role = President)
  @Prop({ type: Types.ObjectId, ref: 'Club', default: null })
  presidentOf?: Types.ObjectId | null;
}

export type UtilisateurDocument = Utilisateur & Document;
export const UtilisateurSchema = SchemaFactory.createForClass(Utilisateur);

UtilisateurSchema.index({ email: 1 }, { unique: true });
