import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Utilisateur,
  UtilisateurDocument,
} from './schemas/utilisateur.schema';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UtilisateursService {
  constructor(
    @InjectModel(Utilisateur.name)
    private readonly utilisateurModel: Model<UtilisateurDocument>,
  ) {}

  // ✅ CREATE
  async create(
    createUtilisateurDto: CreateUtilisateurDto,
  ): Promise<Utilisateur> {
    const utilisateur = new this.utilisateurModel(createUtilisateurDto);
    return utilisateur.save();
  }

  // ✅ FIND ALL
  async findAll(): Promise<Utilisateur[]> {
    return this.utilisateurModel.find().exec();
  }

  // ✅ FIND ONE BY ID
  async findOne(id: string): Promise<Utilisateur> {
    const utilisateur = await this.utilisateurModel.findById(id).exec();
    if (!utilisateur)
      throw new NotFoundException(
        `Utilisateur avec id ${id} introuvable`,
      );
    return utilisateur;
  }

  // ✅ NEW: find by identifiant (ST12345, PRESI001, …)
  async findByIdentifiant(identifiant: string): Promise<Utilisateur> {
    const user = await this.utilisateurModel
      .findOne({ identifiant })
      .exec();
    if (!user) {
      throw new NotFoundException(
        `Utilisateur avec identifiant ${identifiant} introuvable`,
      );
    }
    return user;
  }

  // ✅ UPDATE (admin / back-office)
  async update(
    id: string,
    updateUtilisateurDto: UpdateUtilisateurDto,
  ): Promise<Utilisateur> {
    const utilisateur = await this.utilisateurModel
      .findByIdAndUpdate(id, updateUtilisateurDto, { new: true })
      .exec();
    if (!utilisateur)
      throw new NotFoundException(
        `Utilisateur avec id ${id} introuvable`,
      );
    return utilisateur;
  }

  // ✅ DELETE
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.utilisateurModel.findByIdAndDelete(id).exec();
    if (!result)
      throw new NotFoundException(
        `Utilisateur avec id ${id} introuvable`,
      );
    return { message: 'Utilisateur supprimé avec succès' };
  }

  // ✅ CHANGE PASSWORD (for connected user)
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.utilisateurModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return { message: 'Mot de passe modifié avec succès' };
  }
}
