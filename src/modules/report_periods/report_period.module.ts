import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportPeriod } from './entities/report_periods.entity';
import { ReportPeriodController } from './report_period.controller';
import { ReportPeriodService } from './report_period.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReportPeriod])],
  controllers: [ReportPeriodController],
  providers: [ReportPeriodService],
  exports: [ReportPeriodService],
})
export class ReportPeriodModule {}
