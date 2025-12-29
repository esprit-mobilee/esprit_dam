import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // Configuration Gmail (ou autre service)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'messaoudmay6@gmail.com',
        pass: 'uzaa bclv vggj wqmy'
      },
      family: 4
    } as any);
  }

  async sendAcceptanceEmail(
    studentEmail: string,
    studentName: string,
    internshipTitle: string
  ) {
    const mailOptions = {
      from: 'messaoudmay6@gmail.com',
      to: studentEmail,
      subject: '✅ Candidature Acceptée - ' + internshipTitle,
      html: `
        <h2>Félicitations ${studentName} !</h2>
        <p>Votre candidature pour le stage <strong>${internshipTitle}</strong> a été acceptée.</p>
        <p>Nous vous contacterons prochainement pour les prochaines étapes.</p>
        <br>
        <p>Cordialement,<br>L'équipe Esprit</p>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendClubAcceptanceEmail(
    studentEmail: string,
    studentName: string,
    clubName: string
  ) {
    const mailOptions = {
      from: 'messaoudmay6@gmail.com',
      to: studentEmail,
      subject: '✅ Demande d\'adhésion acceptée - ' + clubName,
      html: `
        <h2>Félicitations ${studentName} !</h2>
        <p>Votre demande pour rejoindre le club <strong>${clubName}</strong> a été acceptée.</p>
        <p>Vous êtes maintenant membre du club et pouvez accéder à toutes les activités.</p>
        <br>
        <p>Cordialement,<br>L'équipe ${clubName}</p>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendClubRejectionEmail(
    studentEmail: string,
    studentName: string,
    clubName: string
  ) {
    const mailOptions = {
      from: 'messaoudmay6@gmail.com',
      to: studentEmail,
      subject: '❌ Demande d\'adhésion refusée - ' + clubName,
      html: `
        <h2>Bonjour ${studentName},</h2>
        <p>Nous vous remercions pour votre intérêt pour le club <strong>${clubName}</strong>.</p>
        <p>Malheureusement, nous ne pouvons pas donner suite à votre demande d'adhésion pour le moment.</p>
        <p>Nous vous encourageons à postuler à d'autres clubs.</p>
        <br>
        <p>Cordialement,<br>L'équipe ${clubName}</p>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendRejectionEmail(
    studentEmail: string,
    studentName: string,
    internshipTitle: string
  ) {
    const mailOptions = {
      from: 'messaoudmay6@gmail.com',
      to: studentEmail,
      subject: '❌ Candidature Refusée - ' + internshipTitle,
      html: `
        <h2>Bonjour ${studentName},</h2>
        <p>Nous vous remercions pour votre candidature au stage <strong>${internshipTitle}</strong>.</p>
        <p>Malheureusement, nous ne pouvons pas donner suite à votre candidature pour le moment.</p>
        <p>Nous vous encourageons à postuler à d'autres offres.</p>
        <br>
        <p>Cordialement,<br>L'équipe Esprit</p>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  // NOUVELLE MÉTHODE POUR L'ENTRETIEN
  async sendInterviewEmail(
    studentEmail: string,
    studentName: string,
    scheduledAt: Date,
    duration: number,
    meetingLink: string,
    notes?: string
  ) {
    const mailOptions = {
      from: 'messaoudmay6@gmail.com',
      to: studentEmail,
      subject: `📅 Entretien de stage planifié - ${scheduledAt.toLocaleDateString('fr-FR')}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #2E7D32;">Entretien planifié ✅</h2>
          <p>Bonjour <strong>${studentName}</strong>,</p>
          <p>Votre entretien pour le stage a été planifié.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Date :</strong> ${scheduledAt.toLocaleDateString('fr-FR')}</p>
            <p><strong>🕒 Heure :</strong> ${scheduledAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>⏱️ Durée :</strong> ${duration} minutes</p>
            <p><strong>📝 Notes :</strong> ${notes || 'Aucune note particulière'}</p>
          </div>

          <p style="text-align: center;">
            <a href="${meetingLink}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Rejoindre la réunion Google Meet
            </a>
          </p>
          
          <p style="font-size: 12px; color: #666; margin-top: 30px;">
            Ceci est un email automatique, merci de ne pas répondre.
          </p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }
  // NOUVELLE MÉTHODE POUR PASSWORD RESET
  async sendPasswordResetEmail(email: string, code: string, name: string) {
    const mailOptions = {
      from: 'messaoudmay6@gmail.com',
      to: email,
      subject: '🔑 Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #D32F2F;">Réinitialisation de mot de passe</h2>
          <p>Bonjour <strong>${name}</strong>,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Voici votre code de vérification :</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">${code}</span>
          </div>

          <p>Ce code est valable pour 15 minutes.</p>
          <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
          
          <p style="font-size: 12px; color: #666; margin-top: 30px;">
            Ceci est un email automatique, merci de ne pas répondre.
          </p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  // EVENT EMAILS
  async sendEventAcceptanceEmail(email: string, name: string, eventTitle: string) {
    const mailOptions = {
      from: 'messaoudmay6@gmail.com',
      to: email,
      subject: `✅ Inscription confirmée - ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #2E7D32;">Félicitations ${name} !</h2>
          <p>Votre demande de participation à l'événement <strong>${eventTitle}</strong> a été <span style="color: #2E7D32; font-weight: bold;">ACCEPTÉE</span>.</p>
          <p>Nous avons hâte de vous y voir !</p>
          <br>
          <p>Cordialement,<br>L'équipe Organisation</p>
        </div>
      `
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendEventRejectionEmail(email: string, name: string, eventTitle: string) {
    const mailOptions = {
      from: 'messaoudmay6@gmail.com',
      to: email,
      subject: `❌ Mise à jour - ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Bonjour ${name},</h2>
          <p>Nous vous remercions pour votre intérêt pour l'événement <strong>${eventTitle}</strong>.</p>
          <p>Malheureusement, nous ne pouvons pas accepter votre inscription pour le moment (places limitées ou critères non remplis).</p>
          <p>Nous espérons vous voir lors de nos prochains événements.</p>
          <br>
          <p>Cordialement,<br>L'équipe Organisation</p>
        </div>
      `
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendEventInvitationEmail(
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
    },
    icsContent: string
  ) {
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    };

    const mailOptions = {
      from: 'messaoudmay6@gmail.com',
      to: recipientEmail,
      subject: `📅 Confirmation d'inscription - ${eventDetails.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">✅ Inscription confirmée !</h2>
          <p>Bonjour <strong>${recipientName}</strong>,</p>
          <p>Votre inscription à l'événement <strong>${eventDetails.title}</strong> a été enregistrée avec succès.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">📋 Détails de l'événement</h3>
            <p><strong>📅 Date de début :</strong> ${formatDate(eventDetails.startDate)}</p>
            <p><strong>🏁 Date de fin :</strong> ${formatDate(eventDetails.endDate)}</p>
            ${eventDetails.location ? `<p><strong>📍 Lieu :</strong> ${eventDetails.location}</p>` : ''}
            <p><strong>📝 Description :</strong></p>
            <p style="color: #6b7280;">${eventDetails.description}</p>
          </div>

          <div style="background-color: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="margin: 0;"><strong>💡 Astuce :</strong> Un fichier .ics est joint à cet email. Ouvrez-le pour ajouter automatiquement l'événement à votre calendrier (Google Calendar, Apple Calendar, Outlook, etc.).</p>
          </div>

          <p>Nous avons hâte de vous voir !</p>
          <br>
          <p>Cordialement,<br><strong>${eventDetails.organizerName || 'L\'équipe ESPRIT'}</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `${eventDetails.title.replace(/[^a-z0-9]/gi, '_')}.ics`,
          content: icsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
        },
      ],
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendDocumentRequestStatusEmail(
    studentEmail: string,
    studentName: string,
    documentType: string,
    status: string,
    rejectionReason?: string
  ) {
    let subject = '';
    let content = '';

    if (status === 'APPROVED') {
      subject = `✅ Demande de document approuvée - ${documentType}`;
      content = `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #2E7D32;">Bonne nouvelle ${studentName} !</h2>
          <p>Votre demande de document <strong>${documentType}</strong> a été <span style="color: #2E7D32; font-weight: bold;">APPROUVÉE</span>.</p>
          <p>Vous pouvez maintenant télécharger votre document depuis l'application.</p>
          <br>
          <p>Cordialement,<br>L'administration</p>
        </div>
      `;
    } else if (status === 'REJECTED') {
      subject = `❌ Mise à jour de votre demande - ${documentType}`;
      content = `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #D32F2F;">Bonjour ${studentName},</h2>
          <p>Votre demande de document <strong>${documentType}</strong> a été <span style="color: #D32F2F; font-weight: bold;">REFUSÉE</span>.</p>
          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0; color: #b71c1c;"><strong>Raison du refus :</strong></p>
            <p style="margin: 5px 0 0 0;">${rejectionReason || 'Non spécifiée'}</p>
          </div>
          <p>Vous pouvez soumettre une nouvelle demande si nécessaire.</p>
          <br>
          <p>Cordialement,<br>L'administration</p>
        </div>
      `;
    }

    if (subject && content) {
      const mailOptions = {
        from: 'messaoudmay6@gmail.com',
        to: studentEmail,
        subject: subject,
        html: content
      };
      await this.transporter.sendMail(mailOptions);
    }
  }
}
