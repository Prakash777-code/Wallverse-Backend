import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FavouriteDto } from './dto/favourites.dto';
import { FavouritesService } from './favourites.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller('favourites')
@UseGuards(AuthGuard)
export class FavouritesController {
  constructor(private favouriteService: FavouritesService) {}

  @Post()
  @Throttle({
    default:{
      limit:10,
      ttl:60000
    }
  })
  async favouriteWallpaper(
    @Body() favouriteDto: FavouriteDto,
    @Req() request: Request,
  ) {
    return await this.favouriteService.favouriteWallpaper(
      request.user.userId,
      favouriteDto,
    );
  }

  @Get()
  @Throttle({
    default:{
      limit:7,
      ttl:60000
    }
  })
  async getFavourites(@Req() request: Request) {
    return this.favouriteService.getFavouriteWallpapers(request.user.userId);
  }

  @Get(":id")
  async getWallpaperById(@Req() request:Request, wallpaperId:number){
    return this.favouriteService.getWallpaperById(request.user.userId, wallpaperId)
  }

  @Delete(':id')
  async deleteWallpaper(
    @Req() request: Request,
    @Param('id', ParseIntPipe) wallpaperId: number,
  ) {
    return this.favouriteService.deleteWallpaper(
      request.user.userId,
      wallpaperId,
    );
  }
}


