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
  @ApiPropertyOptional({ example: 2024, description: 'Năm báo cáo' })
  @Transform(toOptionalNumber)
  @IsOptional()
  @IsInt({ message: 'year phải là số nguyên' })
  year?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID Tỉnh/Thành phố' })
  @Transform(toOptionalNumber)
  @IsOptional()
  @IsInt({ message: 'provinceId phải là số nguyên' })
  provinceId?: number;
}
