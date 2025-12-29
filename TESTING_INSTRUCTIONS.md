# 🚀 Testing the Chat Summarization Feature

##  Current Status

✅ **Test Data Created Successfully!**
- User 1: David Smith (ID: `69316d85b25f4b56579930d3`)
- User 2: John Doe (ID: `69316d85b25f4b56579930d5`)
- 7 unread messages from David to John

✅ **Backend Running**
- NestJS server is running on `http://localhost:3000`
- Endpoint registered: `POST /api/messages/summarize/:userId/:otherUserId`

## 🔧 Steps to Test

### Step 1: Start ConvoSummarizer Service

Open a new terminal and run:

```bash
cd /home/vanitas/Desktop/dam_sirine/ConvoSummarizer

# Activate virtual environment
source .venv/bin/activate

# Install dependencies if not already installed
pip install -r requirements.txt

# Start the service
python app.py
```

**Expected output:**
```
Running on local URL:  http://127.0.0.1:7861
```

### Step 2: Test the Summarization Endpoint

Open another terminal and run:

```bash
curl -X POST http://localhost:3000/api/messages/summarize/69316d85b25f4b56579930d5/69316d85b25f4b56579930d3
```

**Parameter explanation:**
- First ID (`69316d85b25f4b56579930d5`): John's ID (receiver - the one summarizing)
- Second ID (`69316d85b25f4b56579930d3`): David's ID (sender - whose messages to summarize)

### Step 3: Expected Response

You should receive a JSON response like:

```json
{
  "summary": "David provided an update on the project report...",
  "keyPoints": [
    "Finished the draft yesterday",
    "Still needs to add charts and update summary section",
    "Planning to send completed version by end of today",
    "Needs to review feedback from last meeting",
    "Will prepare presentation slides after review"
  ],
  "messageCount": 7,
  "timestamp": "2025-12-04T..."
}
```

## 📊 Verify Messages Were Marked as Read

After summarization, check that messages are marked as read:

```bash
cd /home/vanitas/Desktop/dam_sirine/esprit_dam
./scripts/check-messages.sh
```

All messages should now have `isRead: true`.

## 🧪 Alternative: Test with Postman

1. Open Postman
2. Create a new POST request
3. URL: `http://localhost:3000/api/messages/summarize/69316d85b25f4b56579930d5/69316d85b25f4b56579930d3`
4. Send the request
5. View the AI-generated summary

## 🔄 Reset Test Data

To create fresh test messages:

```bash
cd /home/vanitas/Desktop/dam_sirine/esprit_dam
npm run seed:messages
```

This will:
- Create/verify test users exist
- Delete existing messages between them
- Create 7 new unread messages
- Display the new user IDs to use

## 📝 Check Messages in Database

To see all messages:

```bash
mongosh dam --eval "db.messages.find().pretty()"
```

To count unread messages:

```bash
mongosh dam --eval "db.messages.countDocuments({ isRead: false })"
```

## 🐛 Troubleshooting

### ConvoSummarizer Not Starting

**Error:** `ModuleNotFoundError: No module named 'gradio'`

**Solution:**
```bash
cd /home/vanitas/Desktop/dam_sirine/ConvoSummarizer
source .venv/bin/activate
pip install -r requirements.txt
```

### "No unread messages to summarize"

**Causes:**
1. Messages are already marked as read
2. Using wrong user IDs
3. No messages exist between the users

**Solutions:**
1. Run `npm run seed:messages` to create fresh messages
2. Use the IDs from the seed output
3. Verify messages with `./scripts/check-messages.sh`

### Connection Timeout

**Cause:** ConvoSummarizer service is not running

**Solution:** Make sure ConvoSummarizer is running on port 7861

### Backend Not Responding

**Solution:**
```bash
# Stop any running instance
pkill -f "nest start"

# Start fresh
cd /home/vanitas/Desktop/dam_sirine/esprit_dam
npm run start:dev
```

## 📚 API Endpoints

### Summarize Unread Messages
```
POST /api/messages/summarize/:userId/:otherUserId
```
- Returns AI-generated summary
- Marks messages as read automatically

### Get Unread Messages
```
GET /api/messages/unread/:userId/:otherUserId
```
- Returns list of unread messages
- Does NOT mark as read

### Mark Messages as Read
```
POST /api/messages/mark-read/:userId/:otherUserId
```
- Manually marks messages as read
- Returns success message

## 🎯 Next Steps

1. ✅ Test the summarization with the command above
2. Verify messages are marked as read
3. Test with different message content
4. Integrate with mobile frontend
5. Add caching for summaries
6. Monitor AI performance

---

**Quick Commands:**

```bash
# Terminal 1: ConvoSummarizer
cd /home/vanitas/Desktop/dam_sirine/ConvoSummarizer && source .venv/bin/activate && python app.py

# Terminal 2: Test
curl -X POST http://localhost:3000/api/messages/summarize/69316d85b25f4b56579930d5/69316d85b25f4b56579930d3

# Reset data
cd /home/vanitas/Desktop/dam_sirine/esprit_dam && npm run seed:messages
```
