import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Storefront and admin run on different ports (real browser apps, not
  // the same origin as this API) — without this, every real request from
  // either Angular app is silently blocked by the browser's CORS policy,
  // which is invisible in any of the in-process supertest verification
  // done so far since supertest doesn't enforce CORS at all.
  app.enableCors({
    origin: [process.env.STOREFRONT_URL ?? 'http://localhost:4200', process.env.ADMIN_URL ?? 'http://localhost:4201'],
    credentials: true,
  });

  const config = new DocumentBuilder().setTitle('Beauty Platform API').setVersion('1.0').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
