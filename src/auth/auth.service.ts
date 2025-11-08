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
  // 📝 SIGNUP - Inscription
  // ----------------------------
  async signUp(signupData: SignupDto) {
    const { email, password, name, role, studentId, identifiant } = signupData;

    // vérifier email
    const emailInUse = await this.utilisateurModel.findOne({ email });
    if (emailInUse) {
      throw new BadRequestException('Email déjà utilisé');
    }

    // vérifier identifiant (c’est ce que l’app Android utilise pour login)
    const identifiantInUse = await this.utilisateurModel.findOne({ identifiant });
    if (identifiantInUse) {
      throw new BadRequestException('Identifiant déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.utilisateurModel.create({
      identifiant,
      firstName: name,
      lastName: '',
      email,
      password: hashedPassword,
      age: 0,
      studentId: studentId ?? '', // vide pour parent
      role: role ?? Role.User,
    });

    return { message: 'Utilisateur créé avec succès', userId: newUser._id };
  }

  // ----------------------------
  // 🔐 LOGIN - Authentification
  // ----------------------------
  async login(credentials: LoginDto) {
    const { identifiant, password } = credentials;

    // chercher par identifiant OU email OU matricule
    const utilisateur = await this.utilisateurModel.findOne({
      $or: [
        { identifiant }, // nouveau champ
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
    return {
      ...tokens,
      userId,
      role: utilisateur.role,
      email: utilisateur.email,
      message: 'Connexion réussie',
    };
  }

  // ----------------------------
  // 🎟️ GÉNÉRATION DES TOKENS JWT
  // ----------------------------
  async generateUserTokens(userId: string, role: Role) {
    const accessToken = this.jwtService.sign({ userId, role }, { expiresIn: '10h' });
    const refreshToken = uuidv4();

    await this.storeRefreshToken(refreshToken, userId);
    return { accessToken, refreshToken };
  }

  // ----------------------------
  // 💾 SAUVEGARDE DU REFRESH TOKEN
  // ----------------------------
  async storeRefreshToken(token: string, userId: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3); // expire dans 3 jours

    await this.refreshTokenModel.updateOne(
      { userId },
      { $set: { expiryDate, token } },
      { upsert: true },
    );
  }

  // ----------------------------
  // ♻️ REFRESH TOKENS
  // ----------------------------
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

  // ----------------------------
  // 🔑 CHANGE PASSWORD
  // ----------------------------
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
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
