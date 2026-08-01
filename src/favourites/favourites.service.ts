import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FavouriteDto } from './dto/favourites.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class FavouritesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async favouriteWallpaper(userId: number, favouriteDto: FavouriteDto) {
    const { wallpaperId, imageUrl, photographer } = favouriteDto;
    try {
      const inserted = await this.prisma.favourites.create({
        data: {
          userId: userId,
          wallpaperId: wallpaperId,
          imageUrl: imageUrl,
          photographer: photographer,
        },
      });

      await this.cacheManager.del(`favourites${userId}`);

      return {
        message: 'Saved to favourites',
        data: {
          ...inserted,
          wallpaperId: inserted.wallpaperId.toString(),
        },
      };
    } catch (error) {
      throw new ConflictException('Wallpaper is already in your favourites');
    }
  }

  async getFavouriteWallpapers(userId: number) {
    const key = `favourites${userId}`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return {
        source: 'Cache',
        data: cachedData,
      };
    }
    const favourites = await this.prisma.favourites.findMany({
      where: {
        userId: userId,
      },
    });
    await this.cacheManager.set(key, favourites);
    return {
      source: 'Database',
      data: favourites,
    };
  }

  async getWallpaperById(userId: number, wallpaperId: number) {
    const wallpaper = await this.prisma.favourites.findFirst({
      where: {
        userId: userId,
        wallpaperId: wallpaperId,
      },
    });

    if (!wallpaper) {
      throw new NotFoundException('Wallpaper not found');
    }

    return {
      data: wallpaper,
    };
  }

  async deleteWallpaper(userId: number, wallpaperId: number) {
    const wallpaper = await this.getWallpaperById(userId, wallpaperId);
    const deleteWallpaper = await this.prisma.favourites.delete({
      where: {
        userId_wallpaperId: {
          userId: userId,
          wallpaperId: BigInt(wallpaperId),
        },
      },
    });

    await this.cacheManager.del(`favourites${userId}`);

    return {
      message: 'Wallpaper deleted',
    };
  }
}
