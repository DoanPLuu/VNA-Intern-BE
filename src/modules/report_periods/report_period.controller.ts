import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'src/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { CreateReportPeriodDto } from './dto/CreateReportPeriodDto';
import { QueryReportPeriodDto } from './dto/QueryReportPeriodDto';
import { UpdateReportPeriodDto } from './dto/UpdateReportPeriodDto';
import { UpdateStatus } from './dto/UpdateStatusDto';
import { ReportPeriodService } from './report_period.service';

@ApiTags('report-periods')
@Controller('report-periods')
export class ReportPeriodController {
  constructor(private readonly ReportPeriodService: ReportPeriodService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy danh sách kỳ báo cáo (có phân trang & tìm kiếm)',
  })
  getReportPeriod(@Query() query: QueryReportPeriodDto) {
    return this.ReportPeriodService.getAllReport(query);
  }
  @Get('years')
  async getYears() {
    const years = await this.ReportPeriodService.getYears();
    return Response.success(years);
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy báo cáo theo Id' })
  getReportPeriodById(@Param('id', ParseIntPipe) id: number) {
    return this.ReportPeriodService.getById(id);
  }
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo cấu trúc báo cáo' })
  createReportPeriod(@Body() dto: CreateReportPeriodDto) {
    return this.ReportPeriodService.createReportPeriod(dto);
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sửa cấu trúc báo cáo' })
  updateReportPeriod(
    @Body() dto: UpdateReportPeriodDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ReportPeriodService.updateReportPeriod(id, dto);
  }
  @Patch(':id/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sửa cấu trúc báo cáo' })
  updateStatusReportPeriod(
    @Body() dto: UpdateStatus,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ReportPeriodService.updateStatus(id, dto);
  }
}
