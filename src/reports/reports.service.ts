import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportDto } from './dtos/report.dto';
import { Prisma, ReportCategory } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async reportPost(reportDto: ReportDto, userId: number) {
    const { postId, category, description } = reportDto;
    const isPost = await this.prisma.uploadedWallpapers.findUnique({
      where: {
        id: Number(postId),
      },
    });
    if (!isPost) {
      throw new BadRequestException('Post do not exists');
    }
    console.log(postId, category, description, 'By ', userId);
    try {
      const report = await this.prisma.reports.create({
        data: {
          reporterId: userId,
          postId: Number(postId),
          category: category as ReportCategory,
          description: description,
        },
      });
      return {
        success: 'True',
        message: 'Post reported successfully',
        reportDetails: report,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Post was already reported by you');
      }
    }
  }
}
