import { Test, TestingModule } from '@nestjs/testing';
import { GradioSummarizeController } from './summarize.controller';
import { GradioClientService } from './gradio.client';
import { MessageService } from '../../message/message.service';

describe('GradioSummarizeController', () => {
  let controller: GradioSummarizeController;
  let gradioMock: Partial<GradioClientService>;
  let messageMock: Partial<MessageService>;

  beforeEach(async () => {
    gradioMock = {
      summarizeChat: jest.fn().mockResolvedValue(['Summary text', 'Key points']),
    };

    messageMock = {
      getUnseenBetween: jest.fn().mockResolvedValue([
        { sender: 'Alice', message: 'Hey, are we still on for the meeting today?' },
        { sender: 'Bob', message: "Yes, we are. It's at 3 PM in the main conference room." },
      ]),
      markConversationAsRead: jest.fn().mockResolvedValue(2),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradioSummarizeController],
      providers: [
        { provide: GradioClientService, useValue: gradioMock },
        { provide: MessageService, useValue: messageMock },
      ],
    }).compile();

    controller = module.get<GradioSummarizeController>(GradioSummarizeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('summarizeAndMark: uses unseen messages and marks them read', async () => {
    const res = await controller.summarizeAndMark({ userId: 'user1', otherId: 'user2' });

    expect(res).toBeDefined();
    expect(res.ok).toBe(true);
    expect(res.gradioOut).toEqual(['Summary text', 'Key points']);

    expect((gradioMock.summarizeChat as jest.Mock).mock.calls.length).toBe(1);
    expect((messageMock.getUnseenBetween as jest.Mock).mock.calls.length).toBe(1);
    expect((messageMock.markConversationAsRead as jest.Mock).mock.calls.length).toBe(1);
  });

  it('summarizeAndMark: accepts messages array directly and does not call getUnseenBetween', async () => {
    (gradioMock.summarizeChat as jest.Mock).mockResolvedValueOnce(['S2', 'KP2']);

    const messages = [
      { sender: 'Charlie', message: 'Test message' },
    ];

    const res = await controller.summarizeAndMark({ messages });

    expect(res.ok).toBe(true);
    expect(res.gradioOut).toEqual(['S2', 'KP2']);
    // when messages provided, getUnseenBetween should NOT be called
    expect((messageMock.getUnseenBetween as jest.Mock).mock.calls.length).toBe(0);
  });

  it('summarizeAndMark: returns note when no unseen messages', async () => {
    // mock no unseen
    (messageMock.getUnseenBetween as jest.Mock).mockResolvedValueOnce([]);

    const res = await controller.summarizeAndMark({ userId: 'u', otherId: 'v' });

    expect(res.ok).toBe(true);
    expect(res.summary === '' || res.note).toBeTruthy();
  });
});
