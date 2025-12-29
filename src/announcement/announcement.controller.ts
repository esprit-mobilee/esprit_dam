import { Controller, Post, Body, Get, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnnouncementService } from './announcement.service';
import { MailService } from './services/mail.service'; // Import du service de mail
import { GenerateAnnouncementDto } from './dto/generate-announcement.dto';
import { Announcement } from './schemas/announcement.schema';
import { AnnouncementVariation } from './services/gradio-ai.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { SelectAnnouncementDto } from './dto/select-announcement.dto';
import { ApiBody } from '@nestjs/swagger';

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementController {
  constructor(
    private readonly announcementService: AnnouncementService,
    private readonly mailService: MailService, // Injection du service Mail
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate 3 announcement variations using AI (without saving)' })
  @ApiResponse({ status: 201, description: 'Announcements generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 503, description: 'Gradio service unavailable' })
  async generateAnnouncement(
    @Body() generateAnnouncementDto: GenerateAnnouncementDto,
  ): Promise<{ announcements: AnnouncementVariation[] }> {
    const { audience, instruction } = generateAnnouncementDto;
    const announcements = await this.announcementService['gradioAiService'].generateAnnouncements(
      audience,
      instruction,
    );
    return { announcements };
  }

  @Post('generate-and-save')
  @ApiOperation({ summary: 'Generate 3 AI announcements and save to database' })
  @ApiResponse({ status: 201, description: 'Successfully generated and saved 3 announcements' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 503, description: 'Gradio service unavailable' })
  async generateAndSave(
    @Body() generateAnnouncementDto: GenerateAnnouncementDto & { senderId: string },
  ): Promise<{ announcements: Announcement[] }> {
    const { audience, instruction, senderId } = generateAnnouncementDto;
    const announcements = await this.announcementService.generateAndSave(
      audience,
      instruction,
      senderId,
    );

    // Envoi de l'e-mail après la sauvegarde
    const announcementContent = `Nouvelle annonce générée : ${announcements[0].title} - ${announcements[0].content}`;
    await this.mailService.sendMailToAudience(audience, announcementContent); // Envoi de l'email à l'audience ciblée

    return { announcements };
  }

  @Get()
  @ApiOperation({ summary: 'Get all announcements' })
  @ApiResponse({ status: 200, description: 'List of all announcements' })
  async findAll(): Promise<{ announcements: Announcement[] }> {
    const announcements = await this.announcementService.findAll();
    return { announcements };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement by ID' })
  @ApiResponse({ status: 200, description: 'Announcement found' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async findOne(@Param('id') id: string): Promise<{ announcement: Announcement }> {
    const announcement = await this.announcementService.findOne(id);
    return { announcement };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete announcement by ID' })
  @ApiResponse({ status: 200, description: 'Announcement deleted successfully' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.announcementService.remove(id);
  }

  @Post('generate-select-save')
  @ApiOperation({ summary: 'Generate 3 AI announcements, let user select 1, then save it' })
  @ApiResponse({ status: 201, description: 'Selected announcement saved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or invalid selection index' })
  @ApiResponse({ status: 503, description: 'Gradio service unavailable' })
  async generateSelectSave(
    @Body() body: SelectAnnouncementDto,  // 👈 ici on passe le DTO
  ): Promise<Announcement> {
    const { audience, instruction, senderId, selectedIndex } = body;

    const aiAnnouncements = await this.announcementService['gradioAiService'].generateAnnouncements(
      audience,
      instruction,
    );

    if (selectedIndex < 0 || selectedIndex >= aiAnnouncements.length) {
      throw new HttpException('Invalid selection index', HttpStatus.BAD_REQUEST);
    }

    const selected = aiAnnouncements[selectedIndex];
    const createDto: CreateAnnouncementDto = {
      title: selected.title,
      content: selected.content,
      audience: selected.audience,
      senderId,
    };

    const announcement = new this.announcementService['announcementModel'](createDto);
    await announcement.save();

    // Envoi de l'email après la sauvegarde de l'annonce
    const announcementContent = `Annonce sélectionnée : ${selected.title} - ${selected.content}`;
    await this.mailService.sendMailToAudience(audience, announcementContent);

    return announcement;
  }
  @Post('send-email')
@ApiOperation({ summary: 'Send announcement email to audience' })
@ApiResponse({ status: 201, description: 'Email sent successfully' })
async sendEmailToAudience(
  @Body() body: { audience: string; title: string; content: string }
): Promise<{ message: string }> {

  const { audience, title, content } = body;

  await this.mailService.sendMailToAudience(
    audience,
    `${title}\n\n${content}`
  );

  return { message: 'Email envoyé avec succès' };
}

}
