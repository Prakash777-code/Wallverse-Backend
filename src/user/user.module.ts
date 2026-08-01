import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  controllers: [UserController],
  providers: [UserService,AuthGuard],
  imports:[AuthModule,CacheModule.register()]
})
export class UserModule {}
