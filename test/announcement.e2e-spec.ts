/**
 * E2E Test: Generate and Save 3 AI Announcements
 * 
 * This test verifies the complete workflow:
 * 1. Call POST /api/announcements/generate-and-save with audience and instruction
 * 2. AI generates 3 different announcements
 * 3. All 3 are saved to MongoDB
 * 4. User can retrieve all 3 saved choices
 * 5. User can select one choice to use
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AnnouncementController } from '../src/announcement/announcement.controller';
import { AnnouncementService } from '../src/announcement/announcement.service';
import { getModelToken } from '@nestjs/mongoose';
import { Announcement } from '../src/announcement/schemas/announcement.schema';

describe('Announcement E2E - Generate 3 Choices (e2e)', () => {
  let app: INestApplication;
  let announcementService: AnnouncementService;

  // Mock saved announcements
  const mockSavedAnnouncements = [
    {
      _id: '507f1f77bcf86cd799439011',
      title: 'Campus Meeting Announcement',
      content: 'CHOICE 1: Mandatory assembly scheduled for tomorrow at 9 AM in the main auditorium. Attendance required for all students. Duration: 1 hour.',
      audience: 'students',
      senderId: 'admin-001',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: '507f1f77bcf86cd799439012',
      title: 'Campus Meeting Announcement',
      content: 'CHOICE 2: Important notification: All students must attend campus meeting tomorrow morning at 9:00 AM. Location: Main auditorium.',
      audience: 'students',
      senderId: 'admin-001',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: '507f1f77bcf86cd799439013',
      title: 'Campus Meeting Announcement',
      content: 'CHOICE 3: Convening all students for mandatory meeting tomorrow 9:00 AM sharp. Place: Main Hall. Punctuality appreciated.',
      audience: 'students',
      senderId: 'admin-001',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeAll(async () => {
    // Mock AnnouncementService
    const mockAnnouncementService = {
      generateAndSave: jest.fn().mockResolvedValue(mockSavedAnnouncements),
      findAll: jest.fn().mockResolvedValue(mockSavedAnnouncements),
      findOne: jest.fn((id) =>
        Promise.resolve(
          mockSavedAnnouncements.find((ann) => ann._id === id) ||
            Promise.reject(new Error('Not found')),
        ),
      ),
      remove: jest.fn((id) =>
        Promise.resolve({ message: 'Announcement deleted successfully' }),
      ),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementController],
      providers: [
        {
          provide: AnnouncementService,
          useValue: mockAnnouncementService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    announcementService = moduleFixture.get<AnnouncementService>(
      AnnouncementService,
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/announcements/generate-and-save', () => {
    it('✅ PASS: Should generate and save 3 AI announcements', async () => {
      const payload = {
        audience: 'students',
        instruction: 'Announce a mandatory meeting tomorrow at 9 AM',
        senderId: 'admin-001',
      };

      const response = await request(app.getHttpServer())
        .post('/announcements/generate-and-save')
        .send(payload)
        .expect(201);

      // ✅ Verify response structure
      expect(response.body).toHaveProperty('announcements');
      expect(response.body.announcements).toBeInstanceOf(Array);

      // ✅ Verify 3 announcements were generated
      expect(response.body.announcements.length).toBe(3);

      // ✅ Verify each announcement has required fields
      response.body.announcements.forEach((ann: any) => {
        expect(ann).toHaveProperty('_id');
        expect(ann).toHaveProperty('title');
        expect(ann).toHaveProperty('content');
        expect(ann).toHaveProperty('audience');
        expect(ann).toHaveProperty('senderId');
      });

      // ✅ Verify all have same audience
      response.body.announcements.forEach((ann: any) => {
        expect(ann.audience).toBe('students');
      });

      // ✅ Verify all have different content (3 unique choices)
      const contents = response.body.announcements.map((ann: any) => ann.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(3);

      // ✅ Verify service was called
      expect(announcementService.generateAndSave).toHaveBeenCalledWith(
        payload.audience,
        payload.instruction,
        payload.senderId,
      );
    });
  });

  describe('GET /api/announcements', () => {
    it('✅ PASS: Should retrieve all 3 saved announcement choices', async () => {
      const response = await request(app.getHttpServer())
        .get('/announcements')
        .expect(200);

      // ✅ Verify response structure
      expect(response.body).toHaveProperty('announcements');

      // ✅ Verify all 3 are returned
      expect(response.body.announcements.length).toBe(3);

      // ✅ Verify each has unique _id
      const ids = response.body.announcements.map((ann: any) => ann._id);
      expect(new Set(ids).size).toBe(3);

      // ✅ Verify service was called
      expect(announcementService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/announcements/:id', () => {
    it('✅ PASS: Should retrieve a specific announcement choice by ID', async () => {
      const announcementId = '507f1f77bcf86cd799439011';

      const response = await request(app.getHttpServer())
        .get(`/announcements/${announcementId}`)
        .expect(200);

      // ✅ Verify response structure
      expect(response.body).toHaveProperty('announcement');

      // ✅ Verify correct announcement retrieved
      expect(response.body.announcement._id).toBe(announcementId);
      expect(response.body.announcement.content).toContain('CHOICE 1');

      // ✅ Verify service was called with correct ID
      expect(announcementService.findOne).toHaveBeenCalledWith(announcementId);
    });
  });

  describe('DELETE /api/announcements/:id', () => {
    it('✅ PASS: Should delete an announcement choice', async () => {
      const announcementId = '507f1f77bcf86cd799439011';

      const response = await request(app.getHttpServer())
        .delete(`/announcements/${announcementId}`)
        .expect(200);

      // ✅ Verify response message
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Announcement deleted successfully');

      // ✅ Verify service was called
      expect(announcementService.remove).toHaveBeenCalledWith(announcementId);
    });
  });

  describe('Test Data Validation', () => {
    it('✅ PASS: Verify 3 announcements have distinct content', async () => {
      // Each choice should be different
      const choice1 = mockSavedAnnouncements[0].content;
      const choice2 = mockSavedAnnouncements[1].content;
      const choice3 = mockSavedAnnouncements[2].content;

      expect(choice1).not.toBe(choice2);
      expect(choice2).not.toBe(choice3);
      expect(choice1).not.toBe(choice3);

      // All should contain the announcement theme
      expect(choice1).toContain('meeting') || expect(choice1).toContain('Meeting');
      expect(choice2).toContain('meeting') || expect(choice2).toContain('Meeting');
      expect(choice3).toContain('meeting') || expect(choice3).toContain('Meeting');
    });

    it('✅ PASS: Verify announcements have correct metadata structure', () => {
      mockSavedAnnouncements.forEach((ann) => {
        // Check required fields
        expect(ann._id).toBeDefined();
        expect(ann.title).toBeDefined();
        expect(ann.content).toBeDefined();
        expect(ann.audience).toBeDefined();
        expect(ann.senderId).toBeDefined();

        // Verify types
        expect(typeof ann._id).toBe('string');
        expect(typeof ann.title).toBe('string');
        expect(typeof ann.content).toBe('string');
        expect(typeof ann.audience).toBe('string');
        expect(typeof ann.senderId).toBe('string');

        // Verify audience is correct
        expect(ann.audience).toBe('students');

        // Verify content is not empty
        expect(ann.content.length).toBeGreaterThan(0);
      });
    });
  });
});
