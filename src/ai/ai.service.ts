import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PromptDto } from './dto/prompt.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}

  async generateImage(prompt: PromptDto, userId: number) {
    const PLAN_LIMITS = {
      FREE: 5,
      PRO: 20,
      PREMIUM: 50,
    };

    const key = `prompt:${prompt.prompt.toLowerCase()}`;

    const cachedData = await this.cacheManager.get<string>(key);

    if (cachedData) {
      return {
        source: 'Cache',
        imageUrl: cachedData,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        plan: true,
        role:true
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const limit = PLAN_LIMITS[user.plan];

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const generationCount = await this.prisma.aiGenerated.count({
      where: {
        userId,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    if (generationCount >= limit && user.role !== "ADMIN") {
      throw new HttpException(
        {
          message: `You have reached your ${user.plan} AI generation limit`,
          limit,
          used: generationCount,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt.prompt,
    )}?model=flux&width=1920&height=1080&enhance=true&nologo=true`;

    await this.prisma.aiGenerated.create({
      data: {
        userId,
        prompt: prompt.prompt,
        imageUrl,
      },
    });

    await this.cacheManager.set(key, imageUrl, 24 * 60 * 60 * 1000);

    return {
      source: 'Api',
      imageUrl,
    };
  }

  async getAiGeneratedCountByUserId(userId: number) {
    const res = await this.prisma.aiGenerated.count({
      where: {
        userId: userId,
      },
    });

    return {
      count: res,
    };
  }

  async getPrompts(userId: number) {
    const res = await this.prisma.aiGenerated.findMany({
      where: {
        userId: userId,
      },
      select: {
        prompt: true,
      },
    });

    return {
      prompts: res,
    };
  }
}
