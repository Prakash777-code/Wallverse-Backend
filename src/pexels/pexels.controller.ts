import {
  Controller,
  Get,
  Inject,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { PexelsQueryDto } from './dto/pexels.quer.dto';
import { PexelsService } from './pexels.service';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Controller('pexels')
@SkipThrottle()
export class PexelsController {
  constructor(
    private pexlesService: PexelsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  async getWallpapers(@Query() pexelsQueryDto: PexelsQueryDto) {
    return this.pexlesService.getWallpapers(pexelsQueryDto);
  }

  @Get('download')
  @UseGuards(AuthGuard)
  async downloadImage(
    @Query('url') url: string,
    @Query('wallpaperId') wallpaperId: string,
    @Query('photographer') photographer: string,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    console.log('Reached download controller');
    console.log('URL:', url);
    console.log('USER:', request.user);
    console.log('Wallpaper ID:', wallpaperId);
    console.log('Photographer:', photographer);
    console.log('Reached download controller');

    const image = await this.pexlesService.downloadImage(url);

    await this.pexlesService.createDownload(
      request.user.userId,
      url,
      wallpaperId,
      photographer,
    );

    await this.cacheManager.del(`profile:${request.user.userId}`);

    console.log('Created download record');

    response.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'attachment; filename="wallverse.jpg"',
    });

    response.send(image);
  }
}
