import { Inject, Injectable } from '@nestjs/common';
import { PexelsQueryDto } from './dto/pexels.quer.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class PexelsService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  async getWallpapers(pexelsQueryDto: PexelsQueryDto) {
    const { query, page = 1, perPage = 16 } = pexelsQueryDto;
    const normalizeQuery = query.toLowerCase().trim()
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
}
