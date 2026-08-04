import { Controller, Get, Query, Res } from '@nestjs/common';
import { PexelsQueryDto } from './dto/pexels.quer.dto';
import { PexelsService } from './pexels.service';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';

@Controller('pexels')
@SkipThrottle()
export class PexelsController {
  constructor(private pexlesService: PexelsService) {}

  @Get()
  async getWallpapers(@Query() pexelsQueryDto: PexelsQueryDto) {
    return this.pexlesService.getWallpapers(pexelsQueryDto);
  }

  @Get('download')
  async downloadImage(@Query('url') url: string, @Res() response: Response) {
    const image = await this.pexlesService.downloadImage(url);

    response.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'attachment; filename="wallverse.jpg"',
    });

    response.send(image);
  }
}
