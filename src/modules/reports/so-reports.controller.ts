import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { AccountType } from '../auth/entities/account.entity';
import { ApproveRejectDto } from './dto/approve-reject.dto';
import { QueryReportDto } from './dto/QueryReportDto';
import { SummaryQueryDto } from './dto/summary-report.dto';
import { ReportsService } from './reports.service';
import { ReportDocxService } from './reportsDocx.service';
interface JwtPayload {
  sub: number;
  username: string;
  accountType: AccountType;
}
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@ApiTags('So - Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('so/reports')
export class SoReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportDocxService: ReportDocxService,
  ) {}
  @Get('summary/export')
  @RequirePermissions('VIEW_REPORT')
  @ApiOperation({ summary: '[Sở] Xuất báo cáo tổng hợp ra file Word' })
  async exportSummaryReport(
    @Query() query: SummaryQueryDto,
    @Res() res: ExpressResponse,
  ) {
    const buffer = await this.reportDocxService.exportSummaryDocx(query);

    const fileName = `bao-cao-tong-hop-ky-${query.reportPeriodId}.docx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
  // GET /so/reports
  @Get()
  @RequirePermissions('VIEW_REPORT')
  @ApiOperation({ summary: '[Sở] Xem danh sách tất cả báo cáo' })
  getAllReports(@Query() query: QueryReportDto) {
    return this.reportsService.getAllReport(query);
  }

  // GET /so/reports/summary
  @Get('summary')
  @RequirePermissions('VIEW_REPORT')
  @ApiOperation({ summary: '[Sở] Xem báo cáo tổng hợp theo kỳ báo cáo' })
  getSummaryReport(@Query() query: SummaryQueryDto) {
    return this.reportsService.getSummaryReport(query);
  }

  // GET /so/reports/:id
  @Get(':id')
  @RequirePermissions('VIEW_REPORT')
  @ApiOperation({ summary: '[Sở] Xem chi tiết báo cáo' })
  getOneForSo(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getReportByIdForSo(id);
  }
  @Get(':id/status')
  @RequirePermissions('VIEW_REPORT')
  @ApiOperation({
    summary: '[Sở] Xem trạng thái và lý do duyệt/từ chối của báo cáo',
  })
  getReportStatusForSo(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getReportTimeline(id);
  }
  // PATCH /so/reports/approve
  @Patch('approve')
  @RequirePermissions('APPROVE_REPORT')
  @ApiOperation({
    summary: '[Sở] Duyệt 1 hoặc nhiều báo cáo (SUBMITTED → APPROVED)',
  })
  approve(@Req() req: AuthenticatedRequest, @Body() dto: ApproveRejectDto) {
    return this.reportsService.approveReports(req.user.sub, dto);
  }

  // PATCH /so/reports/reject
  @Patch('reject')
  @RequirePermissions('REJECT_REPORT')
  @ApiOperation({
    summary: '[Sở] Từ chối 1 hoặc nhiều báo cáo (SUBMITTED → REJECTED)',
  })
  reject(@Req() req: AuthenticatedRequest, @Body() dto: ApproveRejectDto) {
    return this.reportsService.rejectReports(req.user.sub, dto);
  }
}
