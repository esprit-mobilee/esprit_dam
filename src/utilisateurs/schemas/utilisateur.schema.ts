import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/auth/enums/role.enum';

@Schema({ timestamps: true })
export class Utilisateur extends Document {
  // Identifiant de connexion (ST12345, PROF001, PARENT009)
  @Prop({ required: true, unique: true })
  identifiant: string;

  // ID etudiant si applicable
  @Prop()
  studentId?: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({ unique: true, sparse: true })
  email?: string;

  @Prop()
  age?: number;

  @Prop()
  avatar?: string;

  // Classe / groupe (pour etudiants)
  @Prop()
  classGroup?: string;

  @Prop({ required: true })
  password: string;

  // Ajouter ce champ unique dans le schéma User
@Prop({ type: Boolean, default: false })
inscriptionPaid: boolean;

  // on inclut ton nouveau rôle "parent"
  @Prop({ enum: Role, default: Role.User })
  role: Role;

  // Clubs dont l'utilisateur est membre
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Club' }], default: [] })
  clubs: Types.ObjectId[];

  // Club dont il est president (si applicable)
  @Prop({ type: Types.ObjectId, ref: 'Club', default: null })
  presidentOf?: Types.ObjectId | null;

  // Club lie au compte (pour les comptes club)
  @Prop({ type: Types.ObjectId, ref: 'Club', default: null })
  club?: Types.ObjectId | null;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ default: Date.now })
  lastSeen: Date;
}

export type UtilisateurDocument = Utilisateur & Document;
export const UtilisateurSchema = SchemaFactory.createForClass(Utilisateur);


