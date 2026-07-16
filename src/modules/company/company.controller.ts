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
import {
  ConfirmChangeCompanyEmailDTO,
  UpdateCompany,
} from './dto/update-company.dto';
import { InitializeCompanyPassword } from './dto/initialize-company-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response as ExpressResponse } from 'express';
import { Response as ApiResponse } from 'src/common';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { JwtPayload } from 'src/common/guards/jwt.strategy';
import { AccountType } from '../auth/entities/account.entity';

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

  @Get('/business-type')
  getAllBusinessType() {
    return this.companyService.getAllBusinessType();
  }

  @Get('/business-industry')
  getAllBusinessIndustry() {
    return this.companyService.getAllBusinessIndustry();
  }

  @Get('import/template')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tải file Excel mẫu để import doanh nghiệp' })
  async downloadTemplate(@Res() res: ExpressResponse) {
    const buffer = await this.companyService.generateImportCompanyTemplate();

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

  @Post('import/preview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CREATE_COMPANY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra file Excel trước khi import' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async previewImportFromFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file)
      throw ApiResponse.errorBad('Vui lòng chọn file Excel để kiểm tra');
    return this.companyService.previewImportCompanies(file.buffer);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CREATE_COMPANY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import doanh nghiệp từ file Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importFromFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw ApiResponse.errorBad('Vui lòng upload file Excel');
    return this.companyService.importFromFile(file);
  }

  @Get('deleted-companies')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('VIEW_COMPANY')
  getDeletedCompanies() {
    return this.companyService.getDeletedCompanies();
  }

  // Cần auth, dùng chung SO/DN

  @Get('companies')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('VIEW_COMPANY')
  getAllCompanies() {
    return this.companyService.getAllCompanies();
  }

  @Get(':tax_code/company-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getCompanyProfile(@Param('tax_code') tax_code: string) {
    return this.companyService.getCompanyProfile(tax_code);
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE_COMPANY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin doanh nghiệp' })
  async updateCompany(
    @Param('taxCode') taxCode: string,
    @Body() dto: UpdateCompany,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companyService.updateCompany(taxCode, dto, req.user);
  }

  // Chỉ DN

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

  // Chỉ SO

  @Post('/create-company')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('CREATE_COMPANY')
  create(@Body() dto: CreateCompany, @Req() req: AuthenticatedRequest) {
    return this.companyService.createCompany(
      req.user.accountType as AccountType,
      dto,
    );
  }

  @Post(':taxCode/ban-company')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('BAN_COMPANY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khóa tài khoản doanh nghiệp' })
  async banCompany(
    @Param('taxCode') taxCode: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companyService.banCompany(
      req.user.accountType as AccountType,
      taxCode,
    );
  }

  @Post(':taxCode/unban-company')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('BAN_COMPANY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khôi phục tài khoản doanh nghiệp' })
  async unbanCompany(
    @Param('taxCode') taxCode: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companyService.unbanCompany(
      req.user.accountType as AccountType,
      taxCode,
    );
  }

  @Delete(':taxCode')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('DELETE_COMPANY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa doanh nghiệp' })
  async deleteCompany(
    @Param('taxCode') taxCode: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companyService.deleteCompany(
      req.user.accountType as AccountType,
      taxCode,
    );
  }

  @Patch(':taxCode/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('DELETE_COMPANY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khôi phục doanh nghiệp đã xóa' })
  async restoreCompany(
    @Param('taxCode') taxCode: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companyService.restoreCompany(
      req.user.accountType as AccountType,
      taxCode,
    );
  }

  @Post('reinitialize-password')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE_COMPANY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khởi tạo lại mật khẩu doanh nghiệp' })
  async reinitializeCompanyPassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: InitializeCompanyPassword,
  ) {
    return this.companyService.reinitializeCompanyPassword(
      req.user.accountType as AccountType,
      dto,
    );
  }
}
