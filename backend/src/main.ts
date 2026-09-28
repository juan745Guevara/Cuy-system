import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RequestMethod } from '@nestjs/common';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    console.error(
      'JWT_SECRET is not set. Configure it in .env before starting the server (see .env.example).',
    );
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.use(helmet());
  app.enableCors({ origin: allowedOrigins });

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'api/health', method: RequestMethod.GET }],
  });

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  console.log(`Server running on port ${port} (NestJS)`);
}

bootstrap();
