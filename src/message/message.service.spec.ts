import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { getModelToken } from '@nestjs/mongoose';
import { Message } from './schemas/message.schema';
import { HttpModule } from '@nestjs/axios';

describe('MessageService', () => {
  let service: MessageService;

  // Mock Message Model
  const mockMessageModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        MessageService,
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUnreadMessages', () => {
    it('should return formatted unread messages', async () => {
      const mockMessages = [
        {
          senderId: { prenom: 'David', nom: 'Smith' },
          content: 'Hello',
          isRead: false,
        },
        {
          senderId: { prenom: 'David', nom: 'Smith' },
          content: 'How are you?',
          isRead: false,
        },
      ];

      mockMessageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockMessages),
      });

      const result = await service.getUnreadMessages('userId123', 'otherUserId456');

      expect(result).toEqual([
        { sender: 'David Smith', message: 'Hello' },
        { sender: 'David Smith', message: 'How are you?' },
      ]);
    });
  });
});
