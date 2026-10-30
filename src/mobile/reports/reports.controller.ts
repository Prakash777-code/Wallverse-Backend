import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from '../../reports/reports.service';
import { ReportDto } from '../../reports/dtos/report.dto';
import type { AuthRequest } from '../authRequest';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';

@Controller('mobile')
@UseGuards(AuthGuard('jwt'))
export class MobileReports {
  constructor(private reportService: ReportsService) {}

  @Post('report')
  @Throttle({
    default: {
      limit: 3,
      ttl: 60000,
    },
  })
  async reportPost(@Body() reportDto: ReportDto, @Req() req: AuthRequest) {
    return this.reportService.reportPost(reportDto, req.user.userId);
  }
}
