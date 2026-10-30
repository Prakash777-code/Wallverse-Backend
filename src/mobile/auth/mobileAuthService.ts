import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MobileRegisterDto } from './dtos/register.sto';
import * as bcrypt from 'bcrypt';
import { MobileLoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { checkPassword } from './helper/password_helper';
import { UpdatePasswordDto } from './dtos/update_password.dto';
import { randomInt } from 'crypto';
import { EmailService } from './email.service';
import { VerifyOtpDto } from './dtos/verifyOtp.dto';
import { ResetPasswordDto } from './dtos/resetPassword.do';
import { MobileJwtPaylod } from '../interfaces/mobilePaylod';
import { JwtPaylod } from '../../web/auth/interfaces/jwt.payload';

@Injectable()
export class MobileAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
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
    const payload: MobileJwtPaylod = {
      userId: user.id,
      role: user.role,
      sessionVersion: user.sessionVerison,
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
    let paylod: MobileJwtPaylod;
    try {
      paylod = await this.jwtService.verifyAsync<MobileJwtPaylod>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );
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
        sessionVersion: user.sessionVerison,
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

  async sendOtp(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const isValidMail = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!isValidMail) {
      return {
        message: 'If email exists, we have sent you an OTP',
      };
    }
    await this.prisma.otp.deleteMany({
      where: {
        userId: isValidMail.id,
      },
    });
    const otp = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    await this.prisma.otp.create({
      data: {
        otpHash: otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        userId: isValidMail.id,
      },
    });
    try {
      const res = await this.emailService.sendOtp(email, otp);
    } catch (e) {
      console.log('EMAIL SERVICE ERROR :', e);
      throw new InternalServerErrorException(
        'Something went wrong, please try again later ',
      );
    }
    return {
      message: 'OTP sent',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { otp, email } = verifyOtpDto;
    if (!otp || !email) {
      throw new BadRequestException('OTP and email are required');
    }
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid OTP');
    }
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    if (!otpRecord) {
      throw new BadRequestException('Invalid OTP');
    }
    if (new Date() >= otpRecord.expiresAt) {
      throw new BadRequestException('OTP has been expired');
    }
    const isValidOtp = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid OTP');
    }
    const payload: JwtPaylod = {
      userId: otpRecord.userId,
      role: user.role,
    };
    const resetToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_RESET_SECRET,
      expiresIn: '5m',
    });
    await this.prisma.otp.deleteMany({
      where: {
        userId: user.id,
      },
    });
    return {
      message: 'OTP  verified ',
      resetToken: resetToken,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { resetToken, newPassword } = resetPasswordDto;
    if (!resetToken || !newPassword) {
      throw new BadRequestException(
        'Reset token and new password are required',
      );
    }
    let payload: JwtPaylod;
    try {
      payload = await this.jwtService.verifyAsync<JwtPaylod>(resetToken, {
        secret: process.env.JWT_RESET_SECRET,
      });
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException('Invalid reset token');
    }
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid reset token');
    }
    const error = checkPassword(newPassword);
    if (error) {
      throw new BadRequestException(error);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        sessionVerison:{
          increment:1
        }
      },
    });
    return {
      message: 'Password updated successfully',
    };
  }
}
