import { IsNotEmpty, IsString } from "class-validator";

export class MobileUploadDto{

    @IsNotEmpty()
    @IsString()
    title!:string
    
}