import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-tokens.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthenticationGuard } from './guards/authentication.guard';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // Signup (public)
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un nouveau compte utilisateur (Public)' })
  @ApiResponse({ status: 201, description: 'Utilisateur cree avec succes.' })
  @ApiResponse({
    status: 400,
    description: 'Identifiant ou email deja utilise / donnees invalides.',
  })
  async signUp(@Body() signupDto: SignupDto) {
    return this.authService.signUp(signupDto);
  }

  // Login (public)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion utilisateur avec identifiant (aucun login par email)' })
  @ApiBody({
    schema: {
      example: {
        identifiant: 'robo-clb4912',
        password: 'ProvidedByAdmin123',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Connexion reussie -> retourne le token JWT.',
  })
  @ApiResponse({
    status: 400,
    description: 'Requete invalide -> identifiant ou mot de passe manquant.',
  })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Refresh tokens
  @Post('refresh-tokens')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraichir les tokens JWT (Public)' })
  @ApiResponse({ status: 200, description: 'Nouveaux tokens generes avec succes.' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expire.' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  // Current user
  @Get('me')
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Recuperer le profil utilisateur connecte' })
  async me(@Req() req: any) {
    return this.authService.me(req.user.userId);
  }

  // -------------------------------------------------------
  // FORGOT PASSWORD
  // -------------------------------------------------------

  @Post('forgot-password')
  @ApiOperation({ summary: 'Demander un code de réinitialisation de mot de passe par email' })
  @ApiBody({ schema: { example: { email: 'student@esprit.tn' } } })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('verify-code')
  @ApiOperation({ summary: 'Vérifier la validité du code reçu par email' })
  @ApiBody({ schema: { example: { email: 'student@esprit.tn', code: '123456' } } })
  async verifyCode(@Body('email') email: string, @Body('code') code: string) {
    return this.authService.verifyResetCode(email, code);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec le code (Update Password)' })
  @ApiBody({ schema: { example: { email: 'student@esprit.tn', code: '123456', newPassword: 'NewPass123' } } })
  async resetPassword(
    @Body('email') email: string,
    @Body('code') code: string,
    @Body('newPassword') newPass: string
  ) {
    return this.authService.resetPassword(email, code, newPass);
  }
}