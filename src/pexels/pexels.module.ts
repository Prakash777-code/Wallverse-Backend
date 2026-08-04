import { Module } from '@nestjs/common';
import { PexelsController } from './pexels.controller';
import { PexelsService } from './pexels.service';
import { HttpModule } from '@nestjs/axios';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [PexelsController],
  providers: [PexelsService, AuthGuard],
  imports:[HttpModule,AuthModule]
})
export class PexelsModule {}
