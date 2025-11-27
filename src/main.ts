import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Préfixe global /api
  app.setGlobalPrefix('api');

  // Validation DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Gestion des exceptions
  app.useGlobalFilters(new AllExceptionsFilter());

  // ----- Swagger -----
  const config = new DocumentBuilder()
    .setTitle('API ESPRIT Connect')
    .setDescription('Documentation officielle de l’API ESPRIT Connect')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Bearer <token>',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Documentation API ESPRIT Connect',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT ?? 3000;

  // 🔥 IMPORTANT : Rendre le backend accessible sur le réseau
  await app.listen(port, '0.0.0.0');

  const url = await app.getUrl();

  console.log('===============================================');
  console.log(`🚀 Serveur en ligne : ${url}/api`);
  console.log(`📚 Swagger : ${url}/api-docs`);
  console.log('===============================================');
}

bootstrap();
/*
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  // CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Préfixe global /api
  app.setGlobalPrefix('api');

  // Validation DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Gestion des exceptions
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('API ESPRIT Connect')
    .setDescription('Documentation officielle de l’API ESPRIT Connect')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Bearer <token>',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Documentation API ESPRIT Connect',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT ?? 3000;

  // 🔥 IMPORTANT — Écoute sur toutes les interfaces réseau
  await app.listen(port, '0.0.0.0', () => {
    console.log(`🔥 Serveur accessible sur : http://0.0.0.0:${port}/api`);
  });

  const url = await app.getUrl();
  console.log('===============================================');
  console.log(`🚀 Serveur en ligne : ${url}/api`);
  console.log(`📚 Swagger : ${url}/api-docs`);
  console.log('===============================================');
}

bootstrap();
*/