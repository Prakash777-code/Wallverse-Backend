import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class MobilePexelsQueryDto {
  @IsString()
  query!: string;

  @IsNumber()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage?: number;
}
