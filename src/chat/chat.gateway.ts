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
import { ChatService } from './chat.service';
import { UtilisateursService } from 'src/utilisateurs/utilisateurs.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly usersService: UtilisateursService
    ) { }

    async handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            await this.usersService.updateStatus(userId, true);
            client.join(userId); // Join private room
            console.log(`User ${userId} connected`);

            // Broadcast status
            this.server.emit('userStatus', { userId, isOnline: true });
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            await this.usersService.updateStatus(userId, false);
            console.log(`User ${userId} disconnected`);

            // Broadcast status
            this.server.emit('userStatus', { userId, isOnline: false, lastSeen: new Date() });
        }
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(
        @MessageBody() data: { clubId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const room = `club_${data.clubId}`;
        client.join(room);
        console.log(`Client ${client.id} joined ${room}`);
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(
        @MessageBody() data: { clubId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const room = `club_${data.clubId}`;
        client.leave(room);
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(@MessageBody() data: any) {
        // data: { clubId?, senderId, content, type, recipientId? }
        const message = await this.chatService.createMessage(data);

        if (message.recipientId) {
            // Private Message
            const recipientRoom = message.recipientId.toString();
            const senderRoom = message.senderId.id.toString(); // Sender also needs to receive it if they have multiple devices or just for confirm

            this.server.to(recipientRoom).emit('privateMessage', message);
            // Also emit to sender (so they see it in their list if they sent it from another device, or just ack)
            this.server.to(senderRoom).emit('privateMessage', message);
        } else {
            // Club Message
            this.server.to(`club_${data.clubId}`).emit('newMessage', message);
        }
    }

    @SubscribeMessage('typing')
    handleTyping(@MessageBody() data: { clubId: string; userId: string; isTyping: boolean }) {
        this.server.to(`club_${data.clubId}`).emit('typingStatus', data);
    }

    @SubscribeMessage('addReaction')
    async handleReaction(@MessageBody() data: { messageId: string; userId: string; emoji: string }) {
        const updatedMessage = await this.chatService.addReaction(data.messageId, data.userId, data.emoji);
        if (!updatedMessage) return;

        if (updatedMessage.clubId) {
            this.server.to(`club_${updatedMessage.clubId}`).emit('messageUpdated', updatedMessage);
        } else if (updatedMessage.recipientId) {
            this.server.to(updatedMessage.recipientId.toString()).emit('messageUpdated', updatedMessage);
            this.server.to(updatedMessage.senderId.toString()).emit('messageUpdated', updatedMessage);
        }
    }

    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(@MessageBody() data: { messageId: string; userId: string; clubId?: string }) {
        const updatedMessage = await this.chatService.markAsRead(data.messageId, data.userId);
        if (updatedMessage && data.clubId) {
            this.server.to(`club_${data.clubId}`).emit('messageUpdated', updatedMessage);
            // Also emit 'messageRead' for specific optimization if needed
            this.server.to(`club_${data.clubId}`).emit('messageRead', { messageId: data.messageId, userId: data.userId });
        }
    }

    @SubscribeMessage('editMessage')
    async handleEditMessage(@MessageBody() data: { messageId: string; userId: string; content: string }) {
        const updated = await this.chatService.editMessage(data.messageId, data.userId, data.content);
        if (updated) {
            if (updated.clubId) {
                this.server.to(`club_${updated.clubId}`).emit('messageUpdated', updated);
            } else if (updated.recipientId) {
                this.server.to(updated.recipientId.toString()).emit('messageUpdated', updated);
                this.server.to(updated.senderId.toString()).emit('messageUpdated', updated);
            }
        }
    }

    @SubscribeMessage('deleteMessage')
    async handleDeleteMessage(@MessageBody() data: { messageId: string; userId: string }) {
        const deleted = await this.chatService.deleteMessage(data.messageId, data.userId);
        if (deleted) {
            if (deleted.clubId) {
                this.server.to(`club_${deleted.clubId}`).emit('messageDeleted', { messageId: data.messageId });
            } else if (deleted.recipientId) {
                this.server.to(deleted.recipientId.toString()).emit('messageDeleted', { messageId: data.messageId });
                this.server.to(deleted.senderId.toString()).emit('messageDeleted', { messageId: data.messageId });
            }
        }
    }
}
