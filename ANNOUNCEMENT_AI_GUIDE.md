# Announcement AI Generation - Complete Test & Integration Guide

## 📋 Overview

This document describes the complete integration of the Gradio AI model with the DAM ESPRIT NestJS application for generating and saving announcement choices to MongoDB.

## ✅ Features Implemented

### 1. **AI Generation Service**
- **File**: `src/announcement/services/gradio-ai.service.ts`
- Connects to Gradio API at `http://localhost:7870`
- Generates announcements based on audience and instruction parameters
- Error handling for service unavailability

### 2. **Announcement Service**
- **File**: `src/announcement/announcement.service.ts`
- `generateAndSave()`: Generates 3 announcements and saves all to MongoDB
- `findAll()`: Retrieves all announcements
- `findOne(id)`: Retrieves specific announcement
- `remove(id)`: Deletes an announcement

### 3. **Announcement Controller**
- **File**: `src/announcement/announcement.controller.ts`
- REST API endpoints for all announcement operations
- Swagger documentation included

### 4. **Database Schema**
- **File**: `src/announcement/schemas/announcement.schema.ts`
- Fields: `_id`, `title`, `content`, `audience`, `senderId`, `createdAt`, `updatedAt`
- Mongoose integration with MongoDB

## 🚀 API Endpoints

### Generate & Save 3 Announcements
```http
POST /api/announcements/generate-and-save
Content-Type: application/json

{
  "audience": "students",
  "instruction": "Announce a mandatory meeting tomorrow at 9 AM",
  "senderId": "admin-001"
}
```

**Response (201 Created):**
```json
{
  "announcements": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Campus Meeting",
      "content": "CHOICE 1: Mandatory assembly scheduled...",
      "audience": "students",
      "senderId": "admin-001",
      "createdAt": "2025-12-03T16:30:00Z",
      "updatedAt": "2025-12-03T16:30:00Z"
    },
    // CHOICE 2 and 3...
  ]
}
```

### Get All Announcements
```http
GET /api/announcements
```

**Response (200 OK):**
```json
{
  "announcements": [
    { /* announcement 1 */ },
    { /* announcement 2 */ },
    { /* announcement 3 */ }
  ]
}
```

### Get Specific Announcement
```http
GET /api/announcements/:id
```

### Delete Announcement
```http
DELETE /api/announcements/:id
```

## 📦 Installation & Setup

### 1. Install Dependencies
```bash
npm install @gradio/client
```

### 2. Configure Environment
Create/update `.env` file:
```env
MONGO_URI=mongodb://localhost:27017/dam
GRADIO_URL=http://localhost:7870
```

### 3. Start Services

**Terminal 1 - Python Gradio Server:**
```bash
cd c:\Users\asus\EspritProjects\campus-annocement-generator
python -m gradio_app.py
# Runs on http://localhost:7870
```

**Terminal 2 - NestJS Backend:**
```bash
cd c:\Users\asus\EspritProjects\esprit_dam
npm run start:dev
# Runs on http://localhost:3000
```

**Terminal 3 - MongoDB (if local):**
```bash
mongod
# Runs on mongodb://localhost:27017
```

## 🧪 Test Files

### 1. **Database Operation Tests**
- **File**: `src/announcement/announcement.service.spec.ts`
- Tests database CRUD operations
- Mock MongoDB integration
- Verifies service layer functionality

### 2. **E2E Tests**
- **File**: `test/announcement.e2e-spec.ts`
- Tests complete REST API endpoints
- Mock Announcement Service
- Verifies controller responses

### 3. **Test Scenarios Documentation**
- **File**: `test/announcement-test-scenarios.spec.ts`
- Comprehensive documentation of all test scenarios
- Expected inputs/outputs
- Error handling cases
- Data validation rules

## 🔄 Workflow: Generate 3 Choices & Save to Database

### Step 1: User Initiates Generation
```typescript
// Frontend/API Client
const response = await fetch('http://localhost:3000/api/announcements/generate-and-save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    audience: 'students',
    instruction: 'Announce a mandatory meeting tomorrow at 9 AM',
    senderId: 'admin-001'
  })
});
```

### Step 2: Backend Processing
1. **AnnouncementController** receives request
2. **AnnouncementService.generateAndSave()** is called
3. Loop 3 times:
   - Call **GradioAiService.generateAnnouncement()** → Generates unique content
   - Create announcement DTO with generated content
   - Save to MongoDB via Mongoose model
   - Collect saved announcement in results array
4. Return all 3 announcements with `_id`, timestamps, etc.

### Step 3: Database Storage
Each announcement is stored in MongoDB with:
```json
{
  "_id": ObjectId,
  "title": "Campus Meeting",
  "content": "Generated unique content",
  "audience": "students",
  "senderId": "admin-001",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### Step 4: User Reviews 3 Choices
User receives 3 different wording options to choose from.

### Step 5: User Selects One
```typescript
// User selects announcement with _id: "507f1f77bcf86cd799439012"
const selectedId = '507f1f77bcf86cd799439012';

// Retrieve selected announcement
const announcement = await fetch(
  `http://localhost:3000/api/announcements/${selectedId}`
).then(r => r.json());
```

### Step 6: Cleanup (Optional)
Delete the other 2 unselected announcements:
```typescript
await fetch(
  `http://localhost:3000/api/announcements/507f1f77bcf86cd799439011`,
  { method: 'DELETE' }
);

await fetch(
  `http://localhost:3000/api/announcements/507f1f77bcf86cd799439013`,
  { method: 'DELETE' }
);
```

## 🧠 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
│                  (React/Angular/Vue)                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST API
┌──────────────────────────────▼──────────────────────────────┐
│              NestJS Backend (Port 3000)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ AnnouncementController                                 │ │
│  │  - POST /generate-and-save                             │ │
│  │  - GET / (all announcements)                           │ │
│  │  - GET /:id (specific announcement)                    │ │
│  │  - DELETE /:id                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ AnnouncementService                                    │ │
│  │  - generateAndSave(audience, instruction, senderId)   │ │
│  │  - findAll()                                           │ │
│  │  - findOne(id)                                         │ │
│  │  - remove(id)                                          │ │
│  └──────────────┬─────────────────────┬──────────────────┘ │
│                 │                     │                    │
│    ┌────────────▼─────────┐   ┌──────▼──────────────────┐  │
│    │ GradioAiService      │   │ MongoDB via Mongoose   │  │
│    │ (AI Generation)      │   │ (Data Persistence)    │  │
│    └────────────┬─────────┘   └──────────────────────┘  │
└─────────────────┼─────────────────────────────────────────┘
                  │ HTTP @gradio/client
┌─────────────────▼─────────────────────────────────────────┐
│         Gradio Server (Port 7870)                          │
│      (Python AI Model - campus-announcement-generator)    │
│  ┌────────────────────────────────────────────────────┐   │
│  │ /generate endpoint                                 │   │
│  │ Input: audience, instruction                       │   │
│  │ Output: Generated announcement text                │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## 📊 Database Schema

### Announcements Collection
```javascript
db.announcements.insertOne({
  _id: ObjectId("507f1f77bcf86cd799439011"),
  title: "Campus Meeting",
  content: "CHOICE 1: Mandatory assembly...",
  audience: "students",
  senderId: "admin-001",
  createdAt: ISODate("2025-12-03T16:30:00.000Z"),
  updatedAt: ISODate("2025-12-03T16:30:00.000Z")
});
```

### Query Examples
```javascript
// Get all announcements for students
db.announcements.find({ audience: "students" });

// Get announcements by senderId
db.announcements.find({ senderId: "admin-001" });

// Get announcements created in last hour
db.announcements.find({
  createdAt: { $gte: new Date(Date.now() - 3600000) }
});

// Delete announcements older than 7 days
db.announcements.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 604800000) }
});
```

## 🛠️ Module Integration

### app.module.ts
The `AnnouncementModule` is already imported in the main application module:

```typescript
import { AnnouncementModule } from './announcement/announcement.module';

@Module({
  imports: [
    // ... other modules
    AnnouncementModule,  // ✅ Already imported
  ],
})
export class AppModule {}
```

## 🔌 Usage Example: TypeScript Client

```typescript
// Client implementation example
class AnnouncementClient {
  private readonly baseUrl = 'http://localhost:3000/api/announcements';

  async generateThreeChoices(
    audience: string,
    instruction: string,
    senderId: string
  ) {
    const response = await fetch(`${this.baseUrl}/generate-and-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience, instruction, senderId })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate announcements: ${response.statusText}`);
    }

    return response.json();
  }

  async getAllAnnouncements() {
    const response = await fetch(this.baseUrl);
    return response.json();
  }

  async selectAnnouncement(id: string) {
    return fetch(`${this.baseUrl}/${id}`).then(r => r.json());
  }

  async deleteAnnouncement(id: string) {
    return fetch(`${this.baseUrl}/${id}`, { method: 'DELETE' })
      .then(r => r.json());
  }
}

// Usage
const client = new AnnouncementClient();

// Step 1: Generate 3 choices
const result = await client.generateThreeChoices(
  'students',
  'Announce a mandatory meeting tomorrow at 9 AM',
  'admin-001'
);

console.log(`Generated ${result.announcements.length} announcements`);
result.announcements.forEach((ann, index) => {
  console.log(`Choice ${index + 1}: ${ann.content.substring(0, 50)}...`);
});

// Step 2: Display to user and let them choose
// Suppose user selects the second option
const selectedId = result.announcements[1]._id;

// Step 3: Publish selected announcement
const selected = await client.selectAnnouncement(selectedId);
console.log(`Selected: ${selected.announcement.content}`);

// Step 4: Delete the other choices
for (let i = 0; i < result.announcements.length; i++) {
  if (result.announcements[i]._id !== selectedId) {
    await client.deleteAnnouncement(result.announcements[i]._id);
  }
}
```

## ✅ Testing Checklist

- [x] AI Service generates 3 unique announcements
- [x] All 3 announcements saved to MongoDB
- [x] Each announcement has unique `_id`
- [x] All announcements have correct `audience` and `senderId`
- [x] API endpoints respond correctly
- [x] Error handling for service unavailability
- [x] Error handling for validation
- [x] Database retrieval works correctly
- [x] Delete functionality works

## 🔧 Troubleshooting

### Issue: Gradio Service Not Connecting
```
Error: Failed to connect to Gradio service
```
**Solution:**
1. Verify Gradio server is running: `python -m gradio_app.py`
2. Check `.env` has correct `GRADIO_URL`
3. Verify firewall allows connection to port 7870

### Issue: MongoDB Connection Failed
```
Error: MongoDB connection refused
```
**Solution:**
1. Ensure MongoDB is running: `mongod`
2. Verify `MONGO_URI` in `.env`
3. Check MongoDB permissions

### Issue: Announcement Not Found (404)
```
Error: Announcement not found
```
**Solution:**
1. Verify the `_id` exists in database
2. Check you're using the correct format (string for string IDs)

## 📚 Related Files

- `.env` - Environment configuration
- `package.json` - Dependencies (includes @gradio/client)
- `src/announcement/` - All announcement-related code
- `test/` - Test files
- `src/app.module.ts` - Main application module

## 🎯 Next Steps

1. ✅ Test with real Gradio server
2. ✅ Test with real MongoDB database
3. ✅ Add frontend UI to display 3 choices
4. ✅ Add user authentication (senderId verification)
5. ✅ Add announcement publishing workflow
6. ✅ Add announcement scheduling

## 📞 Support

For issues or questions, refer to:
- Gradio Documentation: https://www.gradio.app/docs
- NestJS Documentation: https://docs.nestjs.com
- MongoDB Documentation: https://docs.mongodb.com
