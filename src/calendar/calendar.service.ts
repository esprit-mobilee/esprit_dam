import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import * as ics from 'ics';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private configService: ConfigService,
    private emailService: EmailService
  ) {
    this.logger.log('CalendarService initialized in MOCK mode (OAuth not configured)');
  }

  /**
   * Generate .ics file for an event
   */
  async generateEventICS(eventDetails: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    organizerName?: string;
    organizerEmail?: string;
  }): Promise<string> {
    try {
      const start = this.dateToArray(eventDetails.startDate);
      const end = this.dateToArray(eventDetails.endDate);

      const event: ics.EventAttributes = {
        start,
        end,
        title: eventDetails.title,
        description: eventDetails.description,
        location: eventDetails.location || '',
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        organizer: eventDetails.organizerEmail ? {
          name: eventDetails.organizerName || 'ESPRIT Club',
          email: eventDetails.organizerEmail,
        } : undefined,
        alarms: [
          {
            action: 'display',
            description: 'Reminder',
            trigger: { hours: 24, minutes: 0, before: true },
          },
          {
            action: 'display',
            description: 'Reminder',
            trigger: { hours: 0, minutes: 30, before: true },
          },
        ],
      };

      const { error, value } = ics.createEvent(event);

      if (error) {
        this.logger.error('Error generating .ics file', error);
        throw new Error(`Failed to generate .ics file: ${error.message}`);
      }

      if (!value) {
        throw new Error('Failed to generate .ics file: No content generated');
      }

      this.logger.log(`✅ Generated .ics file for event: ${eventDetails.title}`);
      return value;
    } catch (error) {
      this.logger.error('Error in generateEventICS', error);
      throw error;
    }
  }

  /**
   * Send event invitation email with .ics attachment
   */
  async sendEventInvitation(
    recipientEmail: string,
    recipientName: string,
    eventDetails: {
      title: string;
      description: string;
      startDate: Date;
      endDate: Date;
      location?: string;
      organizerName?: string;
      organizerEmail?: string;
    }
  ): Promise<void> {
    try {
      // Generate .ics file
      const icsContent = await this.generateEventICS(eventDetails);

      // Send email with .ics attachment
      await this.emailService.sendEventInvitationEmail(
        recipientEmail,
        recipientName,
        eventDetails,
        icsContent
      );

      this.logger.log(`📧 Event invitation sent to ${recipientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send event invitation to ${recipientEmail}`, error);
      throw error;
    }
  }

  /**
   * Convert Date to ICS date array format [year, month, day, hour, minute]
   */
  private dateToArray(date: Date): [number, number, number, number, number] {
    return [
      date.getFullYear(),
      date.getMonth() + 1, // ICS months are 1-indexed
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
    ];
  }

  // ========== EXISTING INTERVIEW METHODS ==========

  /**
   * Schedule an interview event (MOCK MODE)
   * Returns simulated Google Calendar data without actually creating an event
   */
  async scheduleInterview(
    studentEmail: string,
    studentName: string,
    scheduledAt: Date,
    duration: number,
    notes?: string,
  ): Promise<{ eventId: string; meetingLink: string }> {
    try {
      // Générer un faux eventId unique
      const eventId = `mock_event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // Générer un faux lien Google Meet
      const meetingLink = `https://meet.google.com/mock-${Math.random().toString(36).substring(2, 11)}`;

      this.logger.log('📅 [MOCK] Interview scheduled:');
      this.logger.log(`   Event ID: ${eventId}`);
      this.logger.log(`   Student: ${studentName} (${studentEmail})`);
      this.logger.log(`   Scheduled at: ${scheduledAt.toISOString()}`);
      this.logger.log(`   Duration: ${duration} minutes`);
      this.logger.log(`   Meeting Link: ${meetingLink}`);
      this.logger.log(`   Notes: ${notes || 'N/A'}`);

      // Envoyer un email à l'étudiant
      try {
        await this.emailService.sendInterviewEmail(
          studentEmail,
          studentName,
          scheduledAt,
          duration,
          meetingLink,
          notes
        );
        this.logger.log(`📧 Email sent to ${studentEmail}`);
      } catch (emailError) {
        this.logger.error(`Failed to send email to ${studentEmail}`, emailError);
        // On ne bloque pas la création de l'entretien si l'email échoue
      }

      // Simuler un petit délai
      await new Promise(resolve => setTimeout(resolve, 200));

      return {
        eventId,
        meetingLink,
      };
    } catch (error) {
      this.logger.error('Error in mock scheduling', error);
      throw new Error(`Failed to schedule interview (mock): ${error.message}`);
    }
  }

  /**
   * Cancel an interview event (MOCK MODE)
   */
  async cancelInterview(eventId: string): Promise<void> {
    try {
      this.logger.log(`🗑️  [MOCK] Interview cancelled: ${eventId}`);
      // Simuler un délai
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      this.logger.error('Error in mock cancellation', error);
      throw new Error(`Failed to cancel interview (mock): ${error.message}`);
    }
  }

  /**
   * Update an interview event (MOCK MODE)
   */
  async updateInterview(
    eventId: string,
    studentEmail: string,
    studentName: string,
    scheduledAt: Date,
    duration: number,
    notes?: string,
  ): Promise<{ eventId: string; meetingLink: string }> {
    try {
      // Générer un nouveau lien Meet
      const meetingLink = `https://meet.google.com/mock-${Math.random().toString(36).substring(2, 11)}`;

      this.logger.log(`✏️  [MOCK] Interview updated: ${eventId}`);
      this.logger.log(`   New scheduled time: ${scheduledAt.toISOString()}`);
      this.logger.log(`   New meeting link: ${meetingLink}`);

      await new Promise(resolve => setTimeout(resolve, 150));

      return {
        eventId,
        meetingLink,
      };
    } catch (error) {
      this.logger.error('Error in mock update', error);
      throw new Error(`Failed to update interview (mock): ${error.message}`);
    }
  }

  /**
   * Get interview details (MOCK MODE)
   */
  async getInterviewDetails(eventId: string): Promise<any> {
    try {
      this.logger.log(`📖 [MOCK] Fetching interview details: ${eventId}`);

      return {
        id: eventId,
        summary: 'Mock Interview',
        status: 'confirmed',
        htmlLink: `https://calendar.google.com/calendar/event?eid=${eventId}`,
        hangoutLink: `https://meet.google.com/mock-meeting`,
      };
    } catch (error) {
      this.logger.error('Error fetching mock interview', error);
      throw new Error(`Failed to fetch interview (mock): ${error.message}`);
    }
  }
}
