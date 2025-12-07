import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Message, MessageSchema } from './schemas/message.schema';

import { UtilisateursModule } from 'src/utilisateurs/utilisateurs.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
        UtilisateursModule,
    ],
    providers: [ChatGateway, ChatService],
    controllers: [ChatController],
    exports: [ChatService], // Export if other modules need to create messages programmatically
})
export class ChatModule { }
