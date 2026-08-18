import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports:[JwtModule.register({
        secret: process.env.JWT_SECRET,
      })]
})
export class AdminModule {}
