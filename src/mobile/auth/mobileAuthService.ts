import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MobileRegisterDto } from './dtos/register.sto';
import * as bcrypt from 'bcrypt';
import { MobileLoginDto } from './dtos/login.dto';
import { JwtPaylod } from '../../auth/interfaces/jwt.payload';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class MobileAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: MobileRegisterDto) {
    const { name, email, password } = registerDto;
    const exists = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    const existingName = await this.prisma.user.findUnique({
      where: {
        name: name,
      },
    });

    if (existingName) {
      throw new BadRequestException('User name already exists');
    }

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

    console.log('Mobile register', user);

    return {
      message: 'Registered successfully',
    };
  }

  async login(loginDto: MobileLoginDto) {
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
      role: user.role,
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
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtPaylod>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );
      const newAccessToken = await this.jwtService.signAsync(
        {
          userId: payload.userId,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '5m',
        },
      );
      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
