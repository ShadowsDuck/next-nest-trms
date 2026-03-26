import { apiReference } from '@scalar/nestjs-api-reference';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Project description
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  });

  // Enable Scalar
  const config = new DocumentBuilder()
    .setTitle('TRMS API')
    .setDescription('Training Record Management System API')
    .setVersion('1.0')
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
