import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class IsPresidentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user || !user.presidentOf) {
      throw new ForbiddenException(
        'Only club presidents can perform this action',
      );
    }

    return true;
  }
}
