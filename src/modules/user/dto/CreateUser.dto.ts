import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { IsNotFutureDate } from 'src/common/validators/is-not-future-date.decorator';
const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return value === true || value === 'true';
};
export class CreateUserDto {
  @ApiProperty({ example: 'admin-vna' })
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự' })
  @Length(3, 100, {
    message: 'Tên đăng nhập phải từ 3 đến 100 ký tự',
  })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới (_) và dấu gạch ngang (-)',
  })
  username: string;

  @ApiPropertyOptional({
    example: 'Admin@123',
    default: '12345678',
  })
  @IsOptional()
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự',
  })
  password?: string;

  @ApiProperty({ example: 'admin@gmail.com' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @ApiProperty({ example: 1 })
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({ message: 'Vai trò không được để trống' })
  @IsInt({ message: 'Vai trò phải là số nguyên' })
  @Min(1, { message: 'Vai trò phải lớn hơn hoặc bằng 1' })
  roleId: number;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName: string;

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

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'Trạng thái kích hoạt phải là true hoặc false' })
  isActive?: boolean;
}
