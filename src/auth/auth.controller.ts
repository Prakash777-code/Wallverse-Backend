import { Body, Controller, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async registerUser(@Body() registerDto: RegisterDto) {
    return this.authService.registerUser(registerDto);
  }

  @Post('login')
  @Throttle({
    default:{
      limit:5,
      ttl:60000
    }
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5 * 1000,
      path: '/',
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 * 1000,
      path: '/',
    });

    return {
      message: 'Logged in successfully',
    };
  }

  @Post('refresh')
  @Throttle({
    default:{
      limit:3,
      ttl:60000
    }
  })
  async refreshAccessToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies.refreshToken;
    const result = await this.authService.refreshAcessToken(refreshToken);

    response.cookie('accessToken', result.newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5 * 1000,
      path:"/"
    });

    return {
      message: 'Access token refreshed',
      newAccessToken: result.newAccessToken,
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:"/"
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:"/"
    });
    console.log("User logged out")
    return {
      message: 'Logged out successfully',
    };
  }

  @Put("password")
  @UseGuards(AuthGuard)
  @Throttle({
    default:{
      limit:2,
      ttl:60000
    }
  })
  async changePassowrd(@Req() request:Request, @Body() changePasswordDto:ChangePasswordDto){
    return this.authService.changePassword(request.user.userId, changePasswordDto)
  }
}
