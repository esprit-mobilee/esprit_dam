import { Test, TestingModule } from '@nestjs/testing';
import { InternshipOfferController } from './internship-offer.controller';

describe('InternshipOfferController', () => {
  let controller: InternshipOfferController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternshipOfferController],
    }).compile();

    controller = module.get<InternshipOfferController>(InternshipOfferController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
