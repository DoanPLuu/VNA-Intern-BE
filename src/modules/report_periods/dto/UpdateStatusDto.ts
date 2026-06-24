import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ReportPeriodStatus } from '../entities/report_periods.entity';

export class UpdateStatus {
  @ApiProperty({
    example: 'OPEN',
    required: false,
    enum: ReportPeriodStatus,
    description: 'Trạng thái kỳ báo cáo',
  })
  @IsOptional()
  @IsEnum(ReportPeriodStatus, {
    message: 'Trạng thái không hợp lệ, phải là OPEN hoặc CLOSED',
  })
  status?: ReportPeriodStatus;
}
