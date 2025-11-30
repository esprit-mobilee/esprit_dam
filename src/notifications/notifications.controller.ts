import {
    Controller,
    Get,
    Put,
    Delete,
    Param,
    UseGuards,
    Req,
    ForbiddenException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { IsPresidentGuard } from 'src/auth/guards/is-president.guard';
import { Role } from 'src/auth/enums/role.enum';

@Controller('notifications')
@UseGuards(AuthenticationGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    // Get notifications for a club
    @Get('club/:clubId')
    @UseGuards(IsPresidentGuard)
    async getClubNotifications(
        @Param('clubId') clubId: string,
        @Req() req: any,
    ) {
        const user = req.user;

        // Admin can view any club's notifications
        if (user.role === Role.Admin) {
            return this.notificationsService.getClubNotifications(clubId);
        }

        // Club account or president can only view their own notifications
        const managedClubId = user.club ?? user.presidentOf;
        if (String(managedClubId) !== clubId) {
            throw new ForbiddenException(
                'Vous ne pouvez voir que les notifications de votre club.',
            );
        }

        return this.notificationsService.getClubNotifications(clubId);
    }

    // Get unread count for a club
    @Get('club/:clubId/unread-count')
    @UseGuards(IsPresidentGuard)
    async getUnreadCount(@Param('clubId') clubId: string, @Req() req: any) {
        const user = req.user;

        // Admin can view any club's count
        if (user.role === Role.Admin) {
            return { count: await this.notificationsService.getUnreadCount(clubId) };
        }

        // Club account or president can only view their own count
        const managedClubId = user.club ?? user.presidentOf;
        if (String(managedClubId) !== clubId) {
            throw new ForbiddenException(
                'Vous ne pouvez voir que les notifications de votre club.',
            );
        }

        return { count: await this.notificationsService.getUnreadCount(clubId) };
    }

    // Mark notification as read
    @Put(':id/read')
    async markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    // Delete notification
    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.notificationsService.delete(id);
    }
}
