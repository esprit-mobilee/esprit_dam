# Testing Guide - Chat Summarization Integration

## ✅ Tests Status

### Message Module Tests
All tests are **PASSING** ✓

- **message.service.spec.ts**: Tests for MessageService
- **message.controller.spec.ts**: Tests for MessageController

```bash
Test Suites: 2 passed, 2 total
Tests:       4 passed, 4 total
```

## Running Tests

### Run All Tests
```bash
cd /home/vanitas/Desktop/dam_sirine/esprit_dam
npm test
```

### Run Message Module Tests Only
```bash
npm test -- message
```

### Run Tests with Coverage
```bash
npm test:cov
```

### Run Tests in Watch Mode
```bash
npm test:watch
```

## Test Coverage

### MessageService Tests
- ✓ Service should be defined
- ✓ getUnreadMessages should return formatted unread messages

### MessageController Tests
- ✓ Controller should be defined
- ✓ summarizeUnreadMessages should call service methods and return summary

## What Was Tested

### 1. Message Service (`message.service.spec.ts`)
- Service initialization and dependency injection
- `getUnreadMessages()` method that:
  - Queries unread messages between two users
  - Populates sender information
  - Formats messages for AI summarization
  - Returns array with `{sender, message}` format

### 2. Message Controller (`message.controller.spec.ts`)
- Controller initialization with all dependencies
- `summarizeUnreadMessages()` endpoint that:
  - Calls `MessageService.getUnreadMessages()`
  - Passes messages to `ChatSummarizerService.summarize()`
  - Marks messages as read after summarization
  - Returns AI-generated summary

## Integration Testing

### Prerequisites
1. **ConvoSummarizer Service Running**
   ```bash
   cd /home/vanitas/Desktop/dam_sirine/ConvoSummarizer
   source .venv/bin/activate
   python app.py
   ```
   Service should be running on: `http://localhost:7861`

2. **MongoDB Running**
   ```bash
   # Check if MongoDB is running
   systemctl status mongod
   ```

3. **Environment Variables Set**
   ```bash
   # In esprit_dam/.env
   CONVO_SUMMARIZER_URL=http://localhost:7861
   MONGODB_URI=mongodb://localhost:27017/your_database
   ```

### Manual Integration Test

#### Step 1: Start the ConvoSummarizer Service
```bash
cd /home/vanitas/Desktop/dam_sirine/ConvoSummarizer
source .venv/bin/activate
python app.py
```

Expected output:
```
Running on local URL:  http://127.0.0.1:7861
```

#### Step 2: Start the NestJS Backend
```bash
cd /home/vanitas/Desktop/dam_sirine/esprit_dam
npm run start:dev
```

#### Step 3: Test the Summarization Endpoint

**Using curl:**
```bash
# Assuming you have unread messages between user1 and user2
curl -X POST http://localhost:3000/messages/summarize/user1Id/user2Id
```

**Expected Response:**
```json
{
  "summary": "David sent 7 messages about the project report...",
  "keyPoints": [
    "Completed draft yesterday",
    "Still needs charts and summary",
    "Will send completed version today",
    "Needs to review meeting feedback",
    "Will prepare presentation slides"
  ],
  "messageCount": 7,
  "timestamp": "2025-12-04T..."
}
```

**Using Postman:**
1. Method: POST
2. URL: `http://localhost:3000/messages/summarize/:userId/:otherUserId`
3. Replace `:userId` and `:otherUserId` with actual user IDs
4. Send request

#### Step 4: Verify Messages Marked as Read
```bash
# Check that messages are now marked as read
curl http://localhost:3000/messages/conversation/user1Id/user2Id
```

## Test Data Format

The system expects messages in this format:
```json
[
  {
    "sender": "David",
    "message": "Good morning! Just checking in on the project status."
  },
  {
    "sender": "David",
    "message": "I finished the draft of the report yesterday."
  }
]
```

## Troubleshooting

### Test Failures

#### "Cannot find module '@nestjs/axios'"
**Solution:**
```bash
npm install @nestjs/axios
```

#### "Nest can't resolve dependencies of MessageService"
**Solution:** Mock dependencies in test file:
```typescript
{
  provide: getModelToken(Message.name),
  useValue: mockMessageModel,
}
```

#### "ChatSummarizerService is not defined"
**Solution:** Add mock in controller tests:
```typescript
{
  provide: ChatSummarizerService,
  useValue: mockChatSummarizerService,
}
```

### Integration Issues

#### ConvoSummarizer Not Responding
**Check:**
1. Service is running: `http://localhost:7861`
2. No firewall blocking the port
3. Python dependencies installed
4. `.env` file configured correctly

#### "No unread messages to summarize"
**Check:**
1. Messages exist in database
2. Messages have `isRead: false`
3. User IDs are correct
4. Messages are between the specified users

#### Timeout Errors
**Solutions:**
1. Increase axios timeout in `ChatSummarizerService`
2. Check ConvoSummarizer logs
3. Verify LLM is responding

## Next Steps

1. **Add E2E Tests**: Create end-to-end tests with real MongoDB
2. **Performance Tests**: Test with large message batches
3. **Error Handling Tests**: Test edge cases and failures
4. **Load Tests**: Test concurrent summarization requests

## Files Modified for Testing

```
esprit_dam/
├── src/message/
│   ├── message.service.spec.ts      ✅ Updated with proper mocks
│   ├── message.controller.spec.ts   ✅ Updated with proper mocks
│   └── services/
│       └── chat-summarizer.service.ts  ✅ Created
├── package.json                      ✅ Updated Jest config
└── .env                             ✅ Added CONVO_SUMMARIZER_URL
```

## Additional Resources

- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Gradio Documentation](https://gradio.app/docs/)
- [Chat Summarization Integration Guide](./CHAT_SUMMARIZATION_INTEGRATION.md)
