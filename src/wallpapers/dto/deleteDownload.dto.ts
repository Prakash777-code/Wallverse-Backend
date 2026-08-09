import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class DeleteDownloadDto{

    @IsString()
    @IsNotEmpty()
    wallpaperId!:string

    @IsString()
    @IsNotEmpty()
    imageUrl!:string
}