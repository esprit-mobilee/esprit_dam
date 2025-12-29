// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as os from 'os';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

// 🔎 récupère automatiquement l'adresse IPv4 locale
function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const netIfaces = interfaces[name];
    if (!netIfaces) continue;
    for (const iface of netIfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

async function bootstrap() {
  // 🔎 Récupérer l'adresse IP locale
  const localIp = getLocalIp();

  // ⚠ obligatoire pour servir les fichiers (pdf, images…)
  // 👇 On tape l'app en NestExpressApplication pour avoir useStaticAssets typé
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ Autoriser les requêtes depuis le front (utile pour React, Angular ou Flutter)
  app.enableCors({
    origin: '*', // tu peux restreindre à ton domaine plus tard
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ✅ Préfixe global pour toutes les routes
  app.setGlobalPrefix('api');

  // ---------- VALIDATION PIPE ----------
  // ✅ Préfixe global pour toutes les routes
  app.setGlobalPrefix('api');

  // ✅ servir les fichiers uploadés (logos, images, etc.)
  // -> un fichier ./uploads/logos/xxx.png sera dispo sur :
  //    http://IP:3000/api/uploads/logos/xxx.png (matches global prefix)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/uploads',
  });

  // ✅ Validation DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints || {};
          const property = error.property;
          const errorMessages = Object.values(constraints);
          return `${property}: ${errorMessages.join(', ')}`;
        });
        return new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: messages,
            error: 'Validation Error',
          },
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );

  // ✅ Gestion globale des exceptions
  app.useGlobalFilters(new AllExceptionsFilter());

  // ---------- SERVIR LES FICHIERS UPLOADÉS ----------
  // contient : /uploads/logos, /uploads/cv, /uploads/events …
  // accessible depuis mobile : http://IP:3000/uploads/xxx


  // ---------- SWAGGER ----------
  // ✅ Swagger
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
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Documentation API ESPRIT Connect',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // ✅ Lancer le serveur
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');


  console.log('🚀 Serveur démarré avec validation DTO et filtres globaux');
  console.log(`🌐 Local   : http://localhost:${port}/api`);
  console.log(`📱 Mobile  : http://${localIp}:${port}/api`);
  console.log(`📚 Swagger : http://${localIp}:${port}/api-docs`);
  console.log(`📁 Uploads accessibles sur : http://${localIp}:${port}/api/uploads/...`);
}

bootstrap();
