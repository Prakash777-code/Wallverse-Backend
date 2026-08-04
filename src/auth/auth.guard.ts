import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPaylod } from './interfaces/jwt.payload';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies.accessToken;

    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      const decoded = await this.jwtService.verifyAsync<JwtPaylod>(token, {
        secret: process.env.JWT_SECRET,
      });
      request['user'] = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Access token is misiing');
    }
  }
}
