import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { IsNotFutureDate } from 'src/common/validators/is-not-future-date.decorator';
import dayjs from 'src/common/utils/dayjs';

export class CreateCompany {
  @ApiProperty({ example: 'Công ty TNHH Môi trường xanh' })
  @Transform(({ value }: { value: string }) => value?.trim())
  @IsNotEmpty({ message: 'Tên doanh nghiệp không được để trống' })
  @Matches(/^[\p{L}\p{N}\s]+$/u, {
    message: 'Không được chứa ký tự đặc biệt',
  })
  business_name: string;

  @ApiProperty({ example: '1234567890' })
  @IsNotEmpty({ message: 'Mã số thuế không được để trống' })
  @Matches(/^(\d{10}|\d{10}-\d{3})$/, {
    message:
      'Mã số thuế không hợp lệ, phải đủ 10 chữ số hoặc 13 chữ số. Vd: 1234567890 hoặc 1234567890-123',
  })
  tax_code: string;

  @ApiProperty({ example: 'Công ty TNHH một thành viên' })
  @IsNotEmpty({
    message: 'Bắt buộc phải chọn loại hình kinh doanh cho doanh nghiệp',
  })
  @IsString()
  business_type: string;

  @ApiProperty({ example: 'Trồng rừng và chăm sóc rừng' })
  @IsNotEmpty({
    message: 'Bắt buộc phải chọn ngành nghề kinh doanh chính cho doanh nghiệp',
  })
  @IsString()
  business_industry: string;

  // Ngày cấp GPKD
  @ApiProperty({ example: '09/01/2020' })
  @Transform(({ value }: { value: string | null | undefined }) => {
    if (!value) return null;
    const date = dayjs(value, ['DD/MM/YYYY', 'DD-MM-YYYY'], true);
    return date.isValid() ? date.toDate() : 'INVALID_DATE';
  })
  @IsOptional()
  @IsDate({ message: 'Ngày cấp GPKD không đúng định dạng dd/MM/yyyy' })
  @IsNotFutureDate({
    message: 'Ngày cấp GPKD không được lớn hơn ngày hiện tại',
  })
  license_issue_date?: Date | null;

  // Tỉnh/Thành phố đăng ký kinh doanh
  @ApiProperty({ example: 'Tp Hồ Chí Minh' })
  @IsNotEmpty({
    message: 'Bắt buộc phải cung cấp tỉnh/thành phố đăng ký kinh doanh',
  })
  @IsString()
  license_registration_province: string;

  // Phường/Xã đăng ký kinh doanh
  @ApiProperty({ example: 'Phường Chợ Lớn' })
  @IsNotEmpty({
    message: 'Bắt buộc phải cung cấp phường xã đăng ký kinh doanh',
  })
  @IsString()
  license_registration_ward: string;

  @ApiProperty({ example: '192 Nguyễn Trãi' })
  @IsOptional()
  @IsString()
  license_registration_adress?: string | null;

  // Tên doanh nghiệp bằng tiếng nước ngoài
  @ApiProperty({ example: 'GNA Group' })
  @IsOptional()
  @IsString()
  foreign_business_name?: string | null;

  @ApiProperty({ example: 'gnagroup@gmail.com' })
  @IsNotEmpty({
    message:
      'Bắt buộc phải cung cấp email để có thể sử dụng chức năng quên mật khẩu hoặc thay đổi email',
  })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email không đúng định dạng',
  })
  email: string;

  @ApiProperty({ example: '0912345678' })
  @IsOptional()
  @IsString()
  business_phone?: string | null;

  // Tỉnh/thành phố hoạt động kinh doanh
  @ApiProperty({ example: 'Tp Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  business_operating_province?: string | null;

  @ApiProperty({ example: 'Phường Chợ Lớn' })
  @IsOptional()
  @IsString()
  business_operating_ward?: string | null;

  @ApiProperty({ example: '192 Nguyễn Trãi' })
  @IsOptional()
  @IsString()
  business_operating_adress?: string | null;

  @ApiProperty({ example: 'Trần Thị B' })
  @IsOptional()
  @IsString()
  representative_name?: string | null;

  @ApiProperty({ example: '0819231432' })
  @IsOptional()
  @IsString()
  representative_phone?: string | null;

  // Đường dẫn file giấy phép kinh doanh
  @ApiProperty()
  @IsOptional()
  @IsString()
  business_license_file_url?: string | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  other_document_file_url?: string | null;
}
