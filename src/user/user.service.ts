import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfileType } from './type/userProfile';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService, @Inject(CACHE_MANAGER) private cacheManager: Cache,) {}

  async getUserProfile(userId: number) {
    const key = `profile:${userId}`
    const cachedData = await this.cacheManager.get(key)
    if(cachedData){
      return{
        source:"cache",
        data:cachedData
      }
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
      where:{
        userId:userId
      }
    })

    const result: UserProfileType = {
      name: details?.name,
      email: details?.email,
      memberSince: details?.created_at.toString(),
      totalFavourites: totalFavourites,
      downloads:download
    };

    await this.cacheManager.set(key,result)
    console.log("Profile cache")

    console.log(result)

    return{
      source:"Database",
      data:result
    }
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

    await this.cacheManager.del(`profile:${userId}`)

    return {
      message: 'User name changed',
      data: changedUserName.name,
    };
  }
}
