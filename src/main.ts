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

const server = express();
let initialized = false;

async function bootstrap() {
  if (initialized) return;

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );

  app.use(cookieParser());

  // Session & Passport Middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'kopiness-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: false,
      httpOnly: true,
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.setGlobalPrefix('api');

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Kopiness Migration API')
    .setDescription('The Kopiness Migration API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalInterceptors(
    new ResponseInterceptor()
  )

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  });

  await app.init();
  initialized = true;

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT);
  console.log(`🚀 Server running on http://localhost:${PORT}/api`);

}

bootstrap();

export default server;