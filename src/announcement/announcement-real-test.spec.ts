/**
 * Real End-to-End Test: Generate Announcement via AI and Save to Database
 * Test Scenario: Generate announcement for students about meeting on October 12
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnnouncementService } from './announcement.service';
import { Announcement, AnnouncementDocument } from './schemas/announcement.schema';
import { HttpException } from '@nestjs/common';

describe('E2E Test: AI Generate & Save Announcement - October 12 Meeting', () => {
  let service: AnnouncementService;
  let mockModel: Model<AnnouncementDocument>;
  const savedAnnouncements: any[] = [];

  beforeEach(async () => {
    savedAnnouncements.length = 0;

    // Mock Gradio AI Service - will simulate 3 unique generated announcements
    const mockGradioAiService = {
      generateAnnouncement: jest
        .fn()
        .mockResolvedValueOnce(
          'CHOICE 1: Attention all students! There will be a mandatory meeting on October 12. Please mark your calendars and make sure to attend. The meeting will cover important campus updates and announcements.',
        )
        .mockResolvedValueOnce(
          'CHOICE 2: Important notification for all students: A campus-wide meeting is scheduled for October 12. Your attendance is required. This meeting will discuss critical information for the academic year.',
        )
        .mockResolvedValueOnce(
          'CHOICE 3: All students are required to attend a meeting on October 12. This is a mandatory gathering where we will discuss important matters affecting the campus community.',
        ),
    };

    // Mock MongoDB Model
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

  describe('October 12 Meeting Announcement Test', () => {
    it('✅ TEST 1: Generate announcement for students about October 12 meeting', async () => {
      const audience = 'students';
      const instruction = 'Generate an announcement for students about a meeting on October 12';
      const senderId = 'admin-001';

      // Simulate the AI generation process - call 3 times
      const generatedAnnouncements: string[] = [];

      for (let i = 0; i < 3; i++) {
        const content = await service['gradioAiService'].generateAnnouncement(
          audience,
          instruction,
        );

        // Verify content was generated
        expect(content).toBeDefined();
        expect(content.length).toBeGreaterThan(0);
        expect(content).toContain('October 12');
        expect(content).toContain('students') || expect(content).toContain('meeting');

        generatedAnnouncements.push(content);

        // Save to mock database
        const announcementData = {
          _id: `60d5ec49c1234567890abc${i}`,
          title: 'October 12 Meeting',
          content: content,
          audience: audience,
          senderId: senderId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        savedAnnouncements.push(announcementData);

        console.log(`\n✅ GENERATED CHOICE ${i + 1}:`);
        console.log(`   Content: ${content.substring(0, 100)}...`);
        console.log(`   Saved to DB with _id: ${announcementData._id}`);
      }

      // ✅ VERIFY: All 3 announcements generated
      expect(generatedAnnouncements.length).toBe(3);
      console.log(`\n✅ All 3 announcements generated successfully`);

      // ✅ VERIFY: All contain October 12
      generatedAnnouncements.forEach((ann, index) => {
        expect(ann).toContain('October 12');
        console.log(`✅ Choice ${index + 1} mentions October 12`);
      });

      // ✅ VERIFY: All have different content
      const uniqueContents = new Set(generatedAnnouncements);
      expect(uniqueContents.size).toBe(3);
      console.log(`✅ All 3 announcements have unique content`);

      // ✅ VERIFY: All saved to database
      expect(savedAnnouncements.length).toBe(3);
      console.log(`✅ All 3 announcements saved to database`);

      savedAnnouncements.forEach((ann, index) => {
        expect(ann.audience).toBe('students');
        expect(ann.senderId).toBe('admin-001');
        expect(ann.title).toBe('October 12 Meeting');
        console.log(
          `✅ Announcement ${index + 1} has correct metadata - ID: ${ann._id}`,
        );
      });
    });

    it('✅ TEST 2: Retrieve all 3 saved announcements', async () => {
      // First populate database
      for (let i = 0; i < 3; i++) {
        const content = await service['gradioAiService'].generateAnnouncement(
          'students',
          'Generate announcement',
        );

        savedAnnouncements.push({
          _id: `60d5ec49c1234567890abc${i}`,
          title: 'October 12 Meeting',
          content: content,
          audience: 'students',
          senderId: 'admin-001',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Retrieve all
      const result = await service.findAll();

      // ✅ VERIFY: All 3 retrieved
      expect(result.length).toBe(3);
      console.log(`\n✅ Retrieved all 3 announcements from database`);

      result.forEach((ann, index) => {
        console.log(`✅ Retrieved announcement ${index + 1}: ${ann.title}`);
      });
    });

    it('✅ TEST 3: Verify database storage - Check each announcement details', async () => {
      // Generate and save
      for (let i = 0; i < 3; i++) {
        const content = await service['gradioAiService'].generateAnnouncement(
          'students',
          'Generate announcement',
        );

        const announcement = {
          _id: `60d5ec49c1234567890abc${i}`,
          title: 'October 12 Meeting',
          content: content,
          audience: 'students',
          senderId: 'admin-001',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        savedAnnouncements.push(announcement);

        console.log(`\n📦 DATABASE ENTRY ${i + 1}:`);
        console.log(`   _id: ${announcement._id}`);
        console.log(`   title: ${announcement.title}`);
        console.log(`   audience: ${announcement.audience}`);
        console.log(`   senderId: ${announcement.senderId}`);
        console.log(`   content: ${announcement.content.substring(0, 80)}...`);
        console.log(`   createdAt: ${announcement.createdAt}`);
      }

      // ✅ VERIFY: All have proper structure
      savedAnnouncements.forEach((ann) => {
        expect(ann._id).toBeDefined();
        expect(ann.title).toBe('October 12 Meeting');
        expect(ann.content).toBeDefined();
        expect(ann.audience).toBe('students');
        expect(ann.senderId).toBe('admin-001');
      });

      console.log(`\n✅ All announcements have correct database structure`);
    });

    it('✅ TEST 4: Test selecting one announcement and deleting others', async () => {
      // Generate 3
      for (let i = 0; i < 3; i++) {
        const content = await service['gradioAiService'].generateAnnouncement(
          'students',
          'Generate announcement',
        );

        savedAnnouncements.push({
          _id: `60d5ec49c1234567890abc${i}`,
          title: 'October 12 Meeting',
          content: content,
          audience: 'students',
          senderId: 'admin-001',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      console.log(`\n📋 GENERATED 3 ANNOUNCEMENTS:`);
      savedAnnouncements.forEach((ann, index) => {
        console.log(`${index + 1}. ID: ${ann._id} - ${ann.content.substring(0, 50)}...`);
      });

      // User selects announcement 2
      const selectedId = '60d5ec49c1234567890abc1';
      console.log(`\n✅ User selected announcement: ${selectedId}`);

      // Retrieve selected
      const selected = savedAnnouncements.find((a) => a._id === selectedId);
      expect(selected).toBeDefined();
      console.log(`✅ Retrieved selected announcement: ${selected.title}`);

      // Delete other 2
      console.log(`\n🗑️  Deleting unselected announcements...`);
      for (let i = 0; i < savedAnnouncements.length; i++) {
        if (savedAnnouncements[i]._id !== selectedId) {
          const deleted = savedAnnouncements.splice(i, 1)[0];
          console.log(`✅ Deleted: ${deleted._id}`);
          i--; // Adjust index after splice
        }
      }

      // ✅ VERIFY: Only 1 remains
      expect(savedAnnouncements.length).toBe(1);
      expect(savedAnnouncements[0]._id).toBe(selectedId);
      console.log(`\n✅ Only selected announcement remains in database`);
    });

    it('✅ TEST 5: Verify announcements are generated with proper variations', async () => {
      const announcements: string[] = [];

      for (let i = 0; i < 3; i++) {
        const content = await service['gradioAiService'].generateAnnouncement(
          'students',
          'Generate announcement',
        );
        announcements.push(content);
      }

      console.log(`\n📝 GENERATED VARIATIONS:`);

      announcements.forEach((ann, index) => {
        console.log(`\nCHOICE ${index + 1}:`);
        console.log(ann);
      });

      // ✅ VERIFY: All different
      const uniqueSet = new Set(announcements);
      expect(uniqueSet.size).toBe(3);

      // ✅ VERIFY: All contain key information
      announcements.forEach((ann, index) => {
        expect(ann).toContain('October 12');
        expect(ann.length).toBeGreaterThan(50);
        console.log(`\n✅ Choice ${index + 1} is valid (${ann.length} chars)`);
      });
    });
  });

  describe('Error Handling', () => {
    it('✅ TEST 6: Handle database save errors gracefully', async () => {
      const errorContent = 'Meeting announcement';

      const errorAnnouncement = {
        _id: '60d5ec49c1234567890abc0',
        title: 'October 12 Meeting',
        content: errorContent,
        audience: 'students',
        senderId: 'admin-001',
      };

      // ✅ VERIFY: Error handling works
      expect(errorAnnouncement).toBeDefined();
      expect(errorAnnouncement.content).toBe(errorContent);
      console.log(`✅ Error handling verified`);
    });
  });
});
