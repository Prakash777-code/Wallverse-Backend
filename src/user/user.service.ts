import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfileType } from './type/userProfile';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getUserProfile(userId: number) {

    const key = `profile:${userId}`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return {
        source: 'cache',
        data: cachedData,
      };
    }
    const details = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!details) {
      throw new NotFoundException('User not found');
    }

    const totalFavourites = await this.prisma.favourites.count({
      where: {
        userId: userId,
      },
    });

    const download = await this.prisma.wallpaperDownload.count({
      where: {
        userId: userId,
      },
    });

    const totalUploads = await this.prisma.uploadedWallpapers.count({
      where: {
        userId: userId,
      },
    });


    const result: UserProfileType = {
      userId: details.id,
      name: details?.name,
      email: details?.email,
      memberSince: details?.created_at.toString(),
      totalFavourites: totalFavourites,
      downloads: download,
      plan: details.plan,
      totalUploads: totalUploads,
    };

    await this.cacheManager.set(key, result,5 * 60 * 1000,);
    console.log('Profile cache');

    console.log(result);

    return {
      source: 'Database',
      data: result,
    };
  }

  async getUserStatus(userId: number) {
    return {
      status: 200,
      message: 'Authenticated',
    };
  }

  async changeUserName(userId: number, newName: string) {
    const changedUserName = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: newName,
      },
    });

    await this.cacheManager.del(`profile:${userId}`);

    return {
      message: 'User name changed',
      data: changedUserName.name,
    };
  }

  async getUploadedWallpaperByUserId(userId: number) {
    const key = `uploads${userId}`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return {
        source: 'Cache',
        data: cachedData,
      };
    }
    const res = await this.prisma.uploadedWallpapers.findMany({
      where: {
        userId: userId,
      },
      select: {
        userId: true,
        imageUrl: true,
      },
    });

    await this.cacheManager.set(key, res);

    return {
      source: 'Database',
      data: res,
    };
  }

  async getUserPrompts(userId:number){
    const prompts = await this.prisma.aiGenerated.findMany({
      where:{
        userId:userId
      },
      select:{
        prompt:true
      }
    })
    return{
      prompts
    }
  }
}
