import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateCompany {
  @ApiProperty()
  @IsNotEmpty({ message: 'Tên doanh nghiệp không được để trống' })
  @Matches(/^[a-zA-Z0-9\s]+$/, {
    message: 'Không được chứa ký tự đặc biệt',
  })
  business_name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Mã số thuế không được để trống' })
  @Matches(/^(\d{10}|\d{10}-\d{3})$/, {
    message:
      'Mã số thuế không hợp lệ, phải đủ 10 chữ số hoặc 13 chữ số. Vd: 1234567890 hoặc 1234567890-123',
  })
  tax_code: string;

  @ApiProperty()
  @IsNotEmpty({
    message: 'Bắt buộc phải chọn loại hình kinh doanh cho doanh nghiệp',
  })
  @IsString()
  business_type: string;

  @ApiProperty()
  @IsNotEmpty({
    message: 'Bắt buộc phải chọn ngành nghề kinh doanh chính cho doanh nghiệp',
  })
  @IsString()
  business_industry: string;

  // Ngày cấp GPKD
  @ApiProperty()
  @IsOptional()
  @IsDate()
  license_issue_date: Date;

  // Tỉnh/Thành phố đăng ký kinh doanh
  @ApiProperty()
  @IsNotEmpty({
    message: 'Bắt buộc phải cung cấp tỉnh/thành phố đăng ký kinh doanh',
  })
  @IsString()
  license_registration_province: string;

  // Phường/Xã đăng ký kinh doanh
  @ApiProperty()
  @IsNotEmpty({
    message: 'Bắt buộc phải cung cấp phường xã đăng ký kinh doanh',
  })
  @IsString()
  license_registration_ward: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  license_registration_adress: string;

  // Tên doanh nghiệp bằng tiếng nước ngoài
  @ApiProperty()
  @IsOptional()
  @IsString()
  foreign_business_name: string;

  @ApiProperty()
  @IsNotEmpty({
    message:
      'Bắt buộc phải cung cấp email để có thể sử dụng chức năng quên mật khẩu hoặc thay đổi email',
  })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email không đúng định dạng',
  })
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  business_phone?: string | null;

  // Tỉnh/thành phố hoạt động kinh doanh
  @ApiProperty()
  @IsOptional()
  @IsString()
  business_operating_province?: string | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  business_operating_ward?: string | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  business_operating_adress?: string | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  representative_name?: string | null;

  @ApiProperty()
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
