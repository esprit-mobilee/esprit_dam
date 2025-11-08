import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-tokens.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 🧾 INSCRIPTION PUBLIQUE
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau compte utilisateur (Public)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès.' })
  @ApiResponse({ status: 400, description: 'Identifiant ou email déjà utilisé / données invalides.' })
  async signUp(@Body() signupDto: SignupDto) {
    return this.authService.signUp(signupDto);
  }

  // 🔐 CONNEXION PUBLIQUE
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion utilisateur avec identifiant (Public)' })
  @ApiResponse({ status: 200, description: 'Connexion réussie — retourne le token JWT.' })
  @ApiResponse({ status: 400, description: 'Requête invalide — identifiant ou mot de passe manquant.' })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects.' })
  async login(@Body() loginDto: LoginDto) {
    // loginDto contient: identifiant + password
    return this.authService.login(loginDto);
  }

  // ♻️ RAFRAÎCHIR LES TOKENS
  @Post('refresh-tokens')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir les tokens JWT (Public)' })
  @ApiResponse({ status: 200, description: 'Nouveaux tokens générés avec succès.' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré.' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }
}
