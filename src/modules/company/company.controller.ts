import { Body, Controller, Get, Post } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompany } from './dto/company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}
  @Post('/previewCompany')
  preview(@Body() dto: CreateCompany) {
    return this.companyService.previewCompany(dto);
  }
  @Post('/createCompany')
  create(@Body() dto: CreateCompany) {
    return this.companyService.createCompany(dto);
  }

  @Get('companies')
  getAllCompanies() {
    return this.companyService.getAllCompanies();
  }

  @Get('/businessType')
  getAllBusinessType() {
    return this.companyService.getAllBusinessType();
  }
  @Get('/businessIndustry')
  getAllBusinessIndustry() {
    return this.companyService.getAllBusinessIndustry();
  }
}
