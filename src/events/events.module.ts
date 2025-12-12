import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from './schemas/event.schema';
import { ClubsModule } from 'src/clubs/clubs.module'; // ✅ import added
import { NotificationsModule } from 'src/notifications/notifications.module';
import { EmailModule } from 'src/email/email.module';
import { Club, ClubSchema } from 'src/clubs/schemas/club.schema';
import { Utilisateur, UtilisateurSchema } from 'src/utilisateurs/schemas/utilisateur.schema';
import { CalendarModule } from 'src/calendar/calendar.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Club.name, schema: ClubSchema },
      { name: Utilisateur.name, schema: UtilisateurSchema },
    ]),
    ClubsModule,
    NotificationsModule,
    EmailModule,
    CalendarModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule { }
