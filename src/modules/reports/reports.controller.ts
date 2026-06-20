import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { AccountType } from '../auth/entities/account.entity';
import { UpdateReportDto } from './dto/update-report.dto';

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

  // PATCH /reports/:id/submit
  @Patch(':id/submit')
  @ApiOperation({ summary: 'Nộp báo cáo (DRAFT → SUBMITTED)' })
  submit(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reportsService.submitReport(req.user.sub, id);
  }
}
