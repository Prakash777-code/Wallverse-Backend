import { ReportCategory } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReportDto {
  @IsString()
  @IsNotEmpty()
  postId!: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(ReportCategory)
  category!: string;

  @IsString()
  @IsOptional()
  description!: string;
}
