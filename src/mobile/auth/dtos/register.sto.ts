import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class MobileRegisterDto{

    @IsNotEmpty()
    @IsString()
    name!:string

    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email!:string

    @IsNotEmpty()
    @MinLength(6)
    password!:string
}