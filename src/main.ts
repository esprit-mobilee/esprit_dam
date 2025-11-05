import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Autoriser les requêtes depuis le front (utile pour React, Angular ou Flutter)
  app.enableCors({
    origin: '*', // tu peux restreindre à ton domaine plus tard
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ✅ Préfixe global pour toutes les routes
  app.setGlobalPrefix('api');

  // ✅ Validation automatique des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ignore les propriétés non déclarées dans le DTO
      transform: true, // convertit automatiquement les types (string → number, etc.)
      forbidNonWhitelisted: true, // bloque les champs non autorisés
    }),
  );

  // ✅ Gestion globale des exceptions
  app.useGlobalFilters(new AllExceptionsFilter());

  // 🚀 Configuration Swagger (Documentation de l'API)
  const config = new DocumentBuilder()
    .setTitle('API ESPRIT Connect')
    .setDescription(
      'Documentation officielle de l’API ESPRIT Connect (Clubs, Étudiants, Administration, Authentification)',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Entrez votre token JWT au format : Bearer <votre_token>',
        in: 'header',
      },
      'access-token', // nom du schéma de sécurité
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Documentation API ESPRIT Connect',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // ✅ Lancer le serveur
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log('✅ ValidationPipe & AllExceptionsFilter activés');
  console.log(`🚀 Serveur en ligne : http://localhost:${port}/api`);
  console.log('📦 MongoDB connecté via MongooseModule (voir app.module.ts)');
  console.log(`📚 Swagger disponible sur : http://localhost:${port}/api-docs`);
}

bootstrap();
