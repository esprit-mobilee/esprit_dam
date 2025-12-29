import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Client } from '@gradio/client';

export interface AnnouncementVariation {
  title: string;
  audience: string;
  content: string;
}

@Injectable()
export class GradioAiService {
  private client: Client | null = null;
  private readonly GRADIO_URL = process.env.GRADIO_URL || 'http://localhost:7860';

  async connectToGradio(): Promise<void> {
    if (!this.client) {
      try {
        this.client = await Client.connect(this.GRADIO_URL);
      } catch (error) {
        throw new HttpException(
          'Failed to connect to Gradio service',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }
  }

  async generateAnnouncements(
    audience: string,
    instruction: string,
  ): Promise<AnnouncementVariation[]> {
    try {
      await this.connectToGradio();

      if (!this.client) {
        throw new Error('Gradio client not initialized');
      }

      const result = await this.client.predict('/generate_announcements_ui', {
        audience,
        instruction,
      });

      // Parse the JSON string response
      const jsonResponse = result.data as string;
      const announcements = JSON.parse(jsonResponse) as AnnouncementVariation[];

      // Validate response
      if (!Array.isArray(announcements) || announcements.length === 0) {
        throw new Error('Invalid response format from Gradio service');
      }

      // Check for error responses
      if (announcements[0].title === 'ERROR' || announcements[0].title === 'REFUSED') {
        throw new Error(announcements[0].content);
      }

      return announcements;
    } catch (error) {
      throw new HttpException(
        `Announcement generation failed: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * @deprecated Use generateAnnouncements instead. This method is kept for backward compatibility.
   */
  async generateAnnouncement(audience: string, instruction: string): Promise<string> {
    const announcements = await this.generateAnnouncements(audience, instruction);
    return announcements[0]?.content || '';
  }
}
