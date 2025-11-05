import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { Utilisateur, UtilisateurSchema } from 'src/utilisateurs/schemas/utilisateur.schema';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // ✅ Passport for authentication strategy
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // ✅ JWT module configured dynamically from .env
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret, // from .env → JWT_SECRET
      signOptions: {
        expiresIn: jwtConstants.expiresIn as any, // 👈 FIX: cast as `StringValue`
      },
    }),

    // ✅ Mongoose Schemas
    MongooseModule.forFeature([
      { name: Utilisateur.name, schema: UtilisateurSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],

  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],

  // ✅ Exported for use in other modules
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
