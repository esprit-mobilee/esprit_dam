import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { Utilisateur, UtilisateurSchema } from 'src/utilisateurs/schemas/utilisateur.schema';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { PasswordReset, PasswordResetSchema } from './schemas/password-reset.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { ClubsModule } from 'src/clubs/clubs.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ✅ allows env vars globally
    }),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    // ✅ Dynamic JWT config via ConfigService
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', jwtConstants.secret),
        signOptions: {
          // ✅ Fix: allow string duration safely
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h') as any,
        },
      }),
    }),

    // ✅ Mongoose models
    MongooseModule.forFeature([
      { name: Utilisateur.name, schema: UtilisateurSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema }, // Added PasswordReset schema
    ]),
    ClubsModule, // Importé pour que RolesGuard puisse utiliser ClubsService
    EmailModule, // ✅ Import EmailModule 

    // ✅ ensures RolesGuard & Auth share ClubsService
  ],

  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService, PassportModule, JwtModule, RolesGuard],
})
export class AuthModule { }
