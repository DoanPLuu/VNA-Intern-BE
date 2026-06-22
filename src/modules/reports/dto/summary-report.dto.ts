import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

export class SummaryQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'ID kỳ báo cáo (bắt buộc)' })
  @Transform(toOptionalNumber)
  @IsOptional()
  @IsInt({ message: 'reportPeriodId phải là số nguyên' })
  reportPeriodId?: number;
}
