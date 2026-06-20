import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportPeriodService } from './report_period.service';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(private readonly ReportPeriodService: ReportPeriodService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cấu hình báo cáo' })
  getProvinces() {
    return this.ReportPeriodService.getAllReport();
  }

  @Get('report-periods/:id/')
  @ApiOperation({ summary: 'Lấy báo cáo theo Id' })
  getWardsByProvince(@Param('id', ParseIntPipe) id: number) {
    return this.ReportPeriodService.getById(id);
  }
}
