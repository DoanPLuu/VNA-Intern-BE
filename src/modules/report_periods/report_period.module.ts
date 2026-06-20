import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportPeriod } from './entities/report_periods.entity';
import { LocationController } from './report_period.controller';
import { ReportPeriodService } from './report_period.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReportPeriod])],
  controllers: [LocationController],
  providers: [ReportPeriodService],
  exports: [ReportPeriodService],
})
export class LocationModule {}
