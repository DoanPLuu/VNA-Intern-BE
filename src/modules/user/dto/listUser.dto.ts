import { Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? value : parsedValue;
};

export class ListUserDto {
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'Trang hiện tại phải là số nguyên' })
  @Min(1, { message: 'Trang hiện tại phải lớn hơn hoặc bằng 1' })
  page?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'Số lượng bản ghi mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng bản ghi mỗi trang phải lớn hơn hoặc bằng 1' })
  @Max(100, {
    message: 'Số lượng bản ghi mỗi trang phải nhỏ hơn hoặc bằng 100',
  })
  limit?: number;

  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullname?: string;

  @IsOptional()
  @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự' })
  username?: string;

  @IsOptional()
  @IsString({ message: 'Email phải là chuỗi ký tự' })
  email?: string;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'Vai trò phải là số nguyên' })
  roleId?: number;

  @IsOptional()
  @IsString({ message: 'Chức danh phải là chuỗi ký tự' })
  position?: string;

  @IsOptional()
  @IsBooleanString({
    message: 'Trạng thái kích hoạt chỉ nhận giá trị true hoặc false',
  })
  isActive?: string;
}
