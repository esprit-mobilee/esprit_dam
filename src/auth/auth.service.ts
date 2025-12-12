import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { PasswordReset, PasswordResetDocument } from './schemas/password-reset.schema';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Utilisateur.name)
    private readonly utilisateurModel: Model<UtilisateurDocument>,

    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,

    @InjectModel(PasswordReset.name)
    private readonly passwordResetModel: Model<PasswordResetDocument>,

    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) { }

  // -------------------------------------------------------
  // SIGNUP
  // -------------------------------------------------------
  async signUp(signupData: SignupDto) {
    const {
      email,
      password,
      name,
      role,
      identifiant,
      classGroup,
    } = signupData;

    if (!identifiant?.trim()) {
      throw new BadRequestException("L'identifiant est obligatoire");
    }

    if (email) {
      const emailInUse = await this.utilisateurModel.findOne({ email });
      if (emailInUse) {
        throw new BadRequestException('Email d\u00e9j\u00e0 utilis\u00e9');
      }
    }

    const identifiantInUse = await this.utilisateurModel.findOne({
      identifiant,
    });
    if (identifiantInUse) {
      throw new BadRequestException('Identifiant d\u00e9j\u00e0 utilis\u00e9');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [firstName, ...lastParts] = name.trim().split(' ');
    const lastName = lastParts.join(' ');

    const newUser = await this.utilisateurModel.create({
      identifiant,
      name,
      firstName: firstName || name,
      lastName,
      email,
      password: hashedPassword,
      age: 0,
      classGroup: classGroup ?? null,
      role: role ?? Role.User,
      presidentOf: null, // always null at signup
      club: null,
      clubs: [],
    });

    return { message: 'Utilisateur cr\u00e9\u00e9 avec succ\u00e8s', userId: String(newUser._id) };
  }

  // -------------------------------------------------------
  // LOGIN
  // -------------------------------------------------------
  async login(credentials: LoginDto) {
    const { identifiant, password } = credentials;

    const utilisateur = await this.validateUser(identifiant, password);

    const tokens = await this.generateUserTokens(utilisateur);

    return {
      ...tokens,
      user: {
        id: String(utilisateur._id),
        identifiant: utilisateur.identifiant,
        name: utilisateur.name,
        email: utilisateur.email ?? null,
        role: utilisateur.role,
        classGroup: utilisateur.classGroup ?? null,
        studentId: utilisateur.studentId ?? null,
        presidentOf: utilisateur.presidentOf ? String(utilisateur.presidentOf) : null,
        club: utilisateur.club ? String(utilisateur.club) : null,
      },
      message: 'Connexion r\u00e9ussie',
    };
  }

  // -------------------------------------------------------
  // USER VALIDATION (IDENTIFIANT ONLY)
  // -------------------------------------------------------
  async validateUser(identifiant: string, password: string) {
    const utilisateur = await this.utilisateurModel.findOne({ identifiant });

    if (!utilisateur) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const passwordMatch = await bcrypt.compare(password, utilisateur.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    return utilisateur;
  }

  // -------------------------------------------------------
  // AUTH /ME
  // -------------------------------------------------------
  async me(userId: string) {
    const user = await this.utilisateurModel.findById(userId).lean();
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    return {
      id: String(user._id),
      identifiant: user.identifiant,
      name: user.name,
      email: user.email ?? null,
      role: user.role,
      classGroup: user.classGroup ?? null,
      studentId: user.studentId ?? null,
      presidentOf: user.presidentOf ? String(user.presidentOf) : null,
      club: user.club ? String(user.club) : null,
    };
  }

  // -------------------------------------------------------
  // TOKENS
  // -------------------------------------------------------
  private buildJwtPayload(user: UtilisateurDocument) {
    return {
      userId: String(user._id),
      identifiant: user.identifiant,
      role: user.role,
      classGroup: user.classGroup ?? null,
      presidentOf: user.presidentOf ? String(user.presidentOf) : null,
      club: user.club ? String(user.club) : null,
    };
  }

  async generateUserTokens(user: UtilisateurDocument) {
    const payload = this.buildJwtPayload(user);
    const accessToken = this.jwtService.sign(payload, { expiresIn: '10h' });
    const refreshToken = uuidv4();

    await this.storeRefreshToken(refreshToken, String(user._id));

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
      throw new UnauthorizedException('Refresh Token invalide ou expir\u00e9');
    }

    const user = await this.utilisateurModel.findById(token.userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    return this.generateUserTokens(user);
  }

  // -------------------------------------------------------
  // CHANGE PASSWORD
  // -------------------------------------------------------
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const utilisateur = await this.utilisateurModel.findById(userId);
    if (!utilisateur) {
      throw new UnauthorizedException('Utilisateur non trouv\u00e9');
    }

    const isMatch = await bcrypt.compare(oldPassword, utilisateur.password);
    if (!isMatch) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }

    utilisateur.password = await bcrypt.hash(newPassword, 10);
    await utilisateur.save();

    return { message: 'Mot de passe modifi\u00e9 avec succ\u00e8s' };
  }
  // -------------------------------------------------------
  // FORGOT PASSWORD
  // -------------------------------------------------------
  async forgotPassword(email: string) {
    const user = await this.utilisateurModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Aucun utilisateur trouvé avec cet email');
    }

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 mins expiry

    // Save code
    await this.passwordResetModel.updateOne(
      { email },
      { code, expiresAt },
      { upsert: true }
    );

    // Send email
    await this.emailService.sendPasswordResetEmail(email, code, user.firstName || user.name);

    return { message: 'Code de vérification envoyé avec succès' };
  }

  async verifyResetCode(email: string, code: string) {
    const record = await this.passwordResetModel.findOne({ email, code });

    if (!record) {
      throw new BadRequestException('Code invalide');
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestException('Code expiré');
    }

    return { message: 'Code valide' };
  }

  async resetPassword(email: string, code: string, newPass: string) {
    // Verify code again
    await this.verifyResetCode(email, code);

    const user = await this.utilisateurModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    // Update password
    // Update password safely (avoid validating entire document)
    const hashedPassword = await bcrypt.hash(newPass, 10);
    await this.utilisateurModel.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    // Delete used code
    await this.passwordResetModel.deleteOne({ email });

    return { message: 'Mot de passe réinitialisé avec succès' };
  }
}
