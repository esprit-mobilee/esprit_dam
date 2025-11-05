import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Utilisateur, UtilisateurDocument } from './schemas/utilisateur.schema';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';

@Injectable()
export class UtilisateursService {
  constructor(
    @InjectModel(Utilisateur.name)
    private readonly utilisateurModel: Model<UtilisateurDocument>,
  ) {}

  // ✅ CREATE
  async create(createUtilisateurDto: CreateUtilisateurDto): Promise<Utilisateur> {
    const utilisateur = new this.utilisateurModel(createUtilisateurDto);
    return utilisateur.save();
  }

  // ✅ FIND ALL
  async findAll(): Promise<Utilisateur[]> {
    return this.utilisateurModel.find().exec();
  }

  // ✅ FIND ONE
  async findOne(id: string): Promise<Utilisateur> {
    const utilisateur = await this.utilisateurModel.findById(id).exec();
    if (!utilisateur) throw new NotFoundException(`Utilisateur avec id ${id} introuvable`);
    return utilisateur;
  }

  // ✅ UPDATE
  async update(id: string, updateUtilisateurDto: UpdateUtilisateurDto): Promise<Utilisateur> {
    const utilisateur = await this.utilisateurModel
      .findByIdAndUpdate(id, updateUtilisateurDto, { new: true })
      .exec();
    if (!utilisateur) throw new NotFoundException(`Utilisateur avec id ${id} introuvable`);
    return utilisateur;
  }

  // ✅ DELETE
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.utilisateurModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Utilisateur avec id ${id} introuvable`);
    return { message: 'Utilisateur supprimé avec succès' };
  }
}
