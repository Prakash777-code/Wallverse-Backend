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

  async getWallpapers(pexelsQueryDto: MobilePexelsQueryDto) {
    const { query, page = 1, perPage = 16 } = pexelsQueryDto;
    const normalizeQuery = query.toLowerCase().trim();
    const key = `pexels:${normalizeQuery}:${page}:${perPage}`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return {
        source: 'Cache',
        data: cachedData['wallpapers'],
        totalResults: cachedData['totalResults'],
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
    const totalResults = data.total_results;
    const wallpapers = data.photos.map((photo: any) => ({
      wallpaperId: photo.id,
      imageUrl: photo.src.portrait,
      photographer: photo.photographer,
    }));

    await this.cacheManager.set(key, {
      wallpapers: wallpapers,
      totalResults: totalResults,
    });

    return {
      source: 'Pexels',
      data: wallpapers,
      totalResults: totalResults,
    };
  }

  async getFavourites(userId: number, page: number, limit: number) {
    const totalFavourites = await this.prisma.favourites.count({
      where: {
        userId: userId,
      },
    });
    const skip = (page - 1) * limit;
    const favourites = await this.prisma.favourites.findMany({
      skip: skip,
      take: limit,
      where: {
        userId: userId,
      },
    });
    return {
      source: 'Database',
      data: favourites,
      totalFavourites: totalFavourites,
    };
  }

  async favouriteWallpaper(userId: number, favouriteDto: MobileFavouriteDto) {
    const { wallpaperId, imageUrl, photographer } = favouriteDto;
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
      await this.cacheManager.del(`favourites:${userId}`);
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
    await this.cacheManager.del(`favourites:${userId}`);
    await this.cacheManager.del(`profile:${userId}`);
    return {
      message: 'Deleted',
    };
  }

  async getCommunityWallpapers(page: number, limit: number, userId: number) {
    const totalPosts = await this.prisma.uploadedWallpapers.count();
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
    const posts = await Promise.all(
      res.map(async (post) => {
        const isLiked = await this.prisma.likes.findUnique({
          where: {
            userId_postId: {
              userId: userId,
              postId: post.id,
            },
          },
        });
        const isFavourite = await this.prisma.favourites.findUnique({
          where: {
            userId_wallpaperId: {
              userId: userId,
              wallpaperId: post.id,
            },
          },
        });
        return {
          id: post.id,
          userId: post.userId,
          userName: post.userName,
          imageUrl: post.imageUrl,
          likes: post._count.likes,
          isLiked: isLiked != null,
          isFavourite: isFavourite != null,
        };
      }),
    );
    return {
      data: posts,
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
    await this.cacheManager.del(`community`);
    await this.cacheManager.del(`profile:${userId}`);
    return {
      message: 'Wallpaper uploaded',
    };
  }

  async getUserProfile(userId: number) {
    const key = `profile:${userId}`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return cachedData;
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

    return profile;
  }

  async deletePost(userId: number, postId: number) {
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
    await this.cacheManager.del(`community`);
    await this.cacheManager.del(`profile:${userId}`);
    return {
      message: 'Post deleted',
    };
  }

  async likePost(postId: number, userId: number) {
    const exists = await this.prisma.uploadedWallpapers.findUnique({
      where: {
        id: postId,
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
    return {
      message: 'Post liked',
    };
  }

  async unlikePost(postId: number, userId: number) {
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
    return {
      message: 'Post unliked',
    };
  }
}
