import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { LoggerMiddleware } from './common/middlewear/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { ClubsModule } from './clubs/clubs.module';

@Module({
  imports: [
    // ✅ Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ✅ MongoDB connection (safe for TS)
    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://localhost:27017/dam'),

    UtilisateursModule,
    AuthModule,
    ClubsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
