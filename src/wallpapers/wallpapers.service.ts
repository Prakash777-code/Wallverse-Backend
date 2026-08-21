import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PexelsQueryDto } from './dto/pexels.quer.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { UploadDto } from './dto/upload.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { createHash } from 'node:crypto';

@Injectable()
export class WallpaperService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
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

  async getDownloads(userId: number) {
    const key = `downloads:${userId}`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return {
        source: 'Cache',
        data: cachedData,
      };
    }
    const downloads = await this.prisma.wallpaperDownload.findMany({
      where: {
        userId: userId,
        imageUrl: {
          not: '',
        },
      },
    });

    await this.cacheManager.set(key, downloads);

    return {
      source: 'Database',
      data: downloads,
    };
  }

  async removeDownloadImage(
    userId: number,
    wallpaperId: string,
    imageUrl: string,
  ) {
    await this.prisma.wallpaperDownload.updateMany({
      where: {
        userId,
        wallpaperId,
        imageUrl,
      },
      data: {
        wallpaperId: null,
        imageUrl: null,
      },
    });
    return {
      message: 'Wallpaper removed',
    };
  }

  async uploadWallpaper(
    image: Express.Multer.File,
    uploadDto: UploadDto,
    userId: number,
  ) {
    const imageHash = createHash('sha256').update(image.buffer).digest('hex');
    const exisiting = await this.prisma.uploadedWallpapers.findUnique({
      where: {
        imageHash,
      },
    });
    if (exisiting) {
      throw new ConflictException('This wallpaper has already been uploaded');
    }
    const res = await this.cloudinaryService.uploadWallpaper(image);
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
      },
    });
    await this.prisma.uploadedWallpapers.create({
      data: {
        userId: userId,
        title: uploadDto.title,
        imageUrl: res.secure_url,
        userName: user!.name,
        imageHash: imageHash,
      },
    });
    await this.cacheManager.del(`profile:${userId}`);
    await this.cacheManager.del(`uploaded`);
    await this.cacheManager.del(`uploads${userId}`);
    console.log(res.secure_url);
    return {
      message: 'Wallpaper uploaded successfully',
      title: uploadDto.title,
      imageUrl: res.secure_url,
    };
  }

  async getAllUploadedWallpapers() {
    const key = `uploaded`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return {
        source: 'Cache',
        data: cachedData,
      };
    }
    const res = await this.prisma.uploadedWallpapers.findMany({
      select: {
        id: true,
        imageUrl: true,
        userName: true,
      },
    });

    await this.cacheManager.set(key, res);

    return {
      source: 'Database',
      data: res,
    };
  }
}
