import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsedValue = Number(value);

  return Number.isNaN(parsedValue) ? value : parsedValue;
};

export class QueryReportDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Số trang',
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang phải lớn hơn 0' })
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Số bản ghi mỗi trang',
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'Số bản ghi mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số bản ghi mỗi trang phải lớn hơn 0' })
  @Max(100, {
    message: 'Số bản ghi mỗi trang không được vượt quá 100',
  })
  limit: number = 10;

  @ApiPropertyOptional({
    example: 'PHẠM THIÊN ÂN',
    description: 'Tên doanh nghiệp',
  })
  @IsOptional()
  @IsString({
    message: 'Tên doanh nghiệp phải là chuỗi',
  })
  companyName?: string;

  @ApiPropertyOptional({
    example: '0317118106',
    description: 'Mã số thuế',
  })
  @IsOptional()
  @IsString({
    message: 'Mã số thuế phải là chuỗi',
  })
  taxCode?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID kỳ báo cáo',
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({
    message: 'Kỳ báo cáo phải là số nguyên',
  })
  reportPeriodId?: number;

  @ApiPropertyOptional({
    example: 2026,
    description: 'Năm báo cáo',
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({
    message: 'Năm báo cáo phải là số nguyên',
  })
  year?: number;

  @ApiPropertyOptional({
    example: 'SUBMITTED',
    enum: ReportStatus,
    description: 'Trạng thái báo cáo',
  })
  @IsOptional()
  @IsEnum(ReportStatus, {
    message: 'Trạng thái báo cáo không hợp lệ',
  })
  status?: ReportStatus;
}
