import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as os from 'os';

// 🔎 récupère automatiquement l'adresse IPv4 locale (Wi-Fi)
function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const netIfaces = interfaces[name];
    if (!netIfaces) continue;
    for (const iface of netIfaces) {
      // on veut l'IPv4, non interne
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  // fallback
  return 'localhost';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Autoriser les requêtes depuis le front (utile pour React, Angular, Flutter ou Android)
  app.enableCors({
    origin: '*', // tu peux restreindre à ton IP ou ton domaine plus tard
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
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
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Documentation API ESPRIT Connect',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT ?? 3000;
  const localIp = getLocalIp(); // 👈 ici on récupère ton IP courante

  // ✅ Lancer le serveur sur toutes les interfaces réseau (important pour Android)
  await app.listen(port, '0.0.0.0');

  console.log('✅ ValidationPipe & AllExceptionsFilter activés');
  console.log(`🚀 Serveur en ligne (PC) : http://localhost:${port}/api`);
  console.log(`📚 Swagger (PC) : http://localhost:${port}/api-docs`);
  console.log(`🌐 Depuis Android / téléphone : http://${localIp}:${port}/api`);
  console.log(`📚 Swagger (réseau) : http://${localIp}:${port}/api-docs`);
}

bootstrap();
