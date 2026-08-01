import { Module } from '@nestjs/common';
import { FavouritesController } from './favourites.controller';
import { FavouritesService } from './favourites.service';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  controllers: [FavouritesController],
  providers: [FavouritesService,AuthGuard],
  imports:[AuthModule,CacheModule.register()]
})
export class FavouritesModule {}
