import { Body, Controller, Post } from '@nestjs/common';
import { MobileAuthService } from './mobileAuthService';
import { MobileRegisterDto } from './dtos/register.sto';
import { MobileLoginDto } from './dtos/login.dto';

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
  async refresh(@Body("refreshToken") refreshToken: string) {
    return this.authServie.refreshToken(refreshToken);
  }
}
