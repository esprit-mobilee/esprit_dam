import { Test, TestingModule } from '@nestjs/testing';
import { InternshipOfferService } from './internship-offer.service';

describe('InternshipOfferService', () => {
  let service: InternshipOfferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InternshipOfferService],
    }).compile();

    service = module.get<InternshipOfferService>(InternshipOfferService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
