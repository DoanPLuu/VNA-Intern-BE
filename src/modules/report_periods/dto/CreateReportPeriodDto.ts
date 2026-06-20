import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import dayjs from 'src/common/utils/dayjs';
import { ReportPeriodStatus } from '../entities/report_periods.entity';

export class CreateReportPeriodDto {
  @ApiProperty({
    example: 'Báo cáo TNLĐ 6 tháng đầu năm 2022',
    description: 'Tên kỳ báo cáo',
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  @IsNotEmpty({ message: 'Tên kỳ báo cáo không được để trống' })
  @IsString({ message: 'Tên kỳ báo cáo phải là chuỗi ký tự' })
  name: string;

  @ApiProperty({ example: 2022, description: 'Năm báo cáo' })
  @IsNotEmpty({ message: 'Năm báo cáo không được để trống' })
  @IsInt({ message: 'Năm báo cáo phải là số nguyên' })
  @Min(1900, { message: 'Năm báo cáo không được nhỏ hơn năm 1900' })
  year: number;

  @ApiProperty({
    example: 1,
    description: 'Quý báo cáo (1 - 4)',
  })
  @IsNotEmpty({ message: 'Quý báo cáo không được để trống' })
  @IsInt({ message: 'Quý báo cáo phải là số nguyên' })
  @Min(1, { message: 'Quý báo cáo phải từ quý 1 đến quý 4' })
  @Max(4, { message: 'Quý báo cáo phải từ quý 1 đến quý 4' })
  quarter: number;

  @ApiProperty({
    example: '01/01/2022',
    description: 'Ngày bắt đầu kỳ báo cáo (định dạng dd/MM/yyyy)',
  })
  @Transform(({ value }: { value: string | null | undefined }) => {
    if (!value) return 'INVALID_DATE';
    const date = dayjs(value, ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'], true);
    return date.isValid() ? date.toDate() : 'INVALID_DATE';
  })
  @IsNotEmpty({ message: 'Ngày bắt đầu không được để trống' })
  @IsDate({
    message: 'Ngày bắt đầu không đúng định dạng ngày hợp lệ (VD: dd/MM/yyyy)',
  })
  startDate: Date;

  @ApiProperty({
    example: '30/06/2022',
    description: 'Ngày kết thúc kỳ báo cáo (định dạng dd/MM/yyyy)',
  })
  @Transform(({ value }: { value: string | null | undefined }) => {
    if (!value) return 'INVALID_DATE';
    const date = dayjs(value, ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'], true);
    return date.isValid() ? date.toDate() : 'INVALID_DATE';
  })
  @IsNotEmpty({ message: 'Ngày kết thúc không được để trống' })
  @IsDate({
    message: 'Ngày kết thúc không đúng định dạng ngày hợp lệ (VD: dd/MM/yyyy)',
  })
  endDate: Date;

  @ApiProperty({
    example: '15/07/2022',
    description: 'Hạn chót nộp báo cáo (định dạng dd/MM/yyyy)',
  })
  @Transform(({ value }: { value: string | null | undefined }) => {
    if (!value) return 'INVALID_DATE';
    const date = dayjs(value, ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'], true);
    return date.isValid() ? date.toDate() : 'INVALID_DATE';
  })
  @IsNotEmpty({ message: 'Ngày hạn chót không được để trống' })
  @IsDate({
    message: 'Ngày hạn chót không đúng định dạng ngày hợp lệ (VD: dd/MM/yyyy)',
  })
  dueDate: Date; // Đã loại bỏ decorator @IsNotFutureDate() bị sai logic

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
