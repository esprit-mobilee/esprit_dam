import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Club, ClubDocument } from './schemas/club.schema';
import { JoinRequest, JoinRequestDocument, JoinRequestStatus } from './schemas/join-request.schema';
import {
  Utilisateur,
  UtilisateurDocument,
} from 'src/utilisateurs/schemas/utilisateur.schema';
import { UpdateClubDto } from './dto/update-club.dto';
import { CreateFullClubDto } from './dto/create-full-club.dto';
import { Role } from 'src/auth/enums/role.enum';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/schemas/notification.schema';
import { EmailService } from '../application/email.service'; // Ajuste le chemin selon ta structure
@Injectable()
export class ClubsService {
  constructor(
    @InjectModel(Club.name)
    private readonly clubModel: Model<ClubDocument>,
    @InjectModel(JoinRequest.name)
    private readonly joinRequestModel: Model<JoinRequestDocument>,
    @InjectModel(Utilisateur.name)
    private readonly userModel: Model<UtilisateurDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService, // ← NOUVELLE LIGNE
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
  // STUDENT : JOIN CLUB (If enabled) - Creates pending request
  // --------------------------------------------------------
  async studentJoinClub(
    clubId: string,
    userId: string,
    answers?: Array<{ question: string; answer: string }>,
  ) {
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException('Club introuvable');

    if (!club.joinEnabled) {
      throw new ForbiddenException("L'adhésion à ce club n'est pas ouverte actuellement.");
    }

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Debug logging
    console.log('Club members:', club.members);
    console.log('User ID:', String(user._id));
    console.log('User clubs array:', user.clubs);

    const alreadyMember = club.members.some(
      (m) => String(m) === String(user._id),
    );

    console.log('Already member check result:', alreadyMember);

    if (alreadyMember) {
      throw new BadRequestException('Vous êtes déjà membre de ce club');
    }

    // Check if there's already a pending request
    const existingRequest = await this.joinRequestModel.findOne({
      clubId: club._id,
      userId: user._id,
      status: JoinRequestStatus.PENDING,
    });

    if (existingRequest) {
      throw new BadRequestException('Vous avez déjà une demande en attente pour ce club');
    }

    // Create pending join request instead of auto-adding
    const joinRequest = await this.joinRequestModel.create({
      clubId: club._id,
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      answers: answers || [],
      status: JoinRequestStatus.PENDING,
    });

    console.log('Created join request:', {
      id: joinRequest._id,
      clubId: String(joinRequest.clubId),
      userId: String(joinRequest.userId),
      status: joinRequest.status,
    });

    // Create notification for club president/account
    const notificationContent = answers && answers.length > 0
      ? `${user.firstName} ${user.lastName} a demandé à rejoindre le club`
      : `${user.firstName} ${user.lastName} a demandé à rejoindre le club`;

    await this.notificationsService.create(
      String(club._id),
      NotificationType.JOIN_REQUEST,
      String(user._id),
      notificationContent,
    );

    return { message: 'Demande envoyée avec succès', requestId: String(joinRequest._id) };
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
  // UPDATE CLUB SETTINGS (join form questions, join enabled)
  // --------------------------------------------------------
  async updateSettings(
    id: string,
    settings: { joinEnabled?: boolean; joinFormQuestions?: string[] },
  ): Promise<Club> {
    const club = await this.clubModel.findById(id);
    if (!club) throw new NotFoundException(`Club avec id ${id} introuvable`);

    if (settings.joinEnabled !== undefined) {
      club.joinEnabled = settings.joinEnabled;
    }

    if (settings.joinFormQuestions !== undefined) {
      club.joinFormQuestions = settings.joinFormQuestions;
    }

    await club.save();
    return this.findOne(id);
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
  // GET PENDING JOIN REQUESTS FOR A CLUB
  // --------------------------------------------------------
  async getPendingRequests(clubId: string) {
    console.log('Getting pending requests for clubId:', clubId);

    const requests = await this.joinRequestModel
      .find({
        clubId: new Types.ObjectId(clubId),
        status: JoinRequestStatus.PENDING
      })
      .sort({ createdAt: -1 })
      .exec();

    console.log('Found pending requests:', requests.length);
    console.log('Requests:', JSON.stringify(requests, null, 2));

    return requests;
  }

  // --------------------------------------------------------
  // CHECK IF USER HAS PENDING REQUEST FOR A CLUB
  // --------------------------------------------------------
  async checkJoinRequestStatus(clubId: string, userId: string) {
    const pendingRequest = await this.joinRequestModel.findOne({
      clubId: new Types.ObjectId(clubId),
      userId: new Types.ObjectId(userId),
      status: JoinRequestStatus.PENDING,
    });

    return {
      hasPendingRequest: !!pendingRequest,
      requestId: pendingRequest ? String(pendingRequest._id) : null,
    };
  }
  // --------------------------------------------------------
// APPROVE JOIN REQUEST
// --------------------------------------------------------
async approveJoinRequest(requestId: string) {
  const request = await this.joinRequestModel.findById(requestId);
  if (!request) throw new NotFoundException('Demande introuvable');

  if (request.status !== 'PENDING') {
    throw new BadRequestException('Cette demande a déjà été traitée');
  }

  const club = await this.clubModel.findById(request.clubId);
  const user = await this.userModel.findById(request.userId);

  if (!club || !user) {
    throw new NotFoundException('Club ou utilisateur introuvable');
  }

  // Add user to club
  club.members.push(user._id as Types.ObjectId);
  user.clubs.push(club._id as Types.ObjectId);

  await club.save();
  await user.save();

  // Update request status
  request.status = JoinRequestStatus.APPROVED;
  await request.save();

  // Notify the user (in-app)
  await this.notificationsService.create(
    String(user._id),
    NotificationType.JOIN_REQUEST,
    String(club._id),
    `Votre demande pour rejoindre ${club.name} a été acceptée`,
  );

  // ✅ SEND EMAIL
  try {
    await this.emailService.sendClubAcceptanceEmail(
      user.email || '', // ← FIX: Utilise '' si undefined
      `${user.firstName || ''} ${user.lastName || ''}`, // ← FIX
      club.name || '' // ← FIX
    );
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email d\'acceptation:', error);
  }

  return { message: 'Demande acceptée avec succès' };
}

// --------------------------------------------------------
// REJECT JOIN REQUEST
// --------------------------------------------------------
async rejectJoinRequest(requestId: string) {
  const request = await this.joinRequestModel.findById(requestId);
  if (!request) throw new NotFoundException('Demande introuvable');

  if (request.status !== 'PENDING') {
    throw new BadRequestException('Cette demande a déjà été traitée');
  }

  const club = await this.clubModel.findById(request.clubId);
  const user = await this.userModel.findById(request.userId);

  // Update request status
  request.status = JoinRequestStatus.REJECTED;
  await request.save();

  // Notify the user (in-app)
  if (club && user) {
    await this.notificationsService.create(
      String(user._id),
      NotificationType.JOIN_REQUEST,
      String(club._id),
      `Votre demande pour rejoindre ${club.name} a été refusée`,
    );

    // ✅ SEND EMAIL
    try {
      await this.emailService.sendClubRejectionEmail(
        user.email || '', // ← FIX: Utilise '' si undefined
        `${user.firstName || ''} ${user.lastName || ''}`, // ← FIX
        club.name || '' // ← FIX
      );
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de refus:', error);
    }
  }

  return { message: 'Demande refusée' };
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
