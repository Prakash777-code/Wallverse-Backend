import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RoleGuard } from '../auth/roleGuard';
import type { Request } from 'express';

@Controller('admin')
@UseGuards(RoleGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('downloads')
  async getTotalDownloads() {
    return this.adminService.getTotalDonwloads();
  }

  @Get('totalFavourites')
  async getTotalFavourites() {
    return this.adminService.getTotalFavourites();
  }

  @Get('aiGenerated')
  async getTotalAiGenerated() {
    return this.adminService.getTotalAiGenerated();
  }

  @Get('ai/:id')
  async getAiGeneratedCountByUserId(@Param('id', ParseIntPipe) userId: number) {
    return this.adminService.getAiGeneratedCountByUserId(userId);
  }

  @Get('prompts')
  async getAllPrompts() {
    return this.adminService.getAllAiGeneatedPrompts();
  }

  @Get('prompts/:id')
  async getPromptsByUserId(@Param('id', ParseIntPipe) userId: number) {
    return this.adminService.getPromptById(userId);
  }

  @Get('uploads')
  async getAllUploadedWallpapers() {
    return this.adminService.getAllUploadedWallpapers();
  }

  @Get(':id')
  async getTotalFavouritesById(@Param('id', ParseIntPipe) id: number) {
    return await this.adminService.getTotalFavouritesById(id);
  }
}
