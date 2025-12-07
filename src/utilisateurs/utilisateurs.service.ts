import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
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
  ) { }

  // CREATE
  async create(createUtilisateurDto: CreateUtilisateurDto): Promise<Utilisateur> {
    const identExists = await this.utilisateurModel.findOne({
      identifiant: createUtilisateurDto.identifiant,
    });
    if (identExists) {
      throw new BadRequestException('Identifiant deja utilise');
    }

    if (createUtilisateurDto.email) {
      const emailExists = await this.utilisateurModel.findOne({
        email: createUtilisateurDto.email,
      });
      if (emailExists) {
        throw new BadRequestException('Email deja utilise');
      }
    }

    const hashedPassword = await bcrypt.hash(createUtilisateurDto.password, 10);

    const [firstNameFallback, ...rest] = createUtilisateurDto.name.split(' ');
    const payload: Partial<CreateUtilisateurDto> & { password: string } = {
      ...createUtilisateurDto,
      password: hashedPassword,
      firstName: createUtilisateurDto.firstName ?? firstNameFallback,
      lastName: createUtilisateurDto.lastName ?? rest.join(' '),
    };

    const utilisateur = new this.utilisateurModel(payload);
    return utilisateur.save();
  }

  // FIND ALL
  async findAll(): Promise<Utilisateur[]> {
    return this.utilisateurModel.find().exec();
  }

  // FIND ONE BY ID
  async findOne(id: string): Promise<Utilisateur> {
    const utilisateur = await this.utilisateurModel.findById(id).exec();
    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec id ${id} introuvable`);
    }
    return utilisateur;
  }

  // NEW: find by identifiant
  async findByIdentifiant(identifiant: string): Promise<Utilisateur> {
    const user = await this.utilisateurModel.findOne({ identifiant }).exec();
    if (!user) {
      throw new NotFoundException(
        `Utilisateur avec identifiant ${identifiant} introuvable`,
      );
    }
    return user;
  }

  // UPDATE (admin / back-office)
  async update(
    id: string,
    updateUtilisateurDto: UpdateUtilisateurDto,
  ): Promise<Utilisateur> {
    if (updateUtilisateurDto.password) {
      updateUtilisateurDto.password = await bcrypt.hash(
        updateUtilisateurDto.password,
        10,
      );
    }

    const utilisateur = await this.utilisateurModel
      .findByIdAndUpdate(id, updateUtilisateurDto, { new: true })
      .exec();
    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec id ${id} introuvable`);
    }
    return utilisateur;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.utilisateurModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Utilisateur avec id ${id} introuvable`);
    }
    return { message: 'Utilisateur supprime avec succes' };
  }

  // CHANGE PASSWORD (for connected user)
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

    return { message: 'Mot de passe modifie avec succes' };
  }

  // UPDATE ONLINE STATUS (Called by ChatGateway)
  async updateStatus(userId: string, isOnline: boolean) {
    const updateData: any = { isOnline };
    if (!isOnline) {
      updateData.lastSeen = new Date(); // Set last seen when going offline
    }
    return this.utilisateurModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
  }
}
