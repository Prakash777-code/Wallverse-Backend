import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtPaylod } from './interfaces/jwt.payload';
import { JwtService } from '@nestjs/jwt';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
     @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async registerUser(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;
    const exists = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (exists) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      },
    });

    console.log("From register",user);

    return {
      message: 'Registered successfully',
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPaylod = {
      userId: user.id,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '5m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async refreshAcessToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPaylod>(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const newAccessToken = await this.jwtService.signAsync(
        {
          userId: payload.userId,
          expiresIn: '5m',
        },
        {
          secret: process.env.JWT_SECRET,
        },
      );

      return {
        newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(userId:number, changePasswordDto:ChangePasswordDto){
    const{currentPassword, newPassword} = changePasswordDto
    const user = await this.prisma.user.findUnique({
      where:{
        id:userId
      }
    })

    if(!user){
      throw new NotFoundException("User not found")
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if(!isMatch){
      throw new BadRequestException("Invalid current password")
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    const updatedPassword = await this.prisma.user.update({
      where:{
        id:userId
      },
      data:{
        password:hashedNewPassword
      }
    })

    await this.cacheManager.del(`profile:${userId}`)

    return{
      message:"Password changed successfully"
    }
  }
}
