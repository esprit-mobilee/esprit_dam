import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    // No @Roles decorator → allow
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié.');
    }

    const userRole: Role = user.role;

    // ADMIN → always allowed if route expects Admin
    if (userRole === Role.Admin) {
      return true;
    }

    // If route requires the user's role → allow
    if (requiredRoles.includes(userRole)) {
      return true;
    }

    // The guard DOES NOT check for "presidentOf" anymore
    // That is handled in IsPresidentGuard or inside controllers

    throw new ForbiddenException("Accès refusé : rôle insuffisant.");
  }
}
