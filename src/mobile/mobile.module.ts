import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { JwtStrategy } from './jwtStrategy';
import { PassportModule } from '@nestjs/passport';
import { MobileAuthController } from './auth/mobileAuth.controller';
import { MobileAuthService } from './auth/mobileAuthService';
import { MobileWallpaperService } from './wallpaper/wallpaper.service';
import { MobileWallpaperController } from './wallpaper/wallpaper.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';


@Module({
  providers: [JwtStrategy,MobileAuthService,MobileWallpaperService],
  controllers: [MobileAuthController,MobileWallpaperController],
  imports: [
    PrismaModule,
    PassportModule,
    CloudinaryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    AuthModule,
  ],
})
export class MobileModule {}