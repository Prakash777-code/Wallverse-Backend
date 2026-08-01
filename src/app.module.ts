import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FavouritesModule } from './favourites/favourites.module';
import { PexelsModule } from './pexels/pexels.module';
import { FavouritesService } from './favourites/favourites.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    AuthModule,
    FavouritesModule,
    PexelsModule,
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
