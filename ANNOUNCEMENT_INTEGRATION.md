# Announcement AI Integration Guide

## Overview
Successfully integrated the AI announcement generator from `campus-announcement-generator` into `esprit_dam` using Gradio APIs.

## Changes Made

### 1. Updated GradioAiService (`src/announcement/services/gradio-ai.service.ts`)
**Key Changes:**
- Changed API endpoint from `/generate` to `/generate_announcements_ui`
- Added `AnnouncementVariation` interface for type safety
- Updated `generateAnnouncements()` to return array of 3 variations in a single call
- Added JSON parsing for the response string
- Added validation for ERROR/REFUSED responses
- Kept `generateAnnouncement()` as deprecated for backward compatibility

**New Interface:**
```typescript
export interface AnnouncementVariation {
  title: string;
  audience: string;
  content: string;
}
```

### 2. Updated AnnouncementService (`src/announcement/announcement.service.ts`)
**Key Changes:**
- Replaced loop that called AI 3 times with single call to `generateAnnouncements()`
- Now processes all 3 variations from the AI response
- Uses AI-generated titles instead of truncating instruction
- More efficient - 1 API call instead of 3

### 3. Updated AnnouncementController (`src/announcement/announcement.controller.ts`)
**Key Changes:**
- Updated `/generate` endpoint to return 3 variations without saving
- Response now returns `{ announcements: AnnouncementVariation[] }`
- Better API documentation

### 4. Environment Configuration
**Updated files:**
- `.env` - Set `GRADIO_URL=http://localhost:7860`
- `.env.sample` - Added GRADIO_URL documentation

## Data Structure Alignment

### Campus Announcement Generator Output:
```json
[
  {
    "title": "Exam Week Announcement",
    "audience": "students",
    "content": "Dear students, exam week is approaching..."
  },
  {
    "title": "Important: Upcoming Exams",
    "audience": "students", 
    "content": "This is to inform all students..."
  },
  {
    "title": "Examination Period Notice",
    "audience": "students",
    "content": "Please be advised that the examination..."
  }
]
```

### Esprit DAM Schema (Perfect Match ✅):
```typescript
{
  title: string;
  content: string;
  audience: string;
  senderId: string; // Added during save
}
```

## API Usage

### JavaScript/TypeScript Client Example:
```typescript
import { Client } from "@gradio/client";

const client = await Client.connect("http://localhost:7860/");
const result = await client.predict("/generate_announcements_ui", { 		
  audience: "students", 								
  instruction: "exams week is coming", 						
});

console.log(result.data); // JSON string with 3 announcements
```

### Esprit DAM API Endpoints:

#### 1. Generate Only (No Save)
```bash
POST /announcements/generate
Body: {
  "audience": "students",
  "instruction": "exam week is coming"
}

Response: {
  "announcements": [
    { "title": "...", "audience": "...", "content": "..." },
    { "title": "...", "audience": "...", "content": "..." },
    { "title": "...", "audience": "...", "content": "..." }
  ]
}
```

#### 2. Generate and Save
```bash
POST /announcements/generate-and-save
Body: {
  "audience": "students",
  "instruction": "exam week is coming",
  "senderId": "user123"
}

Response: {
  "announcements": [
    { "_id": "...", "title": "...", "audience": "...", "content": "...", "senderId": "...", "createdAt": "...", "updatedAt": "..." },
    // ... 2 more
  ]
}
```

## Setup Instructions

### 1. Start Campus Announcement Generator
```bash
cd /home/vanitas/Desktop/sirine/campus-annocement-generator
source .venv/bin/activate
python main.py
```
This starts the Gradio service on `http://localhost:7860`

### 2. Verify Gradio Service
Open browser to: `http://localhost:7860`
- You should see the Gradio UI
- Test it manually to confirm it's working

### 3. Install JavaScript Dependencies (Already Done)
The `@gradio/client` package is already in `package.json`:
```json
"@gradio/client": "^2.0.0"
```

### 4. Start Esprit DAM Backend
```bash
cd /home/vanitas/Desktop/sirine/esprit_dam
npm run start:dev
```

### 5. Test the Integration
```bash
# Test announcement generation
curl -X POST http://localhost:3000/announcements/generate \
  -H "Content-Type: application/json" \
  -d '{
    "audience": "students",
    "instruction": "Final exams will take place next week. Please review the schedule."
  }'
```

## Key Benefits

1. **Efficiency**: Reduced from 3 API calls to 1 call
2. **Better Quality**: AI generates proper titles instead of truncating instructions
3. **Type Safety**: Added TypeScript interfaces for better development experience
4. **Error Handling**: Properly handles ERROR and REFUSED responses from AI
5. **Flexibility**: Can generate without saving for preview purposes
6. **Content Moderation**: Built-in moderation checks in the AI service
7. **Validation**: JSON schema validation ensures proper format

## AI Features Included

From `campus-announcement-generator`:
- ✅ Content moderation (blocks inappropriate content)
- ✅ JSON schema validation
- ✅ 300-word limit enforcement
- ✅ English-only output
- ✅ Retry logic for failed generations
- ✅ Error handling for API failures

## Troubleshooting

### Issue: "Failed to connect to Gradio service"
**Solution:** 
- Ensure Gradio app is running on port 7860
- Check `GRADIO_URL` in `.env` file
- Verify firewall allows localhost:7860

### Issue: "Announcement generation failed"
**Solution:**
- Check campus-announcement-generator `.env` has valid `OPENROUTER_API_KEY`
- Verify the AI model is accessible
- Check Gradio terminal output for errors

### Issue: Invalid response format
**Solution:**
- Verify Gradio is returning JSON array with 3 objects
- Check AI prompt in `ai_features.py` is generating correct format
- Enable debug logging to see raw API responses

## Testing Checklist

- [ ] Gradio service starts successfully
- [ ] Gradio UI is accessible at http://localhost:7860
- [ ] Manual test in Gradio UI generates 3 announcements
- [ ] NestJS backend connects to Gradio service
- [ ] POST /announcements/generate returns 3 variations
- [ ] POST /announcements/generate-and-save saves to MongoDB
- [ ] Content moderation blocks inappropriate content
- [ ] Error responses are handled properly
- [ ] GET /announcements retrieves saved announcements

## Next Steps

1. Add authentication/authorization to announcement endpoints
2. Add rate limiting to prevent API abuse
3. Implement caching for similar requests
4. Add announcement templates for common scenarios
5. Create admin UI for managing announcements
6. Add email/notification integration to send announcements
