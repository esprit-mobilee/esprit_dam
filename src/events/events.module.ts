import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from './schemas/event.schema';
import { ClubsModule } from 'src/clubs/clubs.module'; // ✅ import added

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    ClubsModule, // ✅ provides access to ClubsService for RolesGuard
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
