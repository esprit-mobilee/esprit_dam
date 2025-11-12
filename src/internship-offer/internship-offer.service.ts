// src/internship-offers/internship-offer.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InternshipOffer, InternshipOfferDocument } from './schemas/internship-offer.schema';
import { CreateInternshipOfferDto } from './dto/create-internship-offer.dto';
import { UpdateInternshipOfferDto } from './dto/update-internship-offer.dto';

@Injectable()
export class InternshipOfferService {
  constructor(
    @InjectModel(InternshipOffer.name)
    private readonly offerModel: Model<InternshipOfferDocument>,
  ) {}

  async create(dto: CreateInternshipOfferDto): Promise<InternshipOffer> {
    const created = new this.offerModel(dto);
    return created.save();
  }

  async findAll(): Promise<InternshipOffer[]> {
    return this.offerModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<InternshipOffer | null> {
    return this.offerModel.findById(id).exec();
  }

  async update(id: string, dto: UpdateInternshipOfferDto): Promise<InternshipOffer | null> {
    return this.offerModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.offerModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}
