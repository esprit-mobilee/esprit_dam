import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  InternshipOffer,
  InternshipOfferDocument,
} from './schemas/internship-offer.schema';
import { CreateInternshipOfferDto } from './dto/create-internship-offer.dto';
import { UpdateInternshipOfferDto } from './dto/update-internship-offer.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class InternshipOfferService {
  constructor(
    @InjectModel(InternshipOffer.name)
    private readonly offerModel: Model<InternshipOfferDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) { }

  // ==========================================================
  // =                        CREATE                          =
  // ==========================================================
  async create(dto: CreateInternshipOfferDto): Promise<InternshipOffer> {
    // Build location object if coordinates are provided
    let location: { address?: string; latitude?: number; longitude?: number } | undefined = undefined;
    if (dto.location || dto.latitude !== undefined || dto.longitude !== undefined) {
      location = {
        address: dto.location,
        latitude: dto.latitude,
        longitude: dto.longitude,
      };
    }

    const { latitude, longitude, ...dtoWithoutCoords } = dto;
    const created = new this.offerModel({
      ...dtoWithoutCoords,
      location,
    });
    const savedOffer = await created.save();

    // 🔔 Create and broadcast notification
    try {
      const message = `Une nouvelle offre de stage est disponible: ${savedOffer.title} chez ${savedOffer.company}`;
      const notification = await this.notificationsService.create(
        NotificationType.INTERNSHIP_CREATED,
        message,
        { internshipOfferId: (savedOffer._id as any).toString() }
      );

      // Broadcast to all connected users
      this.notificationsGateway.broadcastNotification({
        ...notification.toObject(),
        internshipOffer: savedOffer,
      });
    } catch (error) {
      console.error('❌ Failed to send create notification:', error);
    }

    return savedOffer;
  }

  // ==========================================================
  // =                        FIND ALL                        =
  // ==========================================================
  async findAll(): Promise<InternshipOffer[]> {
    return this.offerModel.find().sort({ createdAt: -1 }).exec();
  }

  // ==========================================================
  // =                        FIND ONE                        =
  // ==========================================================
  async findOne(id: string): Promise<InternshipOffer | null> {
    return this.offerModel.findById(id).exec();
  }

    // ==========================================================
  // =                        UPDATE BY ID                    =
  // ==========================================================
  async update(
    id: string,
    dto: UpdateInternshipOfferDto,
  ): Promise<InternshipOffer | null> {
  
    // 🛠️ FIX: Transformer la location en objet comme pour le create
    const updateData: any = { ...dto };

    if (dto.location || dto.latitude !== undefined || dto.longitude !== undefined) {
      updateData.location = {
        address: dto.location,
        latitude: dto.latitude,
        longitude: dto.longitude,
      };
      delete updateData.latitude;
      delete updateData.longitude;
    }

    const updated = await this.offerModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (updated) {
      try {
        const message = `L'offre de stage "${updated.title}" a été mise à jour`;
        const notification = await this.notificationsService.create(
          NotificationType.INTERNSHIP_UPDATED,
          message,
          { internshipOfferId: (updated._id as any).toString() }
        );

        this.notificationsGateway.broadcastNotification({
          ...notification.toObject(),
          internshipOffer: updated,
        });
      } catch (error) {
        console.error('❌ Failed to send notification:', error);
      }
    }

    return updated;
  }
  // ==========================================================
  // =                        UPDATE BY TITLE                 =
  // ==========================================================
  async updateByTitle(
    title: string,
    dto: UpdateInternshipOfferDto,
  ): Promise<InternshipOffer | null> {

    const clean = title.trim();

    // regex insensible à la casse + correspondance exacte
    const regex = new RegExp(
      `^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      'i',
    );

    const updated = await this.offerModel
      .findOneAndUpdate({ title: regex }, { $set: dto }, { new: true })
      .exec();

    if (updated) {
      // 🔔 Create and broadcast notification
      const message = `L'offre de stage "${updated.title}" a été mise à jour`;
      const notification = await this.notificationsService.create(
        NotificationType.INTERNSHIP_UPDATED,
        message,
        { internshipOfferId: (updated._id as any).toString() }
      );

      this.notificationsGateway.broadcastNotification({
        ...notification.toObject(),
        internshipOffer: updated,
      });
    }

    return updated;
  }

  // ==========================================================
  // =                        DELETE                          =
  // ==========================================================
  async delete(id: string): Promise<boolean> {
    const deletedOffer = await this.offerModel.findByIdAndDelete(id).exec();

    if (deletedOffer) {
      // 🔔 Create and broadcast notification
      try {
        const message = `L'offre de stage "${deletedOffer.title}" a été supprimée`;
        const notification = await this.notificationsService.create(
          NotificationType.INTERNSHIP_DELETED,
          message,
          { internshipOfferId: (deletedOffer._id as any).toString() }
        );

        this.notificationsGateway.broadcastNotification({
          ...notification.toObject(),
          internshipOffer: deletedOffer,
        });
      } catch (error) {
        console.error('❌ Failed to send delete notification:', error);
      }
    }

    return !!deletedOffer;
  }
}
