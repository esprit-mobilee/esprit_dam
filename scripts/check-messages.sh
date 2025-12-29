#!/bin/bash

echo "🔍 Checking messages in database..."
echo ""

mongosh dam --eval "
  db.messages.find({}, { senderId: 1, receiverId: 1, content: 1, isRead: 1 }).pretty()
" --quiet

echo ""
echo "📊 Message count:"
mongosh dam --eval "db.messages.countDocuments()" --quiet

echo ""
echo "👥 Users:"
mongosh dam --eval "
  db.utilisateurs.find({ email: { \$in: ['david.smith@test.com', 'john.doe@test.com'] } }, { _id: 1, firstName: 1, lastName: 1, email: 1 }).pretty()
" --quiet
