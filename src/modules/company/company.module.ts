import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { Company } from './entities/company.entity';
import { BusinessIndustry } from './entities/business-industry.entity';
import { BusinessType } from './entities/business-type.entity';
import { Account } from '../auth/entities/account.entity';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      BusinessIndustry,
      BusinessType,
      Account,
    ]),
    LocationModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
