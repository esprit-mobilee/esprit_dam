import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Club, ClubDocument } from './schemas/club.schema';
import { Utilisateur, UtilisateurDocument } from 'src/utilisateurs/schemas/utilisateur.schema';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@Injectable()
export class ClubsService {
  constructor(
    @InjectModel(Club.name) private readonly clubModel: Model<ClubDocument>,
    @InjectModel(Utilisateur.name) private readonly userModel: Model<UtilisateurDocument>,
  ) {}

  // 🏗️ CREATE CLUB
  async create(dto: CreateClubDto): Promise<Club> {
    const club = await this.clubModel.create({
      name: dto.name,
      description: dto.description ?? '',
      president: dto.president ? new Types.ObjectId(dto.president) : null,
      tags: dto.tags ?? [],
    });

    // 🔗 Synchroniser côté utilisateur (président)
    if (dto.president) {
      const user = await this.userModel.findById(dto.president);
      if (!user) throw new NotFoundException('Président introuvable');

      user.presidentOf = club._id as unknown as Types.ObjectId; // ✅ fix typing
      await user.save();
    }

    return this.findOne(String(club._id));
  }

  // 📋 FIND ALL
  async findAll(): Promise<Club[]> {
    return this.clubModel
      .find()
      .populate('president', 'firstName lastName email role')
      .populate('members', 'firstName lastName email')
      .exec();
  }

  // 🔍 FIND ONE
  async findOne(id: string): Promise<Club> {
    const club = await this.clubModel
      .findById(id)
      .populate('president', 'firstName lastName email role')
      .populate('members', 'firstName lastName email')
      .exec();

    if (!club) throw new NotFoundException(`Club avec id ${id} introuvable`);
    return club;
  }

  // ✏️ UPDATE
  async update(id: string, dto: UpdateClubDto): Promise<Club> {
    const club = await this.clubModel.findById(id);
    if (!club) throw new NotFoundException('Club introuvable');

    // ✅ Si changement de président
    if (dto.president && dto.president !== String(club.president)) {
      await this.assignPresident(id, dto.president);
    }

    Object.assign(club, dto);
    await club.save();
    return this.findOne(id);
  }

  // ❌ DELETE
  async remove(id: string): Promise<{ message: string }> {
    const club = await this.clubModel.findById(id);
    if (!club) throw new NotFoundException('Club introuvable');

    // Détacher président
    if (club.president) {
      await this.userModel.updateOne(
        { _id: club.president },
        { $set: { presidentOf: null } },
      );
    }

    // Nettoyer les références membres
    await this.userModel.updateMany(
      { clubs: club._id },
      { $pull: { clubs: club._id } },
    );

    await club.deleteOne();
    return { message: 'Club supprimé avec succès' };
  }

  // 👑 ASSIGN PRESIDENT
  async assignPresident(clubId: string, userId: string) {
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException('Club introuvable');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Détacher ancien président
    if (club.president) {
      await this.userModel.updateOne(
        { _id: club.president },
        { $set: { presidentOf: null } },
      );
    }

    club.president = new Types.ObjectId(userId);
    await club.save();

    user.presidentOf = club._id as unknown as Types.ObjectId; // ✅ fix type
    await user.save();

    return this.findOne(clubId);
  }

  // ➕ JOIN CLUB
  async joinClub(clubId: string, userId: string) {
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException('Club introuvable');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const alreadyMember = club.members.some(
      (m) => String(m) === String(user._id),
    );

    if (alreadyMember) {
      throw new BadRequestException('Utilisateur déjà membre du club');
    }

    // ✅ Cast des IDs pour éviter les erreurs TS
    const userObjectId = user._id as unknown as Types.ObjectId;
    const clubObjectId = club._id as unknown as Types.ObjectId;

    club.members.push(userObjectId);
    user.clubs.push(clubObjectId);

    await club.save();
    await user.save();

    return this.findOne(clubId);
  }

  // ➖ LEAVE CLUB
  async leaveClub(clubId: string, userId: string) {
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException('Club introuvable');

    club.members = club.members.filter((m) => String(m) !== userId);
    await club.save();

    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { clubs: club._id } },
    );

    return this.findOne(clubId);
  }

  // 👥 GET MEMBERS
  async getMembers(clubId: string) {
    const club = await this.findOne(clubId);
    return club.members;
  }

  // 📊 GET STATS
  async getStats() {
    const clubs = await this.clubModel.find().populate('members').exec();
    const totalClubs = clubs.length;
    const totalMembers = clubs.reduce((sum, c) => sum + c.members.length, 0);
    const mostActive = clubs.sort(
      (a, b) => b.members.length - a.members.length,
    )[0];

    return {
      totalClubs,
      totalMembers,
      mostActiveClub: mostActive
        ? { name: mostActive.name, members: mostActive.members.length }
        : null,
    };
  }
}
