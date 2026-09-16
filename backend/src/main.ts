import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend clients
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Global DTO Validation Pipe
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

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`🚀 Job Queue Backend running on: http://localhost:${port}`);
  logger.log(`📋 API Endpoints:`);
  logger.log(`   POST   http://localhost:${port}/jobs`);
  logger.log(`   GET    http://localhost:${port}/jobs`);
  logger.log(`   GET    http://localhost:${port}/jobs/metrics`);
  logger.log(`   PATCH  http://localhost:${port}/jobs/:id/status`);
  logger.log(`   DELETE http://localhost:${port}/jobs/:id`);
  logger.log(`=======================================================`);
}

bootstrap();
