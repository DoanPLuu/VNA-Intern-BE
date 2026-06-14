import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IsNotFutureDate } from 'src/common/validators/is-not-future-date.decorator';
const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return value === true || value === 'true';
};

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'Vai trò phải là các trường hợp đã tồn tại' })
  @Min(1, { message: 'Vai trò phải lớn hơn hoặc bằng 1' })
  roleId?: number;

  @ApiPropertyOptional({ example: '1995-06-01' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không đúng định dạng YYYY-MM-DD' })
  @IsNotFutureDate({ message: 'Ngày sinh không được lớn hơn ngày hiện tại' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Nam' })
  @IsOptional()
  @IsString({ message: 'Giới tính phải là chuỗi ký tự' })
  gender?: string;

  @ApiPropertyOptional({ example: 'Chuyen vien' })
  @IsOptional()
  @IsString({ message: 'Chức danh phải là chuỗi ký tự' })
  position?: string;

  @ApiPropertyOptional({ example: 'Thanh pho Ho Chi Minh' })
  @IsOptional()
  @IsString({ message: 'Tỉnh/thành phố phải là chuỗi ký tự' })
  province?: string;

  @ApiPropertyOptional({ example: 'Phuong Go Vap' })
  @IsOptional()
  @IsString({ message: 'Phường/xã phải là chuỗi ký tự' })
  ward?: string;

  @ApiPropertyOptional({ example: '123 Nguyen Trai' })
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  address?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString({ message: 'Đường dẫn ảnh đại diện phải là chuỗi ký tự' })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'Trạng thái kích hoạt phải là true hoặc false' })
  isActive?: boolean;
}
