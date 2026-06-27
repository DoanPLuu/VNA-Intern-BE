import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportPeriod } from 'src/modules/report_periods/entities/report_periods.entity';
import { CategoryModule } from '../category/category.module';
import { Company } from '../company/entities/company.entity';
import { ReportAccidentDetail } from './entities/report-accident-detail.entity';
import { ReportStatistic } from './entities/report-statistic.entity';
import { Report } from './entities/report.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportDocxService } from './reportsDocx.service';
import { ReportPdfService } from './reportsPdf.service';
import { SoReportsController } from './so-reports.controller';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportAccidentDetail,
      ReportPeriod,
      ReportStatistic,
      Report,
      Company,
    ]),
    CategoryModule,
    JwtModule.register({}),
  ],
  controllers: [ReportsController, SoReportsController],
  providers: [ReportsService, ReportPdfService, ReportDocxService],
})
export class ReportsModule {}
