import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { jwtConstants } from '../constants';
import { Utilisateur, UtilisateurDocument } from 'src/utilisateurs/schemas/utilisateur.schema';

type JwtPayload = {
  userId: string;
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
    // Ce qui sera injecté en request.user
    return {
      _id: user._id,
      email: user.email,
      role: user.role, // ⚠️ Assure-toi que role est bien défini dans le schéma utilisateur
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
