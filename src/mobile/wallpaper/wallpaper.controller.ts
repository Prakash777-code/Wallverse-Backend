import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MobilePexelsQueryDto } from './dtos/query.dto';
import { MobileWallpaperService } from './wallpaper.service';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { AuthRequest } from '../authRequest';
import { MobileFavouriteDto } from './dtos/favourite.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { MobileUploadDto } from './dtos/upload.dto';

@Controller('mobile/wallpaper')
@UseGuards(AuthGuard('jwt'))
export class MobileWallpaperController {
  constructor(private wallpaperService: MobileWallpaperService) {}

  @Get()
  @SkipThrottle()
  async getWallpapers(
    @Query() pexelsQueryDto: MobilePexelsQueryDto,
    @Req() request: AuthRequest,
  ) {
    return this.wallpaperService.getWallpapers(
      pexelsQueryDto,
      request.user.userId,
    );
  }

  @Get('favourites')
  @SkipThrottle()
  async getFavourites(
    @Req() request: AuthRequest,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.wallpaperService.getFavourites(
      request.user.userId,
      Number(page),
      Number(limit),
    );
  }

  @Post('favourite')
  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
  async favouriteWallpaper(
    @Req() request: AuthRequest,
    @Body() favouriteDto: MobileFavouriteDto,
  ) {
    return this.wallpaperService.favouriteWallpaper(
      request.user.userId,
      favouriteDto,
    );
  }

  @Delete(':id')
  @Throttle({
    default: {
      limit: 6,
      ttl: 60000,
    },
  })
  async deleteWallpaper(
    @Req() request: AuthRequest,
    @Param('id', ParseIntPipe) wallpaperId: number,
  ) {
    return this.wallpaperService.removeFromFavourites(
      request.user.userId,
      wallpaperId,
    );
  }

  @Get('community')
  @SkipThrottle()
  async getCommunityWallpapers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() request: AuthRequest,
  ) {
    return this.wallpaperService.getCommunityWallpapers(
      Number(page),
      Number(limit),
      request.user.userId,
    );
  }

  @Post('generate')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  async generateImage(
    @Req() request: AuthRequest,
    @Body('prompt') prompt: string,
  ) {
    return this.wallpaperService.generateImage(request.user.userId, prompt);
  }

  @Post('upload')
  @Throttle({
    default: {
      limit: 4,
      ttl: 60000,
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 3 * 1024 * 1024,
      },
    }),
  )
  async uploadWallpaper(
    @UploadedFile() image: Express.Multer.File,
    @Body() uploadDto: MobileUploadDto,
    @Req() req: AuthRequest,
  ) {
    return this.wallpaperService.uploadWallpaper(
      image,
      uploadDto,
      req.user.userId,
    );
  }

  @Get('profile')
  async getUserProfile(@Req() request: AuthRequest) {
    return this.wallpaperService.getUserProfile(request.user.userId);
  }

  @Delete('post/:id')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  async deletePost(
    @Req() request: AuthRequest,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.wallpaperService.deletePost(request.user.userId, postId);
  }

  @Post('like/:id')
  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
  async likePost(
    @Req() requets: AuthRequest,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.wallpaperService.likePost(postId, requets.user.userId);
  }

  @Post('unlike/:id')
  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
  async unlikePost(
    @Req() requets: AuthRequest,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.wallpaperService.unlikePost(postId, requets.user.userId);
  }

  @Get('notification')
  async getUserNotification(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() request: AuthRequest,
  ) {
    return this.wallpaperService.getUserNotification(
      request.user.userId,
      Number(page),
      Number(limit),
    );
  }
}
