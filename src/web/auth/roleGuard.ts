import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPaylod } from './interfaces/jwt.payload';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies.accessToken;

    if (!token) {
      throw new UnauthorizedException('Unauthorised');
    }

    try {

      const decoded = await this.jwtService.verifyAsync<JwtPaylod>(token, {
        secret: process.env.JWT_SECRET,
      });

      console.log("From role guard", decoded)

      request['user'] = decoded;
    } catch (error) {
      throw new UnauthorizedException('unauthorised');
    }

    if (request.user.role !== 'ADMIN') {
      throw new ForbiddenException('Cant access this route');
    }

    return true;
  }
}
