import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 🧩 Feature Modules
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { AuthModule } from './auth/auth.module';
import { ClubsModule } from './clubs/clubs.module';


// 🛠️ Middleware
import { LoggerMiddleware } from './common/middlewear/logger.middleware';

@Module({
  imports: [
    // 🌍 Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // ✅ Explicitly specify .env file (good practice)
    }),

    // 💾 MongoDB connection (with safe fallback)
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/dam',
    ),

    // 📦 Application feature modules
    UtilisateursModule,
    AuthModule,
    ClubsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 🧾 Apply logger middleware to all routes
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
