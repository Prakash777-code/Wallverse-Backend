import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MobilePexelsQueryDto } from './dtos/query.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { MobileFavouriteDto } from './dtos/favourite.dto';
import { createHash } from 'node:crypto';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { MobileUploadDto } from './dtos/upload.dto';

@Injectable()
export class MobileWallpaperService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private cloudinaryService: CloudinaryService,
  ) {}

  async getWallpapers(pexelsQueryDto: MobilePexelsQueryDto, userId: number) {
    const { query, page = 1, perPage = 16 } = pexelsQueryDto;
    if (!query) {
      throw new BadRequestException('Query is empty');
    }
    if (page < 1 || perPage < 1) {
      throw new BadRequestException(
        'Page number and limit must be greater than 0',
      );
    }
    const normalizeQuery = query.toLowerCase().trim();
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
    const totalResults = data.total_results;
    const key = `wallpapers:userId:${userId}:page:${page}:limit:${perPage}`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return {
        source: 'Cache',
        data: cachedData,
        totalResults: totalResults,
      };
    }
    const wallpapers = data.photos.map((photo: any) => ({
      wallpaperId: photo.id,
      imageUrl: photo.src.portrait,
      photographer: photo.photographer,
    }));
    await this.cacheManager.set(key, wallpapers, 30 * 60 * 1000);
    return {
      source: 'Database',
      data: wallpapers,
      totalResults: totalResults,
    };
  }

  async getFavourites(userId: number, page: number, limit: number) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException(
        'Page number and limit must be greater than 0',
      );
    }
    const totalFavourites = await this.prisma.favourites.count({
      where: {
        userId: userId,
      },
    });
    const version =
      (await this.cacheManager.get<number>('favourite-cache')) ?? 1;
    const key = `favourite:v${version}:page:${page}:limit:${limit}`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return {
        source: 'Cache',
        data: cachedData,
        totalFavourites: totalFavourites,
      };
    }
    const skip = (page - 1) * limit;
    const favourites = await this.prisma.favourites.findMany({
      skip: skip,
      take: limit,
      where: {
        userId: userId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    await this.cacheManager.set(key, favourites);
    return {
      source: 'Database',
      data: favourites,
      totalFavourites: totalFavourites,
    };
  }

  async favouriteWallpaper(userId: number, favouriteDto: MobileFavouriteDto) {
    const { wallpaperId, imageUrl, photographer } = favouriteDto;
    if (!wallpaperId || !imageUrl || !photographer) {
      throw new BadRequestException(
        'Wallpaper id, image url and photographer fields are missing',
      );
    }
    const alreadyFavourite = await this.prisma.favourites.findUnique({
      where: {
        userId_wallpaperId: {
          userId,
          wallpaperId,
        },
      },
    });
    if (alreadyFavourite) {
      throw new ConflictException('Already in favourites');
    }
    try {
      const inserted = await this.prisma.favourites.create({
        data: {
          userId: userId,
          wallpaperId: wallpaperId,
          imageUrl: imageUrl,
          photographer: photographer,
        },
      });
      await this.cacheManager.del(`profile:${userId}`);
      await this.invalidateFavouritesCache();
      return {
        message: 'Saved to favourites',
        data: {
          ...inserted,
          wallpaperId: inserted.wallpaperId.toString(),
        },
      };
    } catch (error) {
      console.log(error);
      throw new Error('Something went wrong');
    }
  }

  async removeFromFavourites(userId: number, wallpaperId: number) {
    if (!wallpaperId) {
      throw new BadRequestException('Wallpaper id is missing');
    }
    const exists = await this.prisma.favourites.findUnique({
      where: {
        userId_wallpaperId: {
          userId: userId,
          wallpaperId: wallpaperId,
        },
      },
    });
    if (!exists) {
      throw new BadRequestException('Wallpaper does not exists');
    }
    await this.prisma.favourites.delete({
      where: {
        userId_wallpaperId: {
          userId: userId,
          wallpaperId: wallpaperId,
        },
      },
    });
    await this.cacheManager.del(`profile:${userId}`);
    await this.invalidateFavouritesCache();
    return {
      message: 'Deleted',
    };
  }

  async getCommunityWallpapers(page: number, limit: number, userId: number) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit cant be less than 1');
    }
    const totalPosts = await this.prisma.uploadedWallpapers.count();
    const version =
      (await this.cacheManager.get<number>('community-cache')) ?? 1;
    const key = `community:v${version}:page${page}:limit${limit}`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return {
        source: 'Cache',
        data: cachedData,
        totalPosts: totalPosts,
      };
    }
    const skip = (page - 1) * limit;
    const res = await this.prisma.uploadedWallpapers.findMany({
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        userId: true,
        id: true,
        imageUrl: true,
        userName: true,
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });
    await this.cacheManager.set(key, res);
    return {
      source: 'Database',
      data: res,
      totalPosts: totalPosts,
    };
  }

  async generateImage(userId: number, prompt: string) {
    if (!prompt?.trim()) {
      return {
        message: 'Prompt is required to generate image',
      };
    }
    const cleanPrompt = prompt.trim();
    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?model=flux&width=1080&height=1920&nologo=true`;
    await this.prisma.aiGenerated.create({
      data: {
        userId,
        prompt: cleanPrompt,
        imageUrl,
      },
    });
    return {
      imageUrl,
    };
  }

  async uploadWallpaper(
    image: Express.Multer.File,
    uploadDto: MobileUploadDto,
    userId: number,
  ) {
    if (!image) {
      return {
        message: 'Image is required',
      };
    }
    const imageHash = createHash('sha256').update(image.buffer).digest('hex');
    const existing = await this.prisma.uploadedWallpapers.findUnique({
      where: {
        imageHash: imageHash,
      },
    });
    if (existing) {
      throw new ConflictException('This wallpaper has been already uploaded');
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
    await this.invalidateCommunityCache();
    return {
      message: 'Wallpaper uploaded',
    };
  }

  async getUserProfile(userId: number) {
    const key = `profile:${userId}`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return {
        source: 'Cache',
        data: cachedData,
      };
    }
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        _count: {
          select: {
            favourites: true,
            uploadedWallpapers: true,
          },
        },
        uploadedWallpapers: {
          select: {
            id: true,
            imageUrl: true,
            title: true,
          },
        },
      },
    });
    if (!user) {
      throw new BadRequestException('User not exists');
    }
    const profile = {
      userId: user.id,
      name: user.name,
      email: user.email,
      memberSince: user.created_at,
      totalFavourites: user._count.favourites,
      totalUploads: user._count.uploadedWallpapers,
      uploadedWallpapers: user.uploadedWallpapers,
    };
    await this.cacheManager.set(key, profile);
    return {
      source: 'Database',
      data: profile,
    };
  }

  async deletePost(userId: number, postId: number) {
    if (!postId) {
      throw new BadRequestException('Post id is missing');
    }
    const exists = await this.prisma.uploadedWallpapers.findUnique({
      where: {
        id_userId: {
          userId: userId,
          id: postId,
        },
      },
    });
    if (!exists) {
      throw new NotFoundException('Post not found');
    }
    await this.prisma.uploadedWallpapers.delete({
      where: {
        id_userId: {
          userId: userId,
          id: postId,
        },
      },
    });
    await this.cacheManager.del(`profile:${userId}`);
    return {
      message: 'Post deleted',
    };
  }

  async likePost(postId: number, userId: number) {
    if (!postId) {
      throw new BadRequestException('Post id is missing');
    }
    const exists = await this.prisma.uploadedWallpapers.findUnique({
      where: {
        id: postId,
      },
      select: {
        userId: true,
        imageUrl: true,
      },
    });
    if (!exists) {
      throw new NotFoundException('Post not found');
    }
    const alreadyLiked = await this.prisma.likes.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId,
        },
      },
    });
    if (alreadyLiked) {
      throw new ConflictException('Post already liked');
    }
    await this.prisma.likes.create({
      data: {
        userId: userId,
        postId: postId,
      },
    });
    const postOwner = await this.prisma.uploadedWallpapers.findUnique({
      where: {
        id: postId,
      },
    });
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (userId !== exists.userId) {
      await this.prisma.notification.create({
        data: {
          ownerId: exists.userId,
          imageUrl: exists.imageUrl,
          postId: postId,
          userName: user.name,
        },
      });
    }
    await this.invalidateCommunityCache();
    return {
      message: 'Post liked',
    };
  }

  async unlikePost(postId: number, userId: number) {
    if (!postId) {
      throw new BadRequestException('Post id is missing');
    }
    const isPost = await this.prisma.uploadedWallpapers.findUnique({
      where: {
        id: postId,
      },
    });
    if (!isPost) {
      throw new NotFoundException('Post not found');
    }
    const isLiked = await this.prisma.likes.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId,
        },
      },
    });
    if (!isLiked) {
      throw new BadRequestException('This post is not liked');
    }
    await this.prisma.likes.delete({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId,
        },
      },
    });
    const senderDetails = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!senderDetails) {
      throw new NotFoundException('Sender not found');
    }
    if (userId != isPost.userId) {
      await this.prisma.notification.deleteMany({
        where: {
          ownerId: isPost.userId,
          postId: postId,
          userName: senderDetails.name,
        },
      });
    }
    await this.invalidateCommunityCache();
    return {
      message: 'Post unliked',
    };
  }

  async getUserNotification(userId: number, page: number, limit: number) {
    if (!page || !limit) {
      throw new BadRequestException('Page and limit are required');
    }
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit cannot be less than 1');
    }
    const totalNotifications = await this.prisma.notification.count({
      where: {
        ownerId: userId,
      },
    });
    const skip = (page - 1) * limit;
    const res = await this.prisma.notification.findMany({
      skip: skip,
      take: limit,
      where: {
        ownerId: userId,
      },
      select: {
        id: true,
        ownerId: true,
        imageUrl: true,
        postId: true,
        userName: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return {
      data: res,
      totalNotifications: totalNotifications,
    };
  }

  async getFavouriteIds(userId: number, wallpaperIds: number[]) {
    const ids = await this.prisma.favourites.findMany({
      where: {
        userId: userId,
        wallpaperId: {
          in: wallpaperIds.map((id) => BigInt(id)),
        },
      },
      select: {
        wallpaperId: true,
      },
    });
    return {
      data: ids.map((id) => Number(id.wallpaperId)),
    };
  }

  async getLikedCommunityWallpaperIds(userId: number, wallpaperIds: number[]) {
    const ids = await this.prisma.likes.findMany({
      where: {
        userId: userId,
        postId: {
          in: wallpaperIds.map((id) => id),
        },
      },
      select: {
        postId: true,
      },
    });
    return {
      data: ids.map((id) => id.postId),
    };
  }

  async invalidateFavouritesCache() {
    const version =
      (await this.cacheManager.get<number>('favourite-cache')) ?? 1;
    await this.cacheManager.set('favourite-cache', version + 1);
  }

  async invalidateCommunityCache() {
    const version =
      (await this.cacheManager.get<number>('community-cache')) ?? 1;
    await this.cacheManager.set('community-cache', version + 1);
  }
}
