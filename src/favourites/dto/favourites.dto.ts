import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class FavouriteDto {
  @IsNumber()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  wallpaperId!: number;

  @IsString()
  @IsNotEmpty()
  imageUrl!:string

  @IsString()
  @IsNotEmpty()
  photographer!:string
}
