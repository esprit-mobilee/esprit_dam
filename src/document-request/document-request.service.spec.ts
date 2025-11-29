import { Test, TestingModule } from '@nestjs/testing';
import { DocumentRequestService } from './document-request.service';

describe('DocumentRequestService', () => {
  let service: DocumentRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentRequestService],
    }).compile();

    service = module.get<DocumentRequestService>(DocumentRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
