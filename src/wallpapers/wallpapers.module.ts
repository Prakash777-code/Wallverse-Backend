import { Module } from '@nestjs/common';
import { WallpapersController } from './wallpapers.controller';
import { WallpaperService } from './wallpapers.service';
import { HttpModule } from '@nestjs/axios';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  controllers: [WallpapersController],
  providers: [WallpaperService, AuthGuard],
  imports: [HttpModule, AuthModule, CloudinaryModule],
})
export class WallpapersModule {}
