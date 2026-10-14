import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllPosts(page: number, limit: number) {
    if (!page || !limit) {
      throw new BadRequestException('Page and limit are required');
    }
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit cant be less than 1');
    }
    const skip = (page - 1) * limit;
    const posts = await this.prisma.uploadedWallpapers.findMany({
      skip: skip,
      take: limit,
    });
    return {
      data: posts,
    };
  }
}
