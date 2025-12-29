import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnnouncementController } from './announcement.controller';
import { AnnouncementService } from './announcement.service';
import { GradioAiService } from './services/gradio-ai.service';
import { Announcement, AnnouncementSchema } from './schemas/announcement.schema';
import { MailModule } from './services/mail.module'; 

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Announcement.name, schema: AnnouncementSchema },
    ]),
      MailModule, // 👈 TRÈS IMPORTANT
  ],
  controllers: [AnnouncementController],
  providers: [AnnouncementService, GradioAiService],
  exports: [AnnouncementService, GradioAiService],
})
export class AnnouncementModule {}
