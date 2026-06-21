import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportPeriod } from './entities/report_periods.entity';
import { ReportPeriodController } from './report_period.controller';
import { ReportPeriodService } from './report_period.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([ReportPeriod]), JwtModule.register({})],
  controllers: [ReportPeriodController],
  providers: [ReportPeriodService],
  exports: [ReportPeriodService],
})
export class ReportPeriodModule {}
