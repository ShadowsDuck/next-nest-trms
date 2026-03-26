import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Project description
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Enable cookie parser
  app.use(cookieParser());

  // Enable Scalar
  const config = new DocumentBuilder()
    .setTitle('TRMS API')
    .setDescription('Training Record Management System API')
    .setVersion('1.0')
    .addCookieAuth(
      'access_token', // ชื่อคุกกี้ที่ตั้งไว้ใน Controller
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'Enter your Access Token',
      },
      'JWT-auth', // Security name ที่จะเอาไปใช้ใน @ApiSecurity()
    )
    .addCookieAuth(
      'refresh_token',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'refresh_token',
        description: 'Enter your Refresh Token',
      },
      'JWT-refresh',
    )
    .addServer(`http://localhost:${process.env.PORT}`, 'Development server')
    .build();

  const rawDocument = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(rawDocument));
  app.use(
    '/api/docs',
    apiReference({
      content: cleanupOpenApiDoc(rawDocument),
      orderSchemaPropertiesBy: 'preserve',
      orderRequiredPropertiesFirst: false,
    }),
  );

  await app.listen(process.env.PORT);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
