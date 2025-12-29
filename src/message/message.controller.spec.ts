import { Test, TestingModule } from '@nestjs/testing';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { getModelToken } from '@nestjs/mongoose';
import { Message } from './schemas/message.schema';
import { HttpModule } from '@nestjs/axios';
import { ChatSummarizerService } from './services/chat-summarizer.service';
import { ConfigService } from '@nestjs/config';

describe('MessageController', () => {
  let controller: MessageController;
  let service: MessageService;
  let chatSummarizerService: ChatSummarizerService;

  // Mock Message Model
  const mockMessageModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
  };

  // Mock ChatSummarizerService
  const mockChatSummarizerService = {
    summarize: jest.fn(),
  };

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:7861'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [MessageController],
      providers: [
        MessageService,
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
        {
          provide: ChatSummarizerService,
          useValue: mockChatSummarizerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<MessageController>(MessageController);
    service = module.get<MessageService>(MessageService);
    chatSummarizerService = module.get<ChatSummarizerService>(ChatSummarizerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('summarizeUnreadMessages', () => {
    it('should call service methods and return summary', async () => {
      const userId = 'user123';
      const otherUserId = 'other456';
      const mockUnreadMessages = [
        { sender: 'David', message: 'Hello' },
        { sender: 'David', message: 'How are you?' },
      ];
      const mockSummary = { summary: 'Test summary', messageCount: 2 };
      
      jest.spyOn(service, 'getUnreadMessages').mockResolvedValue(mockUnreadMessages as any);
      jest.spyOn(service, 'markMessagesAsRead').mockResolvedValue(undefined);
      mockChatSummarizerService.summarize.mockResolvedValue(mockSummary);

      const result = await controller.summarizeUnreadMessages(userId, otherUserId);

      expect(service.getUnreadMessages).toHaveBeenCalledWith(userId, otherUserId);
      expect(chatSummarizerService.summarize).toHaveBeenCalledWith(mockUnreadMessages);
      expect(service.markMessagesAsRead).toHaveBeenCalledWith(userId, otherUserId);
      expect(result).toEqual(mockSummary);
    });
  });
});
