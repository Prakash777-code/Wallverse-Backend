import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  resetToken!: string;

  @IsNotEmpty()
  @IsString()
  newPassword!: string;
}
