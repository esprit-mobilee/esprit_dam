import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '../enums/role.enum';

@Injectable()
export class IsPresidentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException(
        'Only authenticated club managers can perform this action',
      );
    }

    const isPresident = Boolean(user.presidentOf);
    // ✅ Accepter "CLUB" et "club" (case-insensitive)
    const isClubAccount = user.role?.toUpperCase() === 'CLUB';
    const isAdmin = user.role === Role.Admin;

    console.log('IsPresidentGuard check:', {
      userRole: user.role,
      isPresident,
      isClubAccount,
      isAdmin,
      presidentOf: user.presidentOf,
      club: user.club,
    });

    if (!isPresident && !isClubAccount && !isAdmin) {
      throw new ForbiddenException(
        'Only club presidents or club accounts can perform this action',
      );
    }

    return true;
  }
}