import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateReportPeriodDto } from './dto/CreateReportPeriodDto';
import { UpdateReportPeriodDto } from './dto/UpdateReportPeriodDto';
import { ReportPeriodService } from './report_period.service';

@ApiTags('ReportPeriod')
@Controller('reportPeriod')
export class ReportPeriodController {
  constructor(private readonly ReportPeriodService: ReportPeriodService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cấu hình báo cáo' })
  getReportPeriod() {
    return this.ReportPeriodService.getAllReport();
  }

  @Get('report-periods/:id/')
  @ApiOperation({ summary: 'Lấy báo cáo theo Id' })
  getReportPeriodById(@Param('id', ParseIntPipe) id: number) {
    return this.ReportPeriodService.getById(id);
  }
  @Post()
  @ApiOperation({ summary: 'Tạo cấu trúc báo cáo' })
  createReportPeriod(@Body() dto: CreateReportPeriodDto) {
    return this.ReportPeriodService.createReportPeriod(dto);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Sửa cấu trúc báo cáo' })
  updateReportPeriod(
    @Body() dto: UpdateReportPeriodDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ReportPeriodService.updateReportPeriod(id, dto);
  }
}
