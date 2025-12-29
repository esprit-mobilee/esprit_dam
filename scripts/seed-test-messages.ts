import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Utilisateur } from '../src/utilisateurs/schemas/utilisateur.schema';
import { Message } from '../src/message/schemas/message.schema';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const utilisateurModel = app.get<Model<Utilisateur>>(
    getModelToken(Utilisateur.name),
  );
  const messageModel = app.get<Model<Message>>(getModelToken(Message.name));

  console.log('🌱 Starting to seed test data...');

  try {
    // 1. Create test users
    console.log('📝 Creating test users...');

    // Check if users already exist
    const existingUser1 = await utilisateurModel.findOne({ email: 'david.smith@test.com' });
    const existingUser2 = await utilisateurModel.findOne({ email: 'john.doe@test.com' });

    let user1, user2;

    if (!existingUser1) {
      user1 = await utilisateurModel.create({
        firstName: 'David',
        lastName: 'Smith',
        email: 'david.smith@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        identifiant: 'TEST001',
      });
      console.log('✅ Created user: David Smith');
    } else {
      user1 = existingUser1;
      console.log('ℹ️  User David Smith already exists');
    }

    if (!existingUser2) {
      user2 = await utilisateurModel.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        identifiant: 'TEST002',
      });
      console.log('✅ Created user: John Doe');
    } else {
      user2 = existingUser2;
      console.log('ℹ️  User John Doe already exists');
    }

    // 2. Delete existing messages between these users to start fresh
    console.log('🗑️  Cleaning up existing messages...');
    await messageModel.deleteMany({
      $or: [
        { senderId: user1._id, receiverId: user2._id },
        { senderId: user2._id, receiverId: user1._id },
      ],
    });

    // 3. Create test messages (David sending to John)
    console.log('💬 Creating test messages...');

    const testMessages = [
      {
        senderId: user1._id,
        receiverId: user2._id,
        content: 'Good morning! Just checking in on the project status.',
        isRead: false,
        type: 'text',
      },
      {
        senderId: user1._id,
        receiverId: user2._id,
        content: 'I finished the draft of the report yesterday.',
        isRead: false,
        type: 'text',
      },
      {
        senderId: user1._id,
        receiverId: user2._id,
        content: 'I still need to add the charts and update the summary section.',
        isRead: false,
        type: 'text',
      },
      {
        senderId: user1._id,
        receiverId: user2._id,
        content: 'Planning to send the completed version by end of today.',
        isRead: false,
        type: 'text',
      },
      {
        senderId: user1._id,
        receiverId: user2._id,
        content: 'Also, need to review the feedback from the last meeting.',
        isRead: false,
        type: 'text',
      },
      {
        senderId: user1._id,
        receiverId: user2._id,
        content: 'After that, I can start preparing the presentation slides.',
        isRead: false,
        type: 'text',
      },
      {
        senderId: user1._id,
        receiverId: user2._id,
        content: "Let me know if there's anything else I should focus on.",
        isRead: false,
        type: 'text',
      },
    ];

    // Add some delay between messages to simulate real conversation
    for (let i = 0; i < testMessages.length; i++) {
      const message = await messageModel.create(testMessages[i]);
      console.log(`✅ Created message ${i + 1}/${testMessages.length}: "${message.content.substring(0, 50)}..."`);
    }

    console.log('\n📊 Summary:');
    console.log(`- User 1: ${user1.firstName} ${user1.lastName} (${user1._id})`);
    console.log(`- User 2: ${user2.firstName} ${user2.lastName} (${user2._id})`);
    console.log(`- Messages created: ${testMessages.length}`);
    console.log('\n🎯 Test the summarization with:');
    console.log(`curl -X POST http://localhost:3000/messages/summarize/${user2._id}/${user1._id}`);
    console.log('\n✨ Done!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
