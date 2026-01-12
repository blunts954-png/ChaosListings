import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
// import * as Sentry from '@sentry/node';
// import { ProfilingIntegration } from '@sentry/profiling-node';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';

import { AppModule } from './app.module';
import { PrismaService } from './common/services/prisma.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const environment = configService.get<string>('NODE_ENV', 'development');

  // Sentry (disabled for development without build tools)
  // Sentry.init({
  //   dsn: configService.get<string>('SENTRY_DSN'),
  //   environment,
  //   tracesSampleRate: 1.0,
  //   profilesSampleRate: 1.0,
  //   integrations: [new ProfilingIntegration()],
  // });

  // app.use(Sentry.Handlers.requestHandler());

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3001'),
    credentials: true,
  });
  app.use(cookieParser());
  app.use(csurf({ cookie: true }));

  // Global prefix
  app.setGlobalPrefix('api');

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
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

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // Sentry error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  // Prisma shutdown hook
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Swagger documentation
  if (environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Local Listings Engine API')
      .setDescription('Multi-tenant SaaS platform for managing local directory listings')
      .setVersion('1.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('agencies', 'Agency management')
      .addTag('businesses', 'Business profile management')
      .addTag('listings', 'Listings sync and optimization')
      .addTag('subscriptions', 'Billing and subscriptions')
      .addTag('webhooks', 'Webhook handlers')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        'JWT',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║   Local Listings Engine API                       ║
    ║   Environment: ${environment.padEnd(33)}║
    ║   Port: ${port.toString().padEnd(41)}║
    ║   Docs: http://localhost:${port}/api/docs${' '.repeat(15)}║
    ╚═══════════════════════════════════════════════════╝
  `);
}

bootstrap();
