import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import dayjs from 'src/common/utils/dayjs';
import { ReportPeriodStatus } from '../entities/report_periods.entity';
const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? value : parsedValue;
};
export class QueryReportPeriodDto {
  @ApiProperty({
    example: 1,
    description: 'Số trang (mặc định: 1)',
    required: false,
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang phải lớn hơn 0' })
  page: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Số bản ghi mỗi trang (mặc định: 10)',
    required: false,
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'Số bản ghi mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số bản ghi mỗi trang phải lớn hơn 0' })
  @Max(100, { message: 'Số bản ghi mỗi trang không được vượt quá 100' })
  limit: number = 10;

  @ApiProperty({
    example: 'Báo cáo TNLĐ',
    description: 'Tìm kiếm theo tên kỳ báo cáo',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 2022,
    description: 'Tìm kiếm theo năm báo cáo',
    required: false,
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'Năm báo cáo phải là số nguyên' })
  @Min(1900, { message: 'Năm báo cáo không được nhỏ hơn 1900' })
  year?: number;

  @ApiProperty({
    example: 1,
    description: 'Tìm kiếm theo quý báo cáo (1 - 4)',
    required: false,
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'Quý báo cáo phải là số nguyên' })
  @Min(1, { message: 'Quý báo cáo phải từ 1 đến 4' })
  @Max(4, { message: 'Quý báo cáo phải từ 1 đến 4' })
  quarter?: number;

  @ApiProperty({
    example: '01/01/2022',
    description: 'Lọc các kỳ bắt đầu từ ngày này (định dạng dd/MM/yyyy)',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | null | undefined }) => {
    if (!value) return undefined;
    const date = dayjs(value, ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'], true);
    return date.isValid() ? date.toDate() : 'INVALID_DATE';
  })
  @IsDate({ message: 'Ngày bắt đầu không đúng định dạng (VD: dd/MM/yyyy)' })
  startDate?: Date;

  @ApiProperty({
    example: '31/12/2022',
    description: 'Lọc các kỳ kết thúc đến ngày này (định dạng dd/MM/yyyy)',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | null | undefined }) => {
    if (!value) return undefined;
    const date = dayjs(value, ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'], true);
    return date.isValid() ? date.toDate() : 'INVALID_DATE';
  })
  @IsDate({ message: 'Ngày kết thúc không đúng định dạng (VD: dd/MM/yyyy)' })
  endDate?: Date;

  @ApiProperty({
    example: 'OPEN',
    description: 'Lọc theo trạng thái kỳ báo cáo (OPEN / CLOSED)',
    required: false,
    enum: ReportPeriodStatus,
  })
  @IsOptional()
  @IsEnum(ReportPeriodStatus, {
    message: 'Trạng thái không hợp lệ, phải là OPEN hoặc CLOSED',
  })
  status?: ReportPeriodStatus;
}
