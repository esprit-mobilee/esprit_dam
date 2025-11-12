import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Club, ClubDocument } from './schemas/club.schema';
import {
  Utilisateur,
  UtilisateurDocument,
} from 'src/utilisateurs/schemas/utilisateur.schema';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@Injectable()
export class ClubsService {
  assignPresident(clubId: string, userId: string) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectModel(Club.name)
    private readonly clubModel: Model<ClubDocument>,
    @InjectModel(Utilisateur.name)
    private readonly userModel: Model<UtilisateurDocument>,
  ) {}

  // --------------------------------------------------
  // CREATE (admin)
  // accepts president as: Mongo _id  OR  identifiant (ex: "PR001")
  // --------------------------------------------------
  async create(dto: CreateClubDto): Promise<Club> {
    let presidentObjectId: Types.ObjectId | null = null;

    if (dto.president) {
      if (isValidObjectId(dto.president)) {
        // case 1: real ObjectId
        presidentObjectId = new Types.ObjectId(dto.president);
      } else {
        // case 2: treat as user.identifiant (PR001, ST12345, …)
        const user = await this.userModel
          .findOne({ identifiant: dto.president })
          .exec();
        if (!user) {
          throw new NotFoundException(
            `Aucun utilisateur avec l’identifiant ${dto.president}`,
          );
        }
        presidentObjectId = user._id as Types.ObjectId;
      }
    }

    const club = await this.clubModel.create({
      name: dto.name,
      description: dto.description ?? '',
      president: presidentObjectId,
      tags: dto.tags ?? [],
    });

    // sync user.presidentOf if a president was set
    if (presidentObjectId) {
      await this.userModel.updateOne(
        { _id: presidentObjectId },
        { $set: { presidentOf: club._id } },
      );
    }

    return this.findOne(String(club._id));
  }

  // --------------------------------------------------
  // FIND ALL
  // --------------------------------------------------
  async findAll(): Promise<Club[]> {
    return this.clubModel
      .find()
      .populate('president', 'identifiant firstName lastName email role')
      .populate('members', 'identifiant firstName lastName email')
      .exec();
  }

  // --------------------------------------------------
  // FIND ONE
  // --------------------------------------------------
  async findOne(id: string): Promise<Club> {
    const club = await this.clubModel
      .findById(id)
      .populate('president', 'identifiant firstName lastName email role')
      .populate('members', 'identifiant firstName lastName email')
      .exec();

    if (!club) {
      throw new NotFoundException(`Club avec id ${id} introuvable`);
    }
    return club;
  }

  // --------------------------------------------------
  // UPDATE (admin)
  // president can be _id or identifiant too
  // --------------------------------------------------
  async update(id: string, dto: UpdateClubDto): Promise<Club> {
    const club = await this.clubModel.findById(id);
    if (!club) {
      throw new NotFoundException('Club introuvable');
    }

    if (dto.president) {
      if (isValidObjectId(dto.president)) {
        club.president = new Types.ObjectId(dto.president);
      } else {
        const user = await this.userModel
          .findOne({ identifiant: dto.president })
          .exec();
        if (!user) {
          throw new NotFoundException(
            `Aucun utilisateur avec l’identifiant ${dto.president}`,
          );
        }
        club.president = user._id as Types.ObjectId;

        // reflect on user
        user.presidentOf = club._id as Types.ObjectId;
        await user.save();
      }
    }

    if (dto.name !== undefined) club.name = dto.name;
    if (dto.description !== undefined) club.description = dto.description;
    if (dto.tags !== undefined) club.tags = dto.tags;

    await club.save();
    return this.findOne(id);
  }

  // --------------------------------------------------
  // REMOVE (admin)
  // --------------------------------------------------
  async remove(id: string): Promise<{ message: string }> {
    const club = await this.clubModel.findById(id);
    if (!club) {
      throw new NotFoundException('Club introuvable');
    }

    // detach president
    if (club.president) {
      await this.userModel.updateOne(
        { _id: club.president },
        { $set: { presidentOf: null } },
      );
    }

    // detach members
    await this.userModel.updateMany(
      { clubs: club._id },
      { $pull: { clubs: club._id } },
    );

    await club.deleteOne();
    return { message: 'Club supprimé avec succès' };
  }

  // --------------------------------------------------
  // PRESIDENT ACTIONS used in controller
  // --------------------------------------------------

  // POST /clubs/:clubId/join/:userId
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

    club.members.push(user._id as Types.ObjectId);
    user.clubs.push(club._id as Types.ObjectId);

    await club.save();
    await user.save();

    return this.findOne(clubId);
  }

  // POST /clubs/:clubId/leave/:userId
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

  // GET /clubs/:clubId/members
  async getMembers(clubId: string) {
    const club = await this.findOne(clubId);
    return club.members;
  }

  // GET /clubs/admin/stats
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
