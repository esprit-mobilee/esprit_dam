import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers = new Map<string, string>(); // socketId -> userId

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.connectedUsers.set(client.id, userId);
            client.join(`user_${userId}`); // Join user-specific room
            client.join('all_users'); // Join global room for broadcasts
            console.log(`User ${userId} connected to notifications (socket: ${client.id})`);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = this.connectedUsers.get(client.id);
        if (userId) {
            this.connectedUsers.delete(client.id);
            console.log(`User ${userId} disconnected from notifications`);
        }
    }

    // Broadcast notification to all connected users
    broadcastNotification(notification: any) {
        this.server.to('all_users').emit('notification', notification);
        console.log('📢 Broadcasting notification to all users:', notification.message);
    }

    // Send notification to specific user
    sendToUser(userId: string, notification: any) {
        this.server.to(`user_${userId}`).emit('notification', notification);
        console.log(`📧 Sending notification to user ${userId}:`, notification.message);
    }

    // Send notification to multiple users
    sendToUsers(userIds: string[], notification: any) {
        userIds.forEach(userId => {
            this.server.to(`user_${userId}`).emit('notification', notification);
        });
        console.log(`📧 Sending notification to ${userIds.length} users:`, notification.message);
    }
}
