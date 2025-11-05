import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ClubsService } from 'src/clubs/clubs.service';
import { Types } from 'mongoose';

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
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié.');
    }

    const role: Role = user.role;
    const userId: string = user.userId || user._id?.toString();

    // 👑 Admin → accès complet
    if (role === Role.Admin) return true;

    // 🧑‍💼 Président → accès limité à son club
    if (role === Role.President) {
      const clubId = request.params.clubId || request.params.id;
      if (!clubId) return true; // route non liée à un club spécifique

      const club = await this.clubsService.findOne(clubId);
      if (!club) throw new ForbiddenException('Club introuvable.');

      // 🧩 Récupération propre de l’ID du président
      const presidentId =
        (club.president as any)?._id
          ? (club.president as any)._id.toString()
          : (club.president ?? '').toString();

      // 🧠 Comparaison toujours en string (évite les faux négatifs ObjectId vs string)
      if (presidentId !== userId) {
        throw new ForbiddenException(
          'Accès refusé : vous n’êtes pas le président de ce club.',
        );
      }

      return true;
    }

    // 👥 Autres rôles spécifiques
    if (requiredRoles.includes(role)) return true;

    throw new ForbiddenException('Accès refusé : rôle insuffisant.');
  }
}
