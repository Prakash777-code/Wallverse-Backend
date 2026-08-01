import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {PrismaModule} from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';

@Module({
  controllers: [AuthController],
  providers: [AuthService,AuthGuard],
  imports:[PrismaModule,JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),CacheModule.register()],
    exports:[JwtModule,AuthGuard]
})
export class AuthModule {}
