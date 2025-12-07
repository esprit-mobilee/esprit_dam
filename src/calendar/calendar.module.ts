import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    ConfigModule,
    EmailModule // <-- Ajout de l'import EmailModule
  ],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
