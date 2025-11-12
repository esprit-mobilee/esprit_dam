import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as os from 'os';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

// 🔎 récupère automatiquement l'adresse IPv4 locale (Wi-Fi)
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
  // ⬅️ on crée l'app en NestExpress pour pouvoir servir des fichiers statiques
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ✅ Préfixe global
  app.setGlobalPrefix('api');

  // ✅ Validation DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ✅ Filtres globaux
  app.useGlobalFilters(new AllExceptionsFilter());

  // ✅ servir les fichiers uploadés (logos, etc.)
  // -> un logo sauvegardé dans ./uploads/logos/xxx.png sera dispo sur
  // http://IP:3000/uploads/logos/xxx.png
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

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

  const port = process.env.PORT ?? 3000;
  const localIp = getLocalIp();

  await app.listen(port, '0.0.0.0');

  console.log('✅ ValidationPipe & AllExceptionsFilter activés');
  console.log(`🚀 Serveur en ligne (PC) : http://localhost:${port}/api`);
  console.log(`📚 Swagger (PC) : http://localhost:${port}/api-docs`);
  console.log(`🌐 Depuis mobile : http://${localIp}:${port}/api`);
  console.log(`📚 Swagger (réseau) : http://${localIp}:${port}/api-docs`);
}

bootstrap();
