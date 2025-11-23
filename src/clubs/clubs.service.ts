import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
  constructor(
    @InjectModel(Club.name)
    private readonly clubModel: Model<ClubDocument>,
    @InjectModel(Utilisateur.name)
    private readonly userModel: Model<UtilisateurDocument>,
  ) {}

  // --------------------------------------------------------
  // CREATE CLUB (ADMIN)
  // --------------------------------------------------------
  async create(dto: CreateClubDto, file?: Express.Multer.File): Promise<Club> {
    let presidentObjectId: Types.ObjectId | null = null;

    if (dto.president) {
      if (isValidObjectId(dto.president)) {
        presidentObjectId = new Types.ObjectId(dto.president);
      } else {
        const user = await this.userModel.findOne({ identifiant: dto.president });
        if (!user) {
          throw new NotFoundException(
            `Aucun utilisateur trouvé avec l’identifiant ${dto.president}`,
          );
        }
        presidentObjectId = user._id as Types.ObjectId;
      }
    }

    const tagsArray = dto.tags
      ? dto.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : [];

    const imageUrl = file ? `/uploads/clubs/${file.filename}` : null;

    const club = await this.clubModel.create({
      name: dto.name,
      description: dto.description ?? '',
      president: presidentObjectId,
      tags: tagsArray,
      imageUrl,
    });

    if (presidentObjectId) {
      await this.userModel.updateOne(
        { _id: presidentObjectId },
        { $set: { presidentOf: club._id } },
      );
    }

    return this.findOne(String(club._id));
  }

  // --------------------------------------------------------
  // FIND ALL CLUBS
  // --------------------------------------------------------
  async findAll(): Promise<Club[]> {
    return this.clubModel
      .find()
      .populate('president', 'identifiant firstName lastName email role')
      .populate('members', 'identifiant firstName lastName email')
      .exec();
  }

  // --------------------------------------------------------
  // FIND ONE
  // --------------------------------------------------------
  async findOne(id: string): Promise<Club> {
    const club = await this.clubModel
      .findById(id)
      .populate('president', 'identifiant firstName lastName email role')
      .populate('members', 'identifiant firstName lastName email')
      .exec();

    if (!club) throw new NotFoundException(`Club avec id ${id} introuvable`);
    return club;
  }

  // --------------------------------------------------------
  // UPDATE CLUB (ADMIN OR PRESIDENT OF THIS CLUB)
  // --------------------------------------------------------
  async update(
    id: string,
    dto: UpdateClubDto,
    file?: Express.Multer.File,
  ): Promise<Club> {
    const club = await this.clubModel.findById(id);
    if (!club) throw new NotFoundException('Club introuvable');

    // Update president if provided
    if (dto.president) {
      let newPresident: UtilisateurDocument | null = null;

      if (isValidObjectId(dto.president)) {
        newPresident = await this.userModel.findById(dto.president);
      } else {
        newPresident = await this.userModel.findOne({ identifiant: dto.president });
      }

      if (!newPresident) {
        throw new NotFoundException(
          `Aucun utilisateur trouvé avec l’identifiant ou ID ${dto.president}`,
        );
      }

      await this.userModel.updateOne(
        { _id: newPresident._id },
        { $set: { presidentOf: club._id } },
      );

      club.president = newPresident._id as Types.ObjectId;
    }

    if (file) {
      club.imageUrl = `/uploads/clubs/${file.filename}`;
    }

    if (dto.name !== undefined) club.name = dto.name;
    if (dto.description !== undefined) club.description = dto.description;

    if (dto.tags !== undefined) {
      club.tags = dto.tags
        ? dto.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
        : [];
    }

    await club.save();
    return this.findOne(String(club._id));
  }

  // --------------------------------------------------------
  // REMOVE CLUB (ADMIN)
  // --------------------------------------------------------
  async remove(id: string): Promise<{ message: string }> {
    const club = await this.clubModel.findById(id);
    if (!club) throw new NotFoundException('Club introuvable');

    if (club.president) {
      await this.userModel.updateOne(
        { _id: club.president },
        { $set: { presidentOf: null } },
      );
    }

    await this.userModel.updateMany(
      { clubs: club._id },
      { $pull: { clubs: club._id } },
    );

    await club.deleteOne();
    return { message: 'Club supprimé avec succès' };
  }

  // --------------------------------------------------------
  // PRESIDENT ONLY : ADD MEMBER
  // --------------------------------------------------------
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

  // --------------------------------------------------------
  // PRESIDENT ONLY : REMOVE MEMBER
  // --------------------------------------------------------
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

  // --------------------------------------------------------
  // GET MEMBERS
  // --------------------------------------------------------
  async getMembers(clubId: string) {
    const club = await this.findOne(clubId);
    return club.members;
  }

  // --------------------------------------------------------
  // STATS (ADMIN)
  // --------------------------------------------------------
  async getStats() {
    const clubs = await this.clubModel.find().populate('members').exec();

    const totalClubs = clubs.length;
    let totalMembers = 0;
    let mostActive: ClubDocument | null = null;

    for (const club of clubs) {
      const count = club.members.length;
      totalMembers += count;

      if (!mostActive || count > mostActive.members.length) {
        mostActive = club;
      }
    }

    return {
      totalClubs,
      totalMembers,
      mostActiveClub: mostActive
        ? { name: mostActive.name, members: mostActive.members.length }
        : null,
    };
  }
}
