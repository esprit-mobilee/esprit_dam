# Chat Summarization AI Integration Guide

## Overview
This integration adds AI-powered chat summarization capabilities to the message management system using OpenRouter API with Mistral-7B model.

## Features
1. **Get Unread Messages**: Retrieve unread messages formatted for AI processing
2. **AI Summarization**: Automatically summarize unread messages using AI
3. **Mark as Read**: Mark messages as read after summarization

## New Files Created

### Services
- `src/message/services/ai-config.service.ts` - Configuration service for OpenRouter API
- `src/message/services/openrouter-client.service.ts` - HTTP client for OpenRouter API
- `src/message/services/chat-summarizer.service.ts` - Core summarization logic

### DTOs
- `src/message/dto/chat-summary-response.dto.ts` - Response format for summarization
- `src/message/dto/unread-message.dto.ts` - Format for unread messages

## Environment Variables
Add these to your `.env` file:
```env
OPENROUTER_API_KEY=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
MODEL_ID=mistralai/mistral-7b-instruct:free
```

## API Endpoints

### 1. Get Unread Messages
**Endpoint**: `GET /messages/unread/:userId/:otherUserId`

**Description**: Get unread messages between two users formatted for AI processing

**Response Format**:
```json
[
  {
    "sender": "David Johnson",
    "message": "Good morning! Just checking in on the project status."
  },
  {
    "sender": "David Johnson",
    "message": "I finished the draft of the report yesterday."
  }
]
```

**Example**:
```bash
curl http://localhost:3000/messages/unread/USER_ID_1/USER_ID_2
```

### 2. Summarize Unread Messages
**Endpoint**: `POST /messages/summarize/:userId/:otherUserId`

**Description**: Summarize unread messages using AI and mark them as read

**Response Format**:
```json
{
  "summary": "David provides a project status update, mentioning draft completion and remaining tasks.",
  "key_points": [
    "Draft report completed yesterday",
    "Charts and summary section still need to be added",
    "Plans to send completed version by end of today",
    "Needs to review feedback from last meeting",
    "Will prepare presentation slides afterwards"
  ]
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/messages/summarize/USER_ID_1/USER_ID_2
```

### 3. Mark Messages as Read
**Endpoint**: `POST /messages/mark-read/:userId/:otherUserId`

**Description**: Manually mark messages as read without summarization

**Response Format**:
```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/messages/mark-read/USER_ID_1/USER_ID_2
```

## Updated Files

### `message.service.ts`
Added three new methods:
- `getUnreadMessages(userId, otherUserId)` - Retrieves and formats unread messages
- `markMessagesAsRead(userId, otherUserId)` - Marks messages as read

### `message.controller.ts`
Added three new endpoints:
- `/unread/:userId/:otherUserId` - Get unread messages
- `/summarize/:userId/:otherUserId` - Summarize unread messages
- `/mark-read/:userId/:otherUserId` - Mark messages as read

### `message.module.ts`
Added new service providers:
- `AiConfigService`
- `OpenRouterClientService`
- `ChatSummarizerService`

### `package.json`
Added `axios` dependency for HTTP requests to OpenRouter API

## Installation Steps

1. **Install dependencies**:
```bash
cd /home/vanitas/Desktop/dam_sirine/esprit_dam
npm install
```

2. **Verify environment variables**:
Make sure `.env` file contains the OpenRouter API key:
```env
OPENROUTER_API_KEY=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
MODEL_ID=mistralai/mistral-7b-instruct:free
```

3. **Start the server**:
```bash
npm run start:dev
```

4. **Test the endpoints**:
Access Swagger documentation at `http://localhost:3000/api` to test the new endpoints

## How It Works

### Message Flow
1. User receives messages from another user
2. Messages are stored with `isRead: false` flag
3. When user opens chat, call `/messages/unread/:userId/:otherUserId`
4. Display unread messages to user
5. Call `/messages/summarize/:userId/:otherUserId` to get AI summary
6. Show summary to user (e.g., "You have 7 unread messages about project status")
7. Messages are automatically marked as read after summarization

### AI Processing
1. Unread messages are fetched from database
2. Messages are formatted with sender names (populated from User collection)
3. Formatted messages are sent to OpenRouter API with Mistral-7B model
4. AI returns a JSON object with summary and key points
5. Response is returned to client

### Error Handling
- If no unread messages exist, returns 400 Bad Request
- If API key is missing, throws configuration error
- If OpenRouter API fails, retries up to 4 times with exponential backoff
- If AI response is invalid JSON, returns detailed error message

## Testing

### Test Scenario 1: Get Unread Messages
```bash
# Assuming user1 has unread messages from user2
GET http://localhost:3000/messages/unread/67507925b99a5af69def7e14/67507925b99a5af69def7e15
```

### Test Scenario 2: Summarize Messages
```bash
# Summarize and mark as read
POST http://localhost:3000/messages/unread/67507925b99a5af69def7e14/67507925b99a5af69def7e15
```

### Test Scenario 3: Manual Mark as Read
```bash
# Mark as read without summarization
POST http://localhost:3000/messages/mark-read/67507925b99a5af69def7e14/67507925b99a5af69def7e15
```

## Integration with Frontend

### React Native / Mobile App Example
```typescript
// Get unread messages
const unreadMessages = await fetch(
  `${API_URL}/messages/unread/${userId}/${otherUserId}`
).then(res => res.json());

if (unreadMessages.length > 0) {
  // Show notification badge
  setBadgeCount(unreadMessages.length);
  
  // Get AI summary
  const summary = await fetch(
    `${API_URL}/messages/summarize/${userId}/${otherUserId}`,
    { method: 'POST' }
  ).then(res => res.json());
  
  // Show summary notification
  showNotification({
    title: `${unreadMessages.length} new messages`,
    body: summary.summary,
    details: summary.key_points
  });
}
```

### Web App Example
```javascript
// Check for unread messages on chat open
async function onChatOpen(userId, otherUserId) {
  try {
    const unreadMessages = await axios.get(
      `/messages/unread/${userId}/${otherUserId}`
    );
    
    if (unreadMessages.data.length > 0) {
      // Show summary modal
      const summary = await axios.post(
        `/messages/summarize/${userId}/${otherUserId}`
      );
      
      showSummaryModal({
        count: unreadMessages.data.length,
        summary: summary.data.summary,
        keyPoints: summary.data.key_points
      });
    }
  } catch (error) {
    console.error('Failed to get summary:', error);
  }
}
```

## Security Considerations
- API key is stored in environment variables, never exposed to client
- All endpoints should be protected with JWT authentication (add guards as needed)
- Rate limiting should be implemented to prevent API abuse
- User can only access their own messages (add validation in controller)

## Performance Optimization
- Consider caching summaries for frequently accessed conversations
- Implement background job processing for summarization
- Add pagination for large numbers of unread messages
- Monitor OpenRouter API usage and costs

## Troubleshooting

### Issue: "OPENROUTER_API_KEY not set"
**Solution**: Verify `.env` file exists and contains the API key

### Issue: Empty AI response
**Solution**: Check API key validity and OpenRouter service status

### Issue: "No unread messages to summarize"
**Solution**: Verify messages exist with `isRead: false` flag

### Issue: TypeScript compilation errors
**Solution**: Run `npm install` to install axios dependency

## Future Enhancements
1. Add support for multiple languages
2. Implement conversation sentiment analysis
3. Add custom summarization styles (brief, detailed, bullet points)
4. Cache summaries to reduce API calls
5. Add WebSocket support for real-time summarization
6. Implement batch summarization for multiple conversations
