import { Body, Controller, Post, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportDto } from './dtos/report.dto';

@Controller('reports')
export class ReportsController {
}
