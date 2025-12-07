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
    } as any); // <--- Ajoutez "as any" ici
  }

  async sendAcceptanceEmail(
    studentEmail: string,
    studentName: string,
    internshipTitle: string
  ) {
    const mailOptions = {
      from: 'messaoudmay6@gmail.com', // ← CHANGÉ ICI
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
      from: 'messaoudmay6@gmail.com', // ← CHANGÉ ICI
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
}