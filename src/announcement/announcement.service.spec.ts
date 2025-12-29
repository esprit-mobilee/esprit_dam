import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnnouncementService } from './announcement.service';
import { Announcement, AnnouncementDocument } from './schemas/announcement.schema';
import { HttpException } from '@nestjs/common';

describe('AnnouncementService - Database Operations', () => {
  let service: AnnouncementService;
  let mockModel: Model<AnnouncementDocument>;

  // Mock announcements
  const mockAnnouncements = [
    {
      _id: '1',
      title: 'Meeting announcement',
      content: 'Generated announcement 1',
      audience: 'students',
      senderId: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: '2',
      title: 'Meeting announcement',
      content: 'Generated announcement 2',
      audience: 'students',
      senderId: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: '3',
      title: 'Meeting announcement',
      content: 'Generated announcement 3',
      audience: 'students',
      senderId: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    // Mock Mongoose Model
    const mockMongooseModel = {
      findById: jest.fn(),
      find: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'GradioAiService',
          useValue: {
            generateAnnouncement: jest
              .fn()
              .mockResolvedValueOnce('Generated announcement 1')
              .mockResolvedValueOnce('Generated announcement 2')
              .mockResolvedValueOnce('Generated announcement 3'),
          },
        },
        {
          provide: getModelToken(Announcement.name),
          useValue: mockMongooseModel,
        },
        {
          provide: AnnouncementService,
          useFactory: (mockGradioService, model) => {
            const service = new AnnouncementService(model, mockGradioService);
            return service;
          },
          inject: ['GradioAiService', getModelToken(Announcement.name)],
        },
      ],
    }).compile();

    service = module.get<AnnouncementService>(AnnouncementService);
    mockModel = module.get(getModelToken(Announcement.name));
  });

  describe('findAll', () => {
    it('should retrieve all announcements from database', async () => {
      const mockFindExec = jest.fn().mockResolvedValueOnce(mockAnnouncements);
      (mockModel.find as jest.Mock).mockReturnValueOnce({
        exec: mockFindExec,
      });

      const result = await service.findAll();

      expect(mockModel.find).toHaveBeenCalled();
      expect(result.length).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should retrieve a single announcement by ID', async () => {
      const id = '1';
      const mockFindExec = jest
        .fn()
        .mockResolvedValueOnce(mockAnnouncements[0]);
      (mockModel.findById as jest.Mock).mockReturnValueOnce({
        exec: mockFindExec,
      });

      const result = await service.findOne(id);

      expect(mockModel.findById).toHaveBeenCalledWith(id);
      expect(result._id).toBe('1');
    });

    it('should throw error if announcement not found', async () => {
      const id = 'nonexistent';
      const mockFindExec = jest.fn().mockResolvedValueOnce(null);
      (mockModel.findById as jest.Mock).mockReturnValueOnce({
        exec: mockFindExec,
      });

      await expect(service.findOne(id)).rejects.toThrow(HttpException);
    });
  });

  describe('remove', () => {
    it('should delete an announcement by ID', async () => {
      const id = '1';
      const mockDeleteExec = jest
        .fn()
        .mockResolvedValueOnce(mockAnnouncements[0]);
      (mockModel.findByIdAndDelete as jest.Mock).mockReturnValueOnce({
        exec: mockDeleteExec,
      });

      const result = await service.remove(id);

      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result.message).toBe('Announcement deleted successfully');
    });

    it('should throw error if announcement to delete not found', async () => {
      const id = 'nonexistent';
      const mockDeleteExec = jest.fn().mockResolvedValueOnce(null);
      (mockModel.findByIdAndDelete as jest.Mock).mockReturnValueOnce({
        exec: mockDeleteExec,
      });

      await expect(service.remove(id)).rejects.toThrow(HttpException);
    });
  });
});
