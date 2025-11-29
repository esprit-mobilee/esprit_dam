import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token JWT manquant. Veuillez fournir un token dans l\'en-tête Authorization: Bearer <token>');
    }

    try {
      // ✅ Vérifie avec le JwtService global (utilise automatiquement la config de JwtModule)
      const payload = await this.jwtService.verifyAsync(token);

      // ✅ Vérifie que le payload contient userId
      if (!payload.userId) {
        throw new UnauthorizedException('Token invalide : userId manquant dans le payload');
      }

      // ✅ Injecte les infos dans la requête
      request['user'] = {
        userId: payload.userId,
        role: payload.role || 'user', // Fallback si role n'est pas présent
      };
    } catch (error) {
      // ✅ Meilleure gestion des erreurs
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Log l'erreur pour le debug (en développement)
      if (process.env.NODE_ENV !== 'production') {
        console.error('Erreur de vérification JWT:', error.message);
      }
      
      throw new UnauthorizedException('Token invalide ou expiré. Veuillez vous reconnecter.');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }
    
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
