import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportAccidentDetail } from './entities/report-accident-detail.entity';
import { ReportPeriod } from './entities/report-period.entity';
import { ReportStatistic } from './entities/report-statistic.entity';
import { Report } from './entities/report.entity';
import { Company } from '../company/entities/company.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportAccidentDetail,
      ReportPeriod,
      ReportStatistic,
      Report,
      Company,
    ]),
    JwtModule.register({}),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
