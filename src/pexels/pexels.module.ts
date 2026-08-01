import { Module } from '@nestjs/common';
import { PexelsController } from './pexels.controller';
import { PexelsService } from './pexels.service';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  controllers: [PexelsController],
  providers: [PexelsService],
  imports:[HttpModule,CacheModule.register()]
})
export class PexelsModule {}
