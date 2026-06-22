import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportDto } from './dto/QueryReportDto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportsService } from './reports.service';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
interface JwtPayload {
  sub: number;
  username: string;
  accountType: AccountType;
}
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // POST /reports
  @Post()
  @ApiOperation({ summary: 'Tạo báo cáo TNLĐ mới (DRAFT)' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateReportDto) {
    return this.reportsService.createReport(req.user.sub, dto);
  }

  // GET /reports
  @Get()
  @ApiOperation({ summary: 'Danh sách báo cáo của doanh nghiệp' })
  getMyReports(@Req() req: AuthenticatedRequest) {
    return this.reportsService.getMyReports(req.user.sub);
  }

  // GET /reports/:id
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết báo cáo' })
  getOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reportsService.getReportById(req.user.sub, id);
  }

  // PATCH /reports/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật báo cáo (chỉ khi còn DRAFT)' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportDto,
  ) {
    return this.reportsService.updateReport(req.user.sub, id, dto);
  }

  // PATCH /reports/:id/attachment
  @Patch(':id/attachment')
  @ApiOperation({ summary: 'Đính kèm file báo cáo có dấu mộc' })
  updateAttachment(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAttachmentDto,
  ) {
    return this.reportsService.updateAttachment(req.user.sub, id, dto);
  }

  // PATCH /reports/:id/submit
  @Patch(':id/submit')
  @ApiOperation({ summary: 'Nộp báo cáo (DRAFT → SUBMITTED)' })
  submit(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reportsService.submitReport(req.user.sub, id);
  }
  //so//
  @Get('so')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('VIEW_REPORT')
  @ApiOperation({ summary: '[Sở] Xem danh sách tất cả báo cáo' })
  getAllReports(@Query() query: QueryReportDto) {
    return this.reportsService.getAllReport(query);
  }

  // GET /reports/so/:id — Sở xem chi tiết 1 báo cáo
  @Get('so/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('VIEW_REPORT')
  @ApiOperation({ summary: '[Sở] Xem chi tiết báo cáo' })
  getOneForSo(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getReportByIdForSo(id);
  }

  // PATCH /reports/approve — Sở duyệt 1 hoặc nhiều báo cáo
  @Patch('approve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('APPROVE_REPORT')
  @ApiOperation({
    summary: '[Sở] Duyệt 1 hoặc nhiều báo cáo (SUBMITTED → APPROVED)',
  })
  approve(@Req() req: AuthenticatedRequest, @Body() dto: ApproveRejectDto) {
    return this.reportsService.approveReports(req.user.sub, dto);
  }

  // PATCH /reports/reject — Sở từ chối 1 hoặc nhiều báo cáo
  @Patch('reject')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('REJECT_REPORT')
  @ApiOperation({
    summary: '[Sở] Từ chối 1 hoặc nhiều báo cáo (SUBMITTED → REJECTED)',
  })
  reject(@Req() req: AuthenticatedRequest, @Body() dto: ApproveRejectDto) {
    return this.reportsService.rejectReports(req.user.sub, dto);
  }
}
