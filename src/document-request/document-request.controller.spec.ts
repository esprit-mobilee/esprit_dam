import { Test, TestingModule } from '@nestjs/testing';
import { DocumentRequestController } from './document-request.controller';
import { DocumentRequestService } from './document-request.service';

describe('DocumentRequestController', () => {
  let controller: DocumentRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentRequestController],
      providers: [DocumentRequestService],
    }).compile();

    controller = module.get<DocumentRequestController>(DocumentRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
