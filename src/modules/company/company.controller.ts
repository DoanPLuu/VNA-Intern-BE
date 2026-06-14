import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompany } from './dto/company.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { AccountType } from '../auth/entities/account.entity';
import {
  ConfirmChangeCompanyEmailDTO,
  UpdateCompany,
} from './dto/update-company.dto';
import { InitializeCompanyPassword } from './dto/initialize-company-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response as ExpressResponse } from 'express';
import * as XLSX from 'xlsx';
import { Response as ApiResponse } from 'src/common';

interface JwtPayload {
  sub: number;
  username: string;
  accountType: AccountType;
}
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}
  @Post('/preview-company')
  preview(@Body() dto: CreateCompany) {
    return this.companyService.previewCompany(dto);
  }
  @Post('/create-company')
  create(@Body() dto: CreateCompany) {
    return this.companyService.createCompany(dto);
  }

  @Get('companies')
  getAllCompanies() {
    return this.companyService.getAllCompanies();
  }

  @Get('/business-type')
  getAllBusinessType() {
    return this.companyService.getAllBusinessType();
  }
  @Get('/business-industry')
  getAllBusinessIndustry() {
    return this.companyService.getAllBusinessIndustry();
  }

  @Get(':tax_code/company-profile')
  getCompanyProfile(@Param('tax_code') tax_code: string) {
    return this.companyService.getCompanyProfile(tax_code);
  }

  @Post(':taxCode/ban-company')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khóa tài khoản doanh nghiệp' })
  async banCompany(@Param('taxCode') taxCode: string) {
    return this.companyService.banCompany(taxCode);
  }

  @Post(':taxCode/unban-company')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khôi phục tài khoản doanh nghiệp' })
  async unbanCompany(@Param('taxCode') taxCode: string) {
    return this.companyService.unbanCompany(taxCode);
  }

  @Delete(':taxCode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa doanh nghiệp' })
  async deleteCompany(
    @Param('taxCode') taxCode: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companyService.deleteCompany(req.user.accountType, taxCode);
  }

  @Post(':taxCode/preview-update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preview thông tin doanh nghiệp sau khi chỉnh sửa' })
  async previewUpdateCompany(
    @Param('taxCode') taxCode: string,
    @Body() dto: UpdateCompany,
  ) {
    return this.companyService.previewUpdateCompany(taxCode, dto);
  }
  @Patch(':taxCode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin doanh nghiệp' })
  async updateCompany(
    @Param('taxCode') taxCode: string,
    @Body() dto: UpdateCompany,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companyService.updateCompany(taxCode, dto, req.user);
  }
  @Post(':taxCode/change-email/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bước 1: Gửi OTP đến email cũ để xác nhận đổi email DN',
  })
  async requestChangeCompanyEmail(
    @Param('taxCode') taxCode: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companyService.requestChangeCompanyEmail(taxCode, req.user);
  }

  @Post(':taxCode/change-email/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bước 2: Xác nhận OTP và cập nhật email mới' })
  async confirmChangeCompanyEmail(
    @Param('taxCode') taxCode: string,
    @Body() dto: ConfirmChangeCompanyEmailDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companyService.confirmChangeCompanyEmail(
      taxCode,
      dto.otp,
      dto.newEmail,
      req.user,
    );
  }

  @Post('reinitialize-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khởi tạo lại mật khẩu doanh nghiệp' })
  async reinitializeCompanyPassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: InitializeCompanyPassword,
  ) {
    return this.companyService.reinitializeCompanyPassword(
      req.user.accountType,
      dto,
    );
  }

  // company.controller.ts

  @Get('import/template')
  downloadTemplate(@Res() res: ExpressResponse): void {
    const headers = [
      'Tên doanh nghiệp',
      'Mã số thuế',
      'Loại hình kinh doanh',
      'Ngành nghề kinh doanh',
      'Tỉnh/TP ĐKKD',
      'Phường/Xã ĐKKD',
      'Email',
      'Ngày cấp GPKD',
      'Địa chỉ ĐKKD',
      'Tên nước ngoài',
      'SĐT doanh nghiệp',
      'Người đại diện',
      'SĐT đại diện',
      'Tỉnh/TP HĐKD',
      'Phường/Xã HĐKD',
      'Địa chỉ HĐKD',
    ];

    const exampleRow = [
      'Công ty TNHH Môi trường xanh',
      '1234567890',
      'Công ty TNHH một thành viên',
      'Trồng rừng và chăm sóc rừng',
      'Tp Hồ Chí Minh',
      'Phường Chợ Lớn',
      'gnagroup@gmail.com',
      '09-01-2020',
      '192 Nguyễn Trãi',
      'GNA Group',
      '0912345678',
      'Trần Thị B',
      '0819231432',
      'Tp Hồ Chí Minh',
      'Phường Bình Thọ',
      '192 Nguyễn Trãi',
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách doanh nghiệp');
    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=template_doanh_nghiep.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  // Upload file import
  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importFromFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw ApiResponse.errorBad('Vui lòng upload file Excel');
    return this.companyService.importFromFile(file);
  }
}
