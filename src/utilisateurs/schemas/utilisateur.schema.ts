import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/auth/enums/role.enum';

@Schema({ timestamps: true })
export class Utilisateur extends Document {
  // Identifiant de connexion (ST12345, PROF001, PARENT009…)
  @Prop({ unique: true, sparse: true })
  identifiant?: string;

  // ID étudiant si applicable
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

  // Classe / groupe (pour étudiants)
  @Prop()
  classGroup?: string;

  @Prop({ required: true })
  password: string;

  // Roles simples et propres (option A)
  @Prop({ enum: Role, default: Role.User })
  role: Role;

  // Clubs dont l'utilisateur est membre
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Club' }], default: [] })
  clubs: Types.ObjectId[];

  // Club dont il est président (si applicable)
  @Prop({ type: Types.ObjectId, ref: 'Club', default: null })
  presidentOf?: Types.ObjectId | null;
}

export type UtilisateurDocument = Utilisateur & Document;
export const UtilisateurSchema = SchemaFactory.createForClass(Utilisateur);

UtilisateurSchema.index({ email: 1 }, { unique: true });
