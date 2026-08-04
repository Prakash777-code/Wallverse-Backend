import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PexelsQueryDto } from './dto/pexels.quer.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PexelsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}
  async getWallpapers(pexelsQueryDto: PexelsQueryDto) {
    const { query, page = 1, perPage = 16 } = pexelsQueryDto;
    const normalizeQuery = query.toLowerCase().trim();
    const key = `pexels:${normalizeQuery}:${page}:${perPage}`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return {
        source: 'Cache',
        data: cachedData,
      };
    }
    const result = await fetch(
      `https://api.pexels.com/v1/search?query=${normalizeQuery}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: process.env.PEXELS_API_KEY!,
        },
      },
    );

    if (!result.ok) {
      throw new Error('Failed to load wallpapers');
    }
    const data = await result.json();
    const wallpapers = data.photos.map((photo: any) => ({
      wallpaperId: photo.id,
      imageUrl: photo.src.large,
      photographer: photo.photographer,
    }));

    await this.cacheManager.set(key, wallpapers);

    return {
      source: 'Pexels',
      data: wallpapers,
    };
  }

  async downloadImage(url: string) {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error('Failed to download wallpaper');
    }

    return Buffer.from(await res.arrayBuffer());
  }

  async createDownload(
    userId: number,
    imageUrl: string,
    wallpaperId: string,
    photgrapher: string,
  ) {
    const create = await this.prisma.wallpaperDownload.create({
      data: {
        userId: userId,
        wallpaperId: wallpaperId,
        photographer: photgrapher,
        imageUrl: imageUrl,
      },
    });
  }
}
