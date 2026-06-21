import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class ApproveRejectDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Danh sách ID báo cáo cần duyệt hoặc từ chối',
    type: [Number],
  })
  @IsArray({ message: 'Phải là danh sách ID báo cáo' })
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 báo cáo' })
  @IsInt({ each: true, message: 'Mỗi ID phải là số nguyên' })
  reportIds: number[];

  @ApiProperty({
    example: 'Báo cáo chưa đầy đủ thông tin',
    description: 'Lý do từ chối (bắt buộc khi từ chối)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Lý do phải là chuỗi ký tự' })
  note?: string;
}
