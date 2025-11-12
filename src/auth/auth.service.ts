import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import {
  Utilisateur,
  UtilisateurDocument,
} from 'src/utilisateurs/schemas/utilisateur.schema';
import { RefreshToken } from './schemas/refresh-token.schema';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Utilisateur.name)
    private readonly utilisateurModel: Model<UtilisateurDocument>,

    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,

    private readonly jwtService: JwtService,
  ) {}

  // ----------------------------
  // 📝 SIGNUP
  // ----------------------------
  async signUp(signupData: SignupDto) {
    const {
      email,
      password,
      name,
      role,
      identifiant,
      classGroup,
    } = signupData;

    // email unique
    const emailInUse = await this.utilisateurModel.findOne({ email });
    if (emailInUse) {
      throw new BadRequestException('Email déjà utilisé');
    }

    // identifiant unique (si fourni)
    if (identifiant) {
      const identifiantInUse = await this.utilisateurModel.findOne({
        identifiant,
      });
      if (identifiantInUse) {
        throw new BadRequestException('Identifiant déjà utilisé');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.utilisateurModel.create({
      identifiant,
      firstName: name,         // on stocke quand même
      lastName: '',
      email,
      password: hashedPassword,
      age: 0,
      classGroup: classGroup ?? null,
      role: role ?? Role.User,
    });

    return { message: 'Utilisateur créé avec succès', userId: newUser._id };
  }

  // ----------------------------
  // 🔐 LOGIN
  // ----------------------------
  async login(credentials: LoginDto) {
    const { identifiant, password } = credentials;

    const utilisateur = await this.utilisateurModel.findOne({
      $or: [
        { identifiant },
        { email: identifiant },
        { studentId: identifiant },
      ],
    });

    if (!utilisateur) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const passwordMatch = await bcrypt.compare(password, utilisateur.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const userId: string = (
      utilisateur._id as unknown as Types.ObjectId
    ).toString();

    const tokens = await this.generateUserTokens(userId, utilisateur.role);

    // 👇 on construit un user "clean" pour Android
    const fullName =
      (utilisateur.firstName ?? '').trim().length > 0 ||
      (utilisateur.lastName ?? '').trim().length > 0
        ? `${utilisateur.firstName ?? ''} ${utilisateur.lastName ?? ''}`.trim()
        : utilisateur.email; // fallback

    return {
      ...tokens,
      user: {
        id: userId,
        name: fullName,                     // 👈 Android va lire ça
        email: utilisateur.email,
        role: utilisateur.role,
        classGroup: utilisateur.classGroup ?? null,
        studentId: utilisateur.studentId ?? null,
      },
      message: 'Connexion réussie',
    };
  }

  // ----------------------------
  // 🔎 ME (si tu l’utilises)
  // ----------------------------
  async me(userId: string) {
    const user = await this.utilisateurModel.findById(userId).lean();
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    const fullName =
      (user.firstName ?? '').trim().length > 0 ||
      (user.lastName ?? '').trim().length > 0
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
        : user.email;

    return {
      id: user._id.toString(),
      name: fullName,                   // 👈 même format
      email: user.email,
      role: user.role,
      classGroup: user.classGroup ?? null,
      studentId: user.studentId ?? null,
    };
  }

  // ----------------------------
  // JWT
  // ----------------------------
  async generateUserTokens(userId: string, role: Role) {
    const accessToken = this.jwtService.sign({ userId, role }, { expiresIn: '10h' });
    const refreshToken = uuidv4();

    await this.storeRefreshToken(refreshToken, userId);
    return { accessToken, refreshToken };
  }

  async storeRefreshToken(token: string, userId: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    await this.refreshTokenModel.updateOne(
      { userId },
      { $set: { expiryDate, token } },
      { upsert: true },
    );
  }

  async refreshTokens(refreshToken: string) {
    const token = await this.refreshTokenModel.findOne({
      token: refreshToken,
      expiryDate: { $gte: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException('Refresh Token invalide ou expiré');
    }

    const user = await this.utilisateurModel.findById(token.userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    return this.generateUserTokens(String(token.userId), user.role);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const utilisateur = await this.utilisateurModel.findById(userId);
    if (!utilisateur) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const isMatch = await bcrypt.compare(oldPassword, utilisateur.password);
    if (!isMatch) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }

    utilisateur.password = await bcrypt.hash(newPassword, 10);
    await utilisateur.save();

    return { message: 'Mot de passe modifié avec succès' };
  }
}
