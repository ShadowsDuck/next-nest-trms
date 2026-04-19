import { apiReference } from '@scalar/nestjs-api-reference';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  const port = Number(process.env.PORT ?? 3000);

  // Project description
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  if (process.env.TRUST_PROXY === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

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
    .addServer(`http://localhost:${port}`, 'Development server')
    .build();

  const rawDocument = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(rawDocument));
  app.use(
    '/docs/api-reference',
    apiReference({
      content: cleanupOpenApiDoc(rawDocument),
      orderSchemaPropertiesBy: 'preserve',
      orderRequiredPropertiesFirst: false,
    }),
  );

  await app.listen(port);
  logger.log(`API is running at ${await app.getUrl()}/api`);
  logger.log(`API docs are available at ${await app.getUrl()}/docs`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Error during bootstrap',
    err instanceof Error ? err.stack : undefined,
  );
  process.exit(1);
});
