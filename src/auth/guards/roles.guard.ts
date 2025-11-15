import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ClubsService } from 'src/clubs/clubs.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly clubsService: ClubsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      // Pas de @Roles sur la route → pas de contrôle particulier
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié.');
    }

    const role: Role = user.role;
    const userId: string = user.userId || user._id?.toString();

    // 👑 Admin → accès complet partout si demandé
    if (role === Role.Admin) {
      if (!requiredRoles.includes(Role.Admin)) {
        throw new ForbiddenException('Accès refusé : rôle insuffisant.');
      }
      return true;
    }

    const baseUrl: string = request.baseUrl || '';

    // 🧑‍💼 Président
    if (role === Role.President) {
      // Cas 1 : routes Clubs → on vérifie qu'il est bien président de ce club
      if (baseUrl.startsWith('/clubs')) {
        const clubId = request.params.clubId || request.params.id;
        if (!clubId) {
          return true; // route non liée à un club spécifique
        }

        const club = await this.clubsService.findOne(clubId);
        if (!club) {
          throw new ForbiddenException('Club introuvable.');
        }

        const presidentId =
          (club.president as any)?._id
            ? (club.president as any)._id.toString()
            : (club.president ?? '').toString();

        if (presidentId !== userId) {
          throw new ForbiddenException(
            "Accès refusé : vous n'êtes pas le président de ce club.",
          );
        }

        // Le président du club a bien accès
        return true;
      }

      // Cas 2 : autres routes (events, internships, etc.)
      if (requiredRoles.includes(Role.President)) {
        // On laisse passer, les restrictions fines (ownership)
        // sont gérées au niveau du controller/service
        return true;
      }

      throw new ForbiddenException('Accès refusé : rôle insuffisant.');
    }

    // 👥 Autres rôles : simple contrôle d'appartenance à requiredRoles
    if (requiredRoles.includes(role)) {
      return true;
    }

    throw new ForbiddenException('Accès refusé : rôle insuffisant.');
  }
}
