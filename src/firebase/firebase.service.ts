// src/firebase/firebase.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);

    onModuleInit() {
        // Initialiser Firebase Admin SDK
        if (!admin.apps.length) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    }),
                });
                this.logger.log('✅ Firebase Admin SDK initialisé avec succès');
            } catch (error) {
                this.logger.error('❌ Erreur initialisation Firebase:', error.message);
            }
        }
    }

    /**
     * Envoyer une notification à un token FCM spécifique
     */
    async sendNotification(
        fcmToken: string,
        title: string,
        body: string,
        data?: Record<string, string>,
    ): Promise<boolean> {
        try {
            const message: admin.messaging.Message = {
                notification: {
                    title,
                    body,
                },
                data: data || {},
                token: fcmToken,
            };

            const response = await admin.messaging().send(message);
            this.logger.log(`✅ Notification envoyée avec succès: ${response}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Erreur envoi notification: ${error.message}`);
            return false;
        }
    }

    /**
     * Envoyer une notification à plusieurs tokens
     */
    async sendMulticastNotification(
        fcmTokens: string[],
        title: string,
        body: string,
        data?: Record<string, string>,
    ): Promise<number> {
        try {
            const message: admin.messaging.MulticastMessage = {
                notification: {
                    title,
                    body,
                },
                data: data || {},
                tokens: fcmTokens,
            };

            const response = await admin.messaging().sendEachForMulticast(message);
            this.logger.log(
                `✅ ${response.successCount}/${fcmTokens.length} notifications envoyées`,
            );
            return response.successCount;
        } catch (error) {
            this.logger.error(`❌ Erreur envoi multicast: ${error.message}`);
            return 0;
        }
    }

    /**
     * Nouvelle offre de stage - Notifier tous les étudiants
     */
    async sendNewInternshipNotification(
        fcmTokens: string[],
        internshipTitle: string,
        company: string,
        internshipId: string,
    ): Promise<number> {
        return this.sendMulticastNotification(
            fcmTokens,
            '🎯 Nouvelle offre de stage',
            `${internshipTitle} chez ${company}`,
            {
                type: 'new_internship',
                internshipId,
            },
        );
    }

    /**
     * Changement de statut de candidature
     */
    async sendApplicationStatusNotification(
        fcmToken: string,
        status: string,
        internshipTitle: string,
        applicationId: string,
    ): Promise<boolean> {
        const statusEmoji = {
            accepted: '✅',
            rejected: '❌',
            pending: '⏳',
        };

        const statusText = {
            accepted: 'acceptée',
            rejected: 'refusée',
            pending: 'en attente',
        };

        return this.sendNotification(
            fcmToken,
            `${statusEmoji[status] || '📋'} Statut de candidature`,
            `Votre candidature pour "${internshipTitle}" a été ${statusText[status] || 'mise à jour'}`,
            {
                type: 'application_status',
                applicationId,
                status,
            },
        );
    }

    /**
     * Rappel d'entretien
     */
    async sendInterviewReminderNotification(
        fcmToken: string,
        internshipTitle: string,
        interviewDate: string,
    ): Promise<boolean> {
        return this.sendNotification(
            fcmToken,
            '📅 Rappel d\'entretien',
            `Entretien pour "${internshipTitle}" le ${interviewDate}`,
            {
                type: 'interview_reminder',
                internshipTitle,
                interviewDate,
            },
        );
    }
}
