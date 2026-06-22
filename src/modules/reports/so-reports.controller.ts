import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { AccountType } from '../auth/entities/account.entity';
import { ApproveRejectDto } from './dto/approve-reject.dto';
import { QueryReportDto } from './dto/QueryReportDto';
import { SummaryQueryDto } from './dto/summary-report.dto';
import { ReportsService } from './reports.service';

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
  constructor(private readonly reportsService: ReportsService) {}

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
