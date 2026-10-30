import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  controllers: [AiController],
  providers: [AiService,AuthGuard],
  imports:[AuthModule,CacheModule.register()]
})
export class AiModule {}
