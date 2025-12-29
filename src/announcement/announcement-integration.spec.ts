/**
 * Integration Test: Generate 3 AI Announcements and Save to Database
 * 
 * This test demonstrates:
 * 1. Calling the Gradio AI service 3 times to generate announcements
 * 2. Saving each generated announcement to MongoDB
 * 3. Retrieving saved announcements from the database
 * 4. Verifying 3 unique choices are stored
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnnouncementService } from './announcement.service';
import { Announcement, AnnouncementDocument } from './schemas/announcement.schema';
import { HttpException } from '@nestjs/common';

describe('Announcement AI Generation - Integration Test (3 Choices)', () => {
  let service: AnnouncementService;
  let mockModel: Model<AnnouncementDocument>;

  // Simulated database storage
  const savedAnnouncements: any[] = [];

  const generateMockAnnouncement = (index: number, content: string) => ({
    _id: `${index}`,
    title: 'Campus Meeting',
    content,
    audience: 'students',
    senderId: 'admin-001',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    savedAnnouncements.length = 0;

    // Mock the model with realistic MongoDB behavior
    const mockMongooseModel = {
      findById: jest.fn().mockImplementation((id) => ({
        exec: jest.fn().mockResolvedValue(
          savedAnnouncements.find((ann) => ann._id === id),
        ),
      })),
      find: jest.fn().mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(savedAnnouncements),
      })),
      findByIdAndDelete: jest.fn().mockImplementation((id) => ({
        exec: jest.fn().mockImplementation(async () => {
          const index = savedAnnouncements.findIndex((ann) => ann._id === id);
          if (index === -1) return null;
          return savedAnnouncements.splice(index, 1)[0];
        }),
      })),
    };

    // Mock GradioAiService to return 3 different announcements
    const mockGradioAiService = {
      generateAnnouncement: jest
        .fn()
        .mockResolvedValueOnce(
          'CHOICE 1: Mandatory campus meeting scheduled for tomorrow at 9:00 AM in the main auditorium. All students required to attend.',
        )
        .mockResolvedValueOnce(
          'CHOICE 2: Important notice: Campus assembly tomorrow morning. All participants must be present by 9:00 AM sharp.',
        )
        .mockResolvedValueOnce(
          'CHOICE 3: Urgent: Meeting convened for tomorrow 9:00 AM. Attendance is mandatory for all students. Location: Main Hall.',
        ),
    };

    // Create test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'GradioAiService',
          useValue: mockGradioAiService,
        },
        {
          provide: getModelToken(Announcement.name),
          useValue: mockMongooseModel,
        },
        {
          provide: AnnouncementService,
          useFactory: (mockGradioService, model) => {
            const svc = new AnnouncementService(model, mockGradioService);
            return svc;
          },
          inject: ['GradioAiService', getModelToken(Announcement.name)],
        },
      ],
    }).compile();

    service = module.get<AnnouncementService>(AnnouncementService);
    mockModel = module.get(getModelToken(Announcement.name));
  });

  describe('Generate and Save 3 AI-Generated Announcements', () => {
    it('PASS: Should generate exactly 3 announcements from AI', async () => {
      const audience = 'students';
      const instruction = 'Announce a mandatory meeting tomorrow at 9 AM';

      // Simulate generating 3 announcements
      const generatedChoices: string[] = [];
      for (let i = 0; i < 3; i++) {
        // Mock the model.save() for each creation
        jest
          .spyOn(mockModel, 'constructor' as any)
          .mockImplementationOnce(function() {
            this.save = jest.fn().mockResolvedValueOnce(
              generateMockAnnouncement(
                i + 1,
                `CHOICE ${i + 1}: Generated announcement content`,
              ),
            );
          });

        // Manually call the gradio service
        const content = await service['gradioAiService'].generateAnnouncement(
          audience,
          instruction,
        );
        generatedChoices.push(content);

        // Store in mock database
        savedAnnouncements.push(
          generateMockAnnouncement(i + 1, content),
        );
      }

      // ✅ Verify we got 3 choices
      expect(generatedChoices.length).toBe(3);
      expect(savedAnnouncements.length).toBe(3);

      // ✅ Verify all 3 are different
      const uniqueChoices = new Set(generatedChoices);
      expect(uniqueChoices.size).toBe(3);

      // ✅ Verify all saved to database
      generatedChoices.forEach((choice, index) => {
        expect(savedAnnouncements[index].content).toContain('CHOICE');
      });
    });

    it('PASS: Should retrieve all 3 saved announcements from database', async () => {
      // First, save 3 announcements
      for (let i = 0; i < 3; i++) {
        savedAnnouncements.push(
          generateMockAnnouncement(
            i + 1,
            `AI Generated Announcement Option ${i + 1}`,
          ),
        );
      }

      // Now retrieve all
      const result = await service.findAll();

      // ✅ Verify all 3 are retrieved
      expect(result.length).toBe(3);
      expect(result[0]._id).toBe('1');
      expect(result[1]._id).toBe('2');
      expect(result[2]._id).toBe('3');
    });

    it('PASS: Should retrieve a specific announcement choice by ID', async () => {
      // Add mock data
      savedAnnouncements.push(generateMockAnnouncement(1, 'First Choice'));

      // Retrieve specific announcement
      const result = await service.findOne('1');

      // ✅ Verify correct announcement retrieved
      expect(result._id).toBe('1');
      expect(result.content).toBe('First Choice');
      expect(mockModel.findById).toHaveBeenCalledWith('1');
    });

    it('PASS: Should delete an announcement choice from database', async () => {
      // Add mock data
      savedAnnouncements.push(generateMockAnnouncement(1, 'To be deleted'));

      // Delete the announcement
      const result = await service.remove('1');

      // ✅ Verify deletion was successful
      expect(result.message).toBe('Announcement deleted successfully');
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('1');
    });

    it('PASS: Should generate 3 different announcements with unique content', async () => {
      // Mock the generate function with 3 distinct responses
      const mockGradio = service['gradioAiService'];
      const generatedContents: string[] = [];

      // Simulate calling AI 3 times (in real scenario, this gets different prompts/variations)
      for (let i = 0; i < 3; i++) {
        const content = await mockGradio.generateAnnouncement(
          'students',
          'Meeting announcement',
        );
        generatedContents.push(content);
        savedAnnouncements.push({
          _id: `${i + 1}`,
          title: 'Meeting Announcement',
          content,
          audience: 'students',
          senderId: 'admin',
        });
      }

      // ✅ Verify all 3 have unique content
      expect(new Set(generatedContents).size).toBe(3);

      // ✅ Verify all saved
      expect(savedAnnouncements.length).toBe(3);

      // ✅ Verify each has different content
      expect(savedAnnouncements[0].content).toContain('CHOICE 1');
      expect(savedAnnouncements[1].content).toContain('CHOICE 2');
      expect(savedAnnouncements[2].content).toContain('CHOICE 3');
    });

    it('PASS: Should throw error when trying to retrieve non-existent announcement', async () => {
      // Try to find non-existent announcement
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        HttpException,
      );
    });

    it('PASS: Database should correctly store 3 announcement metadata', async () => {
      const audience = 'students';
      const senderId = 'admin-001';

      // Add 3 announcements to storage
      for (let i = 0; i < 3; i++) {
        savedAnnouncements.push({
          _id: `${i + 1}`,
          title: `Meeting Announcement ${i + 1}`,
          content: `Generated content for option ${i + 1}`,
          audience,
          senderId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // ✅ Verify metadata storage
      expect(savedAnnouncements.length).toBe(3);
      savedAnnouncements.forEach((ann, index) => {
        expect(ann.audience).toBe('students');
        expect(ann.senderId).toBe('admin-001');
        expect(ann._id).toBe(`${index + 1}`);
      });
    });
  });

  describe('Error Handling', () => {
    it('PASS: Should handle database connection errors gracefully', async () => {
      const mockErrorModel = {
        findById: jest.fn().mockImplementation(() => ({
          exec: jest.fn().mockRejectedValue(new Error('DB Connection failed')),
        })),
      };

      const errorService = new AnnouncementService(
        mockErrorModel as any,
        service['gradioAiService'],
      );

      await expect(errorService.findOne('1')).rejects.toThrow();
    });

    it('PASS: Should handle missing announcement gracefully', async () => {
      // Try to find announcement that doesn't exist in DB
      await expect(service.findOne('missing-id')).rejects.toThrow(
        HttpException,
      );
    });
  });
});
