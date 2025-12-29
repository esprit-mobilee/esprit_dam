import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GradioAiService } from './services/gradio-ai.service';
import { Announcement, AnnouncementDocument } from './schemas/announcement.schema';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectModel(Announcement.name)
    private announcementModel: Model<AnnouncementDocument>,
    private gradioAiService: GradioAiService,
  ) {}

  /**
   * Generate 3 AI announcements and save them to database
   */
  async generateAndSave(
    audience: string,
    instruction: string,
    senderId: string,
  ): Promise<Announcement[]> {
    try {
      // Generate 3 variations in a single AI call
      const aiAnnouncements = await this.gradioAiService.generateAnnouncements(
        audience,
        instruction,
      );

      const results: Announcement[] = [];

      // Save each variation to database
      for (const aiAnnouncement of aiAnnouncements) {
        const createAnnouncementDto: CreateAnnouncementDto = {
          title: aiAnnouncement.title,
          content: aiAnnouncement.content,
          audience: aiAnnouncement.audience,
          senderId,
        };

        const announcement = new this.announcementModel(createAnnouncementDto);
        const savedAnnouncement = await announcement.save();
        results.push(savedAnnouncement);
      }

      return results;
    } catch (error) {
      throw new HttpException(
        `Failed to generate and save announcements: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all announcements
   */
  async findAll(): Promise<Announcement[]> {
    return this.announcementModel.find().exec();
  }

  /**
   * Get announcement by ID
   */
  async findOne(id: string): Promise<Announcement> {
    const announcement = await this.announcementModel.findById(id).exec();
    if (!announcement) {
      throw new HttpException('Announcement not found', HttpStatus.NOT_FOUND);
    }
    return announcement;
  }

  /**
   * Delete announcement by ID
   */
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.announcementModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new HttpException('Announcement not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'Announcement deleted successfully' };
  }
}
