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
      const payload = await this.jwtService.verifyAsync(token);

      request['user'] = {
        userId: payload.userId,
        identifiant: payload.identifiant,
        role: payload.role,
        presidentOf: payload.presidentOf ?? null,
        club: payload.club ?? null,
        classGroup: payload.classGroup ?? null,
      };
    } catch (error) {
      throw new UnauthorizedException('Token invalide ou expire');
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
