import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
  }

  async getTotalDonwloads() {
    const downloads = await this.prisma.wallpaperDownload.count();
    return {
      downloads: downloads,
    };
  }

  async getTotalFavouritesById(userId: number) {
    const result = await this.prisma.favourites.count({
      where: {
        userId: userId,
      },
    });

    return {
      totalFavourites: result,
    };
  }

  async getTotalFavourites() {
    const res = await this.prisma.favourites.count();
    return {
      favourites: res,
    };
  }

  async getAllAiGeneatedPrompts() {
    const res = await this.prisma.aiGenerated.findMany({
      select: {
        prompt: true,
      },
    });

    return res;
  }

  async getTotalAiGenerated() {
    return this.prisma.aiGenerated.count();
  }

  async getAiGeneratedCountByUserId(userId: number) {
    const result = await this.prisma.aiGenerated.count({
      where: {
        userId: userId,
      },
    });

    return result;
  }

  async getPromptById(userId: number) {
    const res = await this.prisma.aiGenerated.findMany({
      where: {
        userId: userId,
      },
      select: {
        prompt: true,
      },
    });

    return res;
  }

  async getAllUploadedWallpapers(){
    const res = await this.prisma.uploadedWallpapers.findMany({
      select:{
        imageUrl:true
      }
    })
    return res
  }
}
