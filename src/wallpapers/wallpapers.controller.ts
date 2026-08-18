import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PexelsQueryDto } from './dto/pexels.quer.dto';
import { WallpaperService } from './wallpapers.service';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DeleteDownloadDto } from './dto/deleteDownload.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadDto } from './dto/upload.dto';
import type {} from 'multer';

@Controller('pexels')
@SkipThrottle()
export class WallpapersController {
  constructor(
    private pexlesService: WallpaperService,
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

    await this.cacheManager.del(`downloads:${request.user.userId}`);

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

  @Get('downloaded')
  @UseGuards(AuthGuard)
  async getDownloads(@Req() request: Request) {
    console.log('Reached download');
    return this.pexlesService.getDownloads(request.user.userId);
  }

  @Delete('download')
  @UseGuards(AuthGuard)
  async removeDownloadImage(
    @Req() request: Request,
    @Body() dto: DeleteDownloadDto,
  ) {
    await this.cacheManager.del(`downloads:${request.user.userId}`)
    return this.pexlesService.removeDownloadImage(
      request.user.userId,
      dto.wallpaperId,
      dto.imageUrl,
    );
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("image"))
  async uploadWallpaper(
    @UploadedFile() image:Express.Multer.File,
    @Body() uploadDto:UploadDto,
    @Req() request:Request
  ){
    console.log("Reached uploadWallpaper function")
    console.log(image)
    console.log(uploadDto)
    return this.pexlesService.uploadWallpaper(image,uploadDto,request.user.userId)
  }
}
