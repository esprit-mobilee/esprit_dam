import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
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
  // ⚠ obligatoire pour servir les fichiers (pdf, images…)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ---------- CORS ----------
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ---------- Préfix global ----------
  app.setGlobalPrefix('api');

  // ---------- VALIDATION PIPE ----------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ---------- GLOBAL EXCEPTION FILTER ----------
  app.useGlobalFilters(new AllExceptionsFilter());

  // ---------- SERVIR LES FICHIERS UPLOADÉS ----------
  // contient : /uploads/logos, /uploads/cv, /uploads/events …
  // accessible depuis mobile : http://IP:3000/uploads/xxx
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // important : le slash final
  });

  // ---------- SWAGGER ----------
  const config = new DocumentBuilder()
    .setTitle('API ESPRIT Connect')
    .setDescription(
      `Documentation API (Clubs, Événements, Stages, Applications, Auth, Administration)`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description:
          'Token JWT — utilisez : Bearer <votre_token>',
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

  // ---------- START SERVER ----------
  const port = process.env.PORT ?? 3000;
  const localIp = getLocalIp();

  await app.listen(port, '0.0.0.0');

  console.log('🚀 Serveur démarré avec validation DTO et filtres globaux');
  console.log(`🌐 Local   : http://localhost:${port}/api`);
  console.log(`📱 Mobile  : http://${localIp}:${port}/api`);
  console.log(`📚 Swagger : http://${localIp}:${port}/api-docs`);
  console.log(`📁 Uploads accessibles sur : http://${localIp}:${port}/uploads/...`);
}

bootstrap();
