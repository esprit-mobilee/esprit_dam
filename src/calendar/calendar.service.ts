import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import * as ics from 'ics';
import { google, calendar_v3 } from 'googleapis';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private calendar: calendar_v3.Calendar | null = null;

  constructor(
    private configService: ConfigService,
    private emailService: EmailService
  ) {
    this.initializeGoogleCalendar();
  }

  private initializeGoogleCalendar() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const refreshToken = this.configService.get<string>('GOOGLE_REFRESH_TOKEN');

    if (clientId && clientSecret && refreshToken) {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      this.logger.log('✅ Google Calendar API initialized successfully');
    } else {
      this.logger.warn('⚠️ Google API keys missing. Running in MOCK mode.');
    }
  }

  /**
   * Schedule an interview event (REAL GOOGLE MEET)
   */
  async scheduleInterview(
    studentEmail: string,
    studentName: string,
    scheduledAt: Date,
    duration: number, // in minutes
    notes?: string,
  ): Promise<{ eventId: string; meetingLink: string }> {
    try {
      // Fallback to mock if API is not configured
      if (!this.calendar) {
        return this.scheduleInterviewMock(studentEmail, studentName, scheduledAt, duration, notes);
      }

      this.logger.log(`📅 Scheduling Google Meet for ${studentName}...`);

      const startTime = new Date(scheduledAt);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const eventRequest: calendar_v3.Schema$Event = {
        summary: `Entretien de stage - ${studentName}`,
        description: `Entretien avec ${studentName}.\n\nNotes: ${notes || 'Aucune'}\n\nLien Meet généré automatiquement.`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Africa/Tunis',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Africa/Tunis',
        },
        attendees: [
          { email: studentEmail },
        ],
        conferenceData: {
          createRequest: {
            requestId: `interview-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventRequest,
        conferenceDataVersion: 1, // Crucial for generating the link!
        sendUpdates: 'none', // We send our own custom email
      });

      const meetingLink = response.data.hangoutLink;
      const eventId = response.data.id;

      if (!meetingLink) {
        this.logger.warn('Event created but no Meet link returned.');
      }

      this.logger.log(`✅ Interview scheduled! Link: ${meetingLink}`);

      // Send custom email
      try {
        await this.emailService.sendInterviewEmail(
          studentEmail,
          studentName,
          scheduledAt,
          duration,
          meetingLink || 'Lien à venir',
          notes
        );
        this.logger.log(`📧 Email sent to ${studentEmail}`);
      } catch (emailError) {
        this.logger.error(`Failed to send email to ${studentEmail}`, emailError);
      }

      return {
        eventId: eventId || '',
        meetingLink: meetingLink || '',
      };

    } catch (error) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        // Log detailed Google API error
        const googleError = error as any;
        this.logger.error('Google Calendar API Error:', googleError.response?.data);
      }
      this.logger.error('Error scheduling real interview', error);

      // Fallback to mock if real fails (optional, but good for stability)
      this.logger.warn('Falling back to MOCK scheduling due to error.');
      return this.scheduleInterviewMock(studentEmail, studentName, scheduledAt, duration, notes);
    }
  }

  /**
   * Cancel an interview event
   */
  async cancelInterview(eventId: string): Promise<void> {
    try {
      if (!this.calendar || eventId.startsWith('mock_')) {
        this.logger.log(`🗑️  [MOCK] Interview cancelled: ${eventId}`);
        return;
      }

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });

      this.logger.log(`🗑️  Interview cancelled: ${eventId}`);
    } catch (error) {
      this.logger.error('Error cancelling interview', error);
      // Don't throw if it's already gone
    }
  }

  /**
   * Update an interview event
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
      if (!this.calendar || eventId.startsWith('mock_')) {
        return this.updateInterviewMock(eventId, studentEmail, studentName, scheduledAt, duration, notes);
      }

      this.logger.log(`✏️  Updating interview: ${eventId}`);

      const startTime = new Date(scheduledAt);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const response = await this.calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: {
          start: { dateTime: startTime.toISOString(), timeZone: 'Africa/Tunis' },
          end: { dateTime: endTime.toISOString(), timeZone: 'Africa/Tunis' },
          description: `Entretien avec ${studentName}.\n\nNotes: ${notes || 'Aucune'}\n\nLien Meet généré automatiquement.`,
        },
        sendUpdates: 'all',
      });

      return {
        eventId,
        meetingLink: response.data.hangoutLink || '',
      };

    } catch (error) {
      this.logger.error('Error updating interview', error);
      throw error;
    }
  }

  // ========== MOCK METHODS ==========

  private async scheduleInterviewMock(
    studentEmail: string,
    studentName: string,
    scheduledAt: Date,
    duration: number,
    notes?: string,
  ): Promise<{ eventId: string; meetingLink: string }> {
    const eventId = `mock_event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const meetingLink = `https://meet.google.com/mock-${Math.random().toString(36).substring(2, 11)}`;

    this.logger.log('📅 [MOCK] Interview scheduled (Fallback/Mock mode)');
    this.logger.log(`   Meeting Link: ${meetingLink}`);

    try {
      await this.emailService.sendInterviewEmail(
        studentEmail,
        studentName,
        scheduledAt,
        duration,
        meetingLink,
        notes
      );
    } catch (emailError) {
      this.logger.error(`Failed to send email to ${studentEmail}`, emailError);
    }

    return {
      eventId,
      meetingLink,
    };
  }

  private async updateInterviewMock(
    eventId: string,
    studentEmail: string,
    studentName: string,
    scheduledAt: Date,
    duration: number,
    notes?: string,
  ): Promise<{ eventId: string; meetingLink: string }> {
    this.logger.log(`✏️  [MOCK] Interview updated: ${eventId}`);
    return {
      eventId,
      meetingLink: `https://meet.google.com/mock-updated`,
    };
  }

  // ========== EXISTING ICS METHODS ==========

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
        ],
      };

      const { error, value } = ics.createEvent(event);
      if (error) throw error;
      return value || '';
    } catch (error) {
      throw error;
    }
  }

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
    const icsContent = await this.generateEventICS(eventDetails);
    await this.emailService.sendEventInvitationEmail(
      recipientEmail,
      recipientName,
      eventDetails,
      icsContent
    );
  }

  private dateToArray(date: Date): [number, number, number, number, number] {
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
    ];
  }
}
