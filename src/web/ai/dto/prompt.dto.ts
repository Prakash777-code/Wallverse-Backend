import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class PromptDto{

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(100)
    prompt!:string
}