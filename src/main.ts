import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import helmet from 'helmet';
import { PrismaSessionStore } from './prisma/session-store';
import { PrismaClient } from '@prisma/client';

const server = express();
let initialized = false;

async function bootstrap() {
  if (initialized) return;

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );

  // Security headers
  app.use(helmet());

  app.use(cookieParser());

  // Session & Passport Middleware
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(new PrismaClient()),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.setGlobalPrefix('api');

  // Swagger — disable in production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Kopiness Migration API')
      .setDescription('The Kopiness Migration API description')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  app.useGlobalInterceptors(
    new ResponseInterceptor()
  )

  // Enable CORS
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  });

  await app.init();
  initialized = true;

  if (process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 3001;
    await app.listen(PORT);
    console.log(`Server running on http://localhost:${PORT}/api`);
  }

}

export default bootstrap().then(() => server);