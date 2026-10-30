import { IsNotEmpty, IsNumber } from "class-validator";

export class UserProfileDto{

    @IsNumber()
    @IsNotEmpty()
    userId!:number
}