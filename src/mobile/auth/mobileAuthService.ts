import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MobileRegisterDto } from './dtos/register.sto';
import * as bcrypt from 'bcrypt';
import { MobileLoginDto } from './dtos/login.dto';
import { JwtPaylod } from '../../auth/interfaces/jwt.payload';
import { JwtService } from '@nestjs/jwt';
import { checkPassword } from './helper/password_helper';
import { UpdatePasswordDto } from './dtos/update_password.dto';
import { use } from 'passport';

@Injectable()
export class MobileAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  readonly CURRENT_PASSWORD_VERSION = 2;

  async register(registerDto: MobileRegisterDto) {
    const { name, email, password } = registerDto;
    const exists = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (exists) {
      throw new BadRequestException('Email already exists');
    }
    const existingName = await this.prisma.user.findUnique({
      where: {
        name: name,
      },
    });
    if (existingName) {
      throw new BadRequestException('User name already exists');
    }
    const passwordError = checkPassword(password);
    if (passwordError != null) {
      throw new BadRequestException(passwordError);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        passwordVersion: 2,
      },
    });
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
    if (user.passwordVersion < this.CURRENT_PASSWORD_VERSION) {
      return {
        refreshToken: refreshToken,
        passwordChangeRequired: true,
      };
    }
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }
    let paylod: JwtPaylod;
    try {
      paylod = await this.jwtService.verifyAsync<JwtPaylod>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException('Invaid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: {
        id: paylod.userId,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    if (user.passwordVersion < this.CURRENT_PASSWORD_VERSION) {
      throw new ForbiddenException('Password change is required to continue');
    }
    const newAccessToken = await this.jwtService.signAsync(
      {
        userId: paylod.userId,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '5m',
      },
    );
    return {
      accessToken: newAccessToken,
    };
  }

  async updatePassword(updatePassowrdDto: UpdatePasswordDto) {
    const { currentPassword, newPassword, refreshToken } = updatePassowrdDto;
    let payload: JwtPaylod;
    try {
      payload = await this.jwtService.verifyAsync<JwtPaylod>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException('Invaid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Inavlid current password');
    }
    const passwordError = checkPassword(newPassword);
    if (passwordError != null) {
      throw new BadRequestException(passwordError);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: {
        id: payload.userId,
      },
      data: {
        password: hashedPassword,
        passwordVersion: {
          increment: 1,
        },
      },
    });
    return {
      message: 'Password updated successfully',
    };
  }
}
