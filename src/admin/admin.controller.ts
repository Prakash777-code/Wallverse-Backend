import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}
  @Get()
  async func(@Query('page') page: string, @Query('limit') limit: string) {
    return this.adminService.getAllPosts(Number(page), Number(limit));
  }
}
