import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { AccountType } from '../auth/entities/account.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportsService } from './reports.service';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
// import { join } from 'path';
// import { Response as ApiResponse } from 'src/common';
// import { existsSync } from 'fs';
import type { Response as ExpressResponse } from 'express';
import { ReportPdfService } from './reportsPdf.service';
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
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportPdfService: ReportPdfService,
  ) {}

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

  // @Get('template')
  // downloadTemplate(@Res() res: ExpressResponse) {
  //   const filePath = join(
  //     process.cwd(),
  //     'src',
  //     'public',
  //     'templates',
  //     'Phu-Luc-XII-Mau-Bao-Cao-TNLD.doc',
  //   );
  //   if (!existsSync(filePath)) {
  //     throw ApiResponse.errorNotFound('File mẫu không tồn tại');
  //   }
  //   console.log(filePath);
  //   console.log(existsSync(filePath));
  //   res.download(filePath, 'Mau-Bao-Cao-TNLD-Dinh-Ky.doc');
  // }

  // GET /reports/:id
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết báo cáo' })
  getOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reportsService.getReportById(req.user.sub, id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Xem trước báo cáo trước khi nộp (chỉ khi DRAFT)' })
  preview(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reportsService.previewReport(req.user.sub, id);
  }

  @Get(':id/print')
  async printReport(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: ExpressResponse,
  ) {
    const report = await this.reportsService.fetchReportEntityById(
      req.user.sub,
      id,
    );
    const pdfBuffer = await this.reportPdfService.generatePdf(report);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="BaoCao-TNLD-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
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

  // @Get('so/summary')
  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @RequirePermissions('VIEW_REPORT')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: '[Sở] Xem báo cáo tổng hợp theo kỳ báo cáo' })
  // getSummaryReport(@Query() query: SummaryQueryDto) {
  //   return this.reportsService.getSummaryReport(query);
  // }
  // @Get('so')
  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @RequirePermissions('VIEW_REPORT')
  // @ApiOperation({ summary: '[Sở] Xem danh sách tất cả báo cáo' })
  // getAllReports(@Query() query: QueryReportDto) {
  //   return this.reportsService.getAllReport(query);
  // }

  // // GET /reports/so/:id — Sở xem chi tiết 1 báo cáo
  // @Get('so/:id')
  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @RequirePermissions('VIEW_REPORT')
  // @ApiOperation({ summary: '[Sở] Xem chi tiết báo cáo' })
  // getOneForSo(@Param('id', ParseIntPipe) id: number) {
  //   return this.reportsService.getReportByIdForSo(id);
  // }

  // // PATCH /reports/approve — Sở duyệt 1 hoặc nhiều báo cáo
  // @Patch('approve')
  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @RequirePermissions('APPROVE_REPORT')
  // @ApiOperation({
  //   summary: '[Sở] Duyệt 1 hoặc nhiều báo cáo (SUBMITTED → APPROVED)',
  // })
  // approve(@Req() req: AuthenticatedRequest, @Body() dto: ApproveRejectDto) {
  //   return this.reportsService.approveReports(req.user.sub, dto);
  // }

  // // PATCH /reports/reject — Sở từ chối 1 hoặc nhiều báo cáo
  // @Patch('reject')
  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @RequirePermissions('REJECT_REPORT')
  // @ApiOperation({
  //   summary: '[Sở] Từ chối 1 hoặc nhiều báo cáo (SUBMITTED → REJECTED)',
  // })
  // reject(@Req() req: AuthenticatedRequest, @Body() dto: ApproveRejectDto) {
  //   return this.reportsService.rejectReports(req.user.sub, dto);
  // }
}
