import { Body, Controller, Post, Req } from '@nestjs/common';
import { MobileAuthService } from './mobileAuthService';
import { MobileRegisterDto } from './dtos/register.sto';
import { MobileLoginDto } from './dtos/login.dto';
import { UpdatePasswordDto } from './dtos/update_password.dto';
import { VerifyOtpDto } from './dtos/verifyOtp.dto';
import { ResetPasswordDto } from './dtos/resetPassword.do';
import { Throttle } from '@nestjs/throttler';

@Controller('mobile/auth')
export class MobileAuthController {
  constructor(private authServie: MobileAuthService) {}

  @Post('register')
  async register(@Body() registerDto: MobileRegisterDto) {
    return this.authServie.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: MobileLoginDto) {
    return this.authServie.login(loginDto);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authServie.refreshToken(refreshToken);
  }

  @Post('update')
  async updatePassword(@Body() updateDto: UpdatePasswordDto) {
    return this.authServie.updatePassword(updateDto);
  }

  @Throttle({
    default: {
      limit: 3,
      ttl: 60000,
    },
  })
  @Post('send-otp')
  async sendotp(@Body('email') email: string) {
    return this.authServie.sendOtp(email);
  }

  @Throttle({
    default: {
      limit: 3,
      ttl: 60000,
    },
  })
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authServie.verifyOtp(verifyOtpDto);
  }

  @Throttle({
    default: {
      limit: 2,
      ttl: 60000,
    },
  })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authServie.resetPassword(resetPasswordDto);
  }
}
