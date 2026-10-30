import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RoleGuard } from '../web/auth/roleGuard';

@Controller('admin')
@UseGuards(RoleGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  
}
