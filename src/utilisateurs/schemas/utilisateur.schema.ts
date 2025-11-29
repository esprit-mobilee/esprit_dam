import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/auth/enums/role.enum';

@Schema({ timestamps: true })
export class Utilisateur extends Document {
  // identifiant de connexion (ST12345, PARENT001, PROF.AHMED, etc.)
  @Prop({ unique: true, sparse: true })
  identifiant?: string;

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

    // 👇👇 NEW: classe / groupe (ex: "4SIM4")
  @Prop()
  classGroup?: string;

  @Prop({ required: true })
  password: string;

  // on inclut ton nouveau rôle "parent"
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
