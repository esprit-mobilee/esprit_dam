import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 🧩 Feature Modules
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { AuthModule } from './auth/auth.module';
import { ClubsModule } from './clubs/clubs.module';
import { DocumentRequestModule } from './document-request/document-request.module';
import { InternshipOfferModule } from './internship-offer/internship-offer.module';
import { ApplicationModule } from './application/application.module';
import { EventsModule } from './events/events.module';

// 🛠️ Middleware
import { LoggerMiddleware } from './common/middlewear/logger.middleware';

@Module({
  imports: [
    // 🌍 Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 💾 MongoDB connection (with safe fallback)
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/dam',
    ),

    // 📦 Application feature modules
    UtilisateursModule,
    AuthModule,
    ClubsModule,
    DocumentRequestModule,
    EventsModule,
    InternshipOfferModule,
    ApplicationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
