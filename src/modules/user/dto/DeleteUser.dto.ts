import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

export class DeleteUsersDto {
  @ApiProperty({ example: [1, 2, 3] })
  @IsArray({ message: 'Danh sách tài khoản phải là một mảng' })
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất một tài khoản' })
  @ArrayUnique({
    message: 'Danh sách tài khoản không được chứa giá trị trùng lặp',
  })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value) ? value.map((item) => Number(item)) : value,
  )
  @IsInt({ each: true, message: 'Mỗi mã tài khoản phải là số nguyên' })
  @Min(1, { each: true, message: 'Mỗi mã tài khoản phải lớn hơn hoặc bằng 1' })
  accountIds: number[];
}
