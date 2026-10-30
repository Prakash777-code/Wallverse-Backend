import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwtStrategy';
import { PassportModule } from '@nestjs/passport';
import { MobileAuthController } from './auth/mobileAuth.controller';
import { MobileAuthService } from './auth/mobileAuthService';
import { MobileWallpaperService } from './wallpaper/wallpaper.service';
import { MobileWallpaperController } from './wallpaper/wallpaper.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { EmailService } from './auth/email.service';
import { AuthModule } from '../web/auth/auth.module';
import { MobileReports } from './reports/reports.controller';
import { ReportsModule } from '../reports/reports.module';


@Module({
  providers: [JwtStrategy,MobileAuthService,MobileWallpaperService,EmailService],
  controllers: [MobileAuthController,MobileWallpaperController,MobileReports],
  imports: [
    PrismaModule,
    PassportModule,
    CloudinaryModule,
    ReportsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    AuthModule,
  ],
})
export class MobileModule {}