import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import {  CacheModule } from '@nestjs/cache-manager';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService,AuthGuard],
  imports:[PrismaModule,PassportModule,JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),CacheModule.register()],
    exports:[JwtModule,AuthGuard,AuthService]
})
export class AuthModule {}
