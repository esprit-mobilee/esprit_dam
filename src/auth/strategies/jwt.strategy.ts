import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { jwtConstants } from '../constants';
import { Utilisateur, UtilisateurDocument } from 'src/utilisateurs/schemas/utilisateur.schema';

type JwtPayload = {
  userId: string;
  identifiant?: string;
  role: string;
  classGroup?: string | null;
  presidentOf?: string | null;
  club?: string | null;
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(Utilisateur.name)
    private readonly utilisateurModel: Model<UtilisateurDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConstants.secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.utilisateurModel.findById(payload.userId).lean();
    if (!user) throw new UnauthorizedException('Utilisateur inexistant');

    return {
      _id: user._id,
      userId: user._id,
      identifiant: user.identifiant,
      name: user.name,
      email: user.email ?? null,
      role: user.role,
      classGroup: user.classGroup ?? null,
      presidentOf: user.presidentOf ?? null,
      club: user.club ?? null,
    };
  }
}
