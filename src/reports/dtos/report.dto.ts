import { ReportCategory } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class ReportDto {
  @IsString()
  @IsNotEmpty()
  postId!: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(ReportCategory)
  category!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}
