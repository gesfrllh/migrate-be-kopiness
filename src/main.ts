import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
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
const logger = new Logger('HTTP');

async function bootstrap() {
  if (initialized) return;

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );

  // Security headers
  app.use(helmet());

  app.use(cookieParser());
  app.use((req, res, next) => {
    const unsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const origin = req.get('origin');
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:7243',
      process.env.CORS_ORIGIN,
    ].filter((value): value is string => Boolean(value));

    // Cookie-authenticated browser writes must originate from this app.
    if (unsafeMethod && req.cookies?.access_token && (!origin || !allowedOrigins.includes(origin))) {
      return res.status(403).json({ message: 'Invalid request origin' });
    }
    next();
  });
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
    });
    next();
  });

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
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

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
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        'http://localhost:3000',
        'http://localhost:7243',
        process.env.CORS_ORIGIN,
      ].filter(Boolean);
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
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
