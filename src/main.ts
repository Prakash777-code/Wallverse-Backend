import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  app.enableCors({
    origin: ['http://localhost:3000', 'https://wallverse-eight.vercel.app'],
    credentials: true,
  });

   const config = new DocumentBuilder()
    .setTitle('WallVerse API')
    .setDescription('API documentation for WallVerse')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);
  
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();