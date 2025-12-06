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
}
