import { Module } from '@nestjs/common';
import { FavouritesController } from './favourites.controller';
import { FavouritesService } from './favourites.service';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';


@Module({
  controllers: [FavouritesController],
  providers: [FavouritesService,AuthGuard],
  imports:[AuthModule]
})
export class FavouritesModule {}
