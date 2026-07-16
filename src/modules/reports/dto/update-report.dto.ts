import { OmitType } from '@nestjs/swagger';
import { CreateReportDto } from './create-report.dto';
// Kế thừa toàn bộ của CreateReportDto ngoại trừ report_period_id
export class UpdateReportDto extends OmitType(CreateReportDto, [
  'report_period_id',
] as const) {}
