#!/bin/bash

# Test script for AI Announcement Integration

echo "🔍 Testing AI Announcement Integration..."
echo ""

# Test 1: Check if Gradio service is running
echo "1. Checking Gradio service..."
if curl -s http://localhost:7860 > /dev/null; then
    echo "   ✅ Gradio service is running on port 7860"
else
    echo "   ❌ Gradio service is NOT running"
    echo "   Please start it with: cd campus-annocement-generator && python main.py"
    exit 1
fi
echo ""

# Test 2: Test announcement generation (no save)
echo "2. Testing announcement generation (without saving)..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/announcements/generate \
  -H "Content-Type: application/json" \
  -d '{
    "audience": "students",
    "instruction": "Final exams will take place next week. Please review the exam schedule and prepare accordingly."
  }')

if echo "$RESPONSE" | grep -q "announcements"; then
    echo "   ✅ Generate endpoint working"
    echo "   Response preview:"
    echo "$RESPONSE" | jq '.announcements[0].title' 2>/dev/null || echo "   (Install jq for prettier output)"
else
    echo "   ❌ Generate endpoint failed"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 3: Test announcement generation and save
echo "3. Testing announcement generation with save..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/announcements/generate-and-save \
  -H "Content-Type: application/json" \
  -d '{
    "audience": "administrative staff",
    "instruction": "Staff meeting scheduled for Friday at 2 PM in the main conference room.",
    "senderId": "admin123"
  }')

if echo "$RESPONSE" | grep -q "_id"; then
    echo "   ✅ Generate-and-save endpoint working"
    echo "   Announcements saved to database"
else
    echo "   ❌ Generate-and-save endpoint failed"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 4: List all announcements
echo "4. Listing all announcements..."
RESPONSE=$(curl -s http://localhost:3000/api/announcements)
COUNT=$(echo "$RESPONSE" | jq '.announcements | length' 2>/dev/null || echo "?")
echo "   📊 Total announcements in database: $COUNT"
echo ""

echo "✨ Integration test complete!"
