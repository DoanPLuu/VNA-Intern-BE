import { Body, Controller, Post } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompany } from './dto/company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}
  @Post('/preview')
  preview(@Body() dto: CreateCompany) {
    return this.companyService.previewCompany(dto);
  }
  @Post('/create')
  create(@Body() dto: CreateCompany) {
    return this.companyService.createCompany(dto);
  }
}
