import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WallpapersModule } from './web/wallpapers/wallpapers.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './web/user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { APP_GUARD } from '@nestjs/core';
import { MobileModule } from './mobile/mobile.module';
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './web/auth/auth.module';
import { FavouritesModule } from './web/favourites/favourites.module';
import { AiModule } from './web/ai/ai.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FavouritesModule,
    WallpapersModule,
    CacheModule.register({ isGlobal: true, ttl: 30 * 60 * 1000 }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    UserModule,
    AiModule,
    AdminModule,
    CloudinaryModule,
    MobileModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
