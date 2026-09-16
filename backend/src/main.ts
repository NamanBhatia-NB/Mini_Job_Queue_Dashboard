import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

let cachedServer: any;

async function createNestServer() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();
  return app.getHttpAdapter().getInstance();
}

// Export default handler for Vercel Serverless Function
export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = await createNestServer();
  }
  return cachedServer(req, res);
}

// Standalone execution for local development
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`🚀 Job Queue Backend running on: http://localhost:${port}`);
  logger.log(`📋 Connected to Neon PostgreSQL Database`);
  logger.log(`=======================================================`);
}

if (!process.env.VERCEL) {
  bootstrap();
}
