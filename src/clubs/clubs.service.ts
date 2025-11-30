import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Club, ClubDocument } from './schemas/club.schema';
import {
  Utilisateur,
  UtilisateurDocument,
} from 'src/utilisateurs/schemas/utilisateur.schema';
import { UpdateClubDto } from './dto/update-club.dto';
import { CreateFullClubDto } from './dto/create-full-club.dto';
import { Role } from 'src/auth/enums/role.enum';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/schemas/notification.schema';

@Injectable()
export class ClubsService {
  constructor(
    @InjectModel(Club.name)
    private readonly clubModel: Model<ClubDocument>,
    @InjectModel(Utilisateur.name)
    private readonly userModel: Model<UtilisateurDocument>,
    private readonly notificationsService: NotificationsService,
  ) { }

  // --------------------------------------------------------
  // CREATE FULL CLUB + CLUB ACCOUNT (ADMIN)
  // --------------------------------------------------------
  async createFullClub(dto: CreateFullClubDto, file?: Express.Multer.File) {
    const tagsArray = this.extractTags(dto.tags);
    const imageUrl = file ? `/uploads/clubs/${file.filename}` : null;

    const club = await this.clubModel.create({
      name: dto.name,
      description: dto.description ?? '',
      president: null,
      members: [],
      tags: tagsArray,
      imageUrl,
    });

    const identifiant = await this.generateClubIdentifiant(dto.name);
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      identifiant,
      name: dto.name,
      firstName: dto.name,
      lastName: '',
      email: dto.email,
      password: hashedPassword,
      role: Role.Club,
      club: club._id,
      presidentOf: null,
      clubs: [],
    });

    club.account = user._id as Types.ObjectId;
    await club.save();

    return {
      clubId: String(club._id),
      userId: String(user._id),
      identifiant,
      password: dto.password,
      role: Role.Club,
    };
  }

  // --------------------------------------------------------
  // FIND ALL CLUBS
  // --------------------------------------------------------
  async findAll(): Promise<Club[]> {
    return this.clubModel
      .find()
      .populate('president', 'identifiant firstName lastName email role')
      .populate('members', 'identifiant firstName lastName email')
      .populate('account', 'identifiant name email role')
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
      .populate('account', 'identifiant name email role')
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
    profileImage?: Express.Multer.File,
    coverImage?: Express.Multer.File,
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
          `Aucun utilisateur trouve avec l'identifiant ou ID ${dto.president}`,
        );
      }

      await this.userModel.updateOne(
        { _id: newPresident._id },
        { $set: { presidentOf: club._id } },
      );

      club.president = newPresident._id as Types.ObjectId;
    }

    if (profileImage) {
      club.imageUrl = `/uploads/clubs/${profileImage.filename}`;
    }

    if (coverImage) {
      club.coverImageUrl = `/uploads/clubs/${coverImage.filename}`;
    }

    if (dto.name !== undefined) club.name = dto.name;
    if (dto.description !== undefined) club.description = dto.description;

    if (dto.tags !== undefined) {
      club.tags = this.extractTags(dto.tags);
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
    return { message: 'Club supprime avec succes' };
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
      throw new BadRequestException('Utilisateur deja membre du club');
    }

    club.members.push(user._id as Types.ObjectId);
    user.clubs.push(club._id as Types.ObjectId);

    await club.save();
    await user.save();

    // Create notification for club
    await this.notificationsService.create(
      String(club._id),
      NotificationType.JOIN_REQUEST,
      String(user._id),
      `${user.firstName} ${user.lastName} a rejoint le club`,
    );

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
  // TOGGLE JOIN ENABLED
  // --------------------------------------------------------
  async toggleJoinEnabled(id: string): Promise<Club> {
    const club = await this.clubModel.findById(id);
    if (!club) throw new NotFoundException('Club introuvable');

    club.joinEnabled = !club.joinEnabled;
    await club.save();

    return this.findOne(id);
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

  // --------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------
  private extractTags(tags?: string) {
    return tags
      ? tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : [];
  }

  private async generateClubIdentifiant(name: string): Promise<string> {
    const normalized = (name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const base = normalized ? normalized.slice(0, 5) : 'clb';
    let attempts = 0;

    while (attempts < 20) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const parts: string[] = [];
      if (base) {
        parts.push(base);
      }
      if (!base.includes('clb')) {
        parts.push('clb');
      }
      const identifiant = `${parts.filter(Boolean).join('-')}${randomDigits}`;
      const exists = await this.userModel.exists({ identifiant });
      if (!exists) {
        return identifiant;
      }
      attempts += 1;
    }

    return `clb${Date.now()}`;
  }
}
