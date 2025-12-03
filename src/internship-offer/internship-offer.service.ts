import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  InternshipOffer,
  InternshipOfferDocument,
} from './schemas/internship-offer.schema';
import { CreateInternshipOfferDto } from './dto/create-internship-offer.dto';
import { UpdateInternshipOfferDto } from './dto/update-internship-offer.dto';

@Injectable()
export class InternshipOfferService {
  constructor(
    @InjectModel(InternshipOffer.name)
    private readonly offerModel: Model<InternshipOfferDocument>,
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
    return created.save();
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
    return this.offerModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
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

    return this.offerModel
      .findOneAndUpdate({ title: regex }, { $set: dto }, { new: true })
      .exec();
  }

  // ==========================================================
  // =                        DELETE                          =
  // ==========================================================
  async delete(id: string): Promise<boolean> {
    const res = await this.offerModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}
