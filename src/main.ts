import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  app.enableCors({
    origin: 'https://wallverse-eight.vercel.app',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
