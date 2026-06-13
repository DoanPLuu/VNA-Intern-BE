import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompany } from './dto/company.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { AccountType } from '../auth/entities/account.entity';
import {
  ConfirmChangeCompanyEmailDTO,
  UpdateCompany,
} from './dto/update-company.dto';
import { InitializeCompanyPassword } from './dto/initialize-company-password.dto';

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
}
