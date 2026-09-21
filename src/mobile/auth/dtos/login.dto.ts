import { IsEmail, IsNotEmpty } from "class-validator";

export class MobileLoginDto{

    @IsEmail()
    email!:string

    @IsNotEmpty()
    password!:string
}


