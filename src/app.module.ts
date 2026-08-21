import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FavouritesModule } from './favourites/favourites.module';
import { WallpapersModule } from './wallpapers/wallpapers.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FavouritesModule,
    WallpapersModule,
    CacheModule.register({isGlobal:true, ttl:30*60*1000}),
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
