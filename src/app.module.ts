import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature modules
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { AuthModule } from './auth/auth.module';
import { ClubsModule } from './clubs/clubs.module';
import { DocumentRequestModule } from './document-request/document-request.module';
import { EventsModule } from './events/events.module';
import { InternshipOfferModule } from './internship-offer/internship-offer.module';
import { ApplicationModule } from './application/application.module';
import { PostsModule } from './posts/posts.module';

// Middleware
import { LoggerMiddleware } from './common/middlewear/logger.middleware';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Env variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB connection
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/dam',
    ),

    // Feature modules
    UtilisateursModule,
    AuthModule,
    ClubsModule,
    DocumentRequestModule,
    EventsModule,
    InternshipOfferModule,
    ApplicationModule,
    PostsModule,
    NotificationsModule,     // ⭐ ADDED
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
