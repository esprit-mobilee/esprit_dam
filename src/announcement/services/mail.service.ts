import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Utilise le service de ton choix (ex: Gmail, SendGrid, etc.)
      auth: {
        user: 'sirine.lassili@esprit.tn',  // Ton adresse e-mail
        pass: 'acde ggmi rxtm oeci',     // Ton mot de passe (ou un mot de passe spécifique pour l'API)
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html: string) {
    const mailOptions = {
      from: 'sirine.lassili@esprit.tn', // Ton adresse e-mail
      to,
      subject,
      text,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('E-mail envoyé à ' + to);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail: ', error);
    }
  }

  // Fonction spécifique pour envoyer à une audience ciblée
  async sendMailToAudience(audience: string, announcementContent: string) {
    let subject = 'Annonce Importante';
    let text = announcementContent;
    let html = `<p>${announcementContent}</p>`;

    // Logique pour déterminer les destinataires en fonction de l'audience
    let recipients: string[] = [];

    if (audience === 'students') {
      recipients = ['sirine.lassili@esprit.tn'];  // Exemple de liste d'étudiants
    } else if (audience === 'administration') {
      recipients = ['sirine.lassili@esprit.tn'];  // Exemple de liste d'administrateurs
    } else {
      recipients = ['sirine.lassili@esprit.tn']; // Tous
    }

    for (const recipient of recipients) {
      await this.sendMail(recipient, subject, text, html);
    }
  }
}
