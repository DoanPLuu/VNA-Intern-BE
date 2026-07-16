import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import dayjs from 'src/common/utils/dayjs';
import { IsNotFutureDate } from 'src/common/validators/is-not-future-date.decorator';

export class UpdateCompany {
  // Thông tin doanh nghiệp
  @ApiProperty({ example: 'Công ty TNHH Môi trường xanh' })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  @Matches(/^[\p{L}\p{N}\s]+$/u, { message: 'Không được chứa ký tự đặc biệt' })
  business_name?: string;

  @ApiProperty({ example: 'GNA Group' })
  @IsOptional()
  @IsString()
  foreign_business_name?: string | null;

  @ApiProperty({ example: 'Công ty TNHH một thành viên' })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  @IsString()
  business_type?: string;

  @ApiProperty({ example: 'Trồng rừng và chăm sóc rừng' })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  @IsString()
  business_industry?: string;

  @ApiProperty({ example: '09-01-2020' })
  @IsOptional()
  @Transform(({ value }: { value: string | null | undefined }) => {
    if (!value) return null;
    const date = dayjs(value, ['DD/MM/YYYY', 'DD-MM-YYYY'], true);
    return date.isValid() ? date.toDate() : 'INVALID_DATE';
  })
  @IsDate({ message: 'Ngày cấp GPKD không đúng định dạng dd/MM/yyyy' })
  @IsNotFutureDate({
    message: 'Ngày cấp GPKD không được lớn hơn ngày hiện tại',
  })
  license_issue_date?: Date | null;

  // Địa chỉ ĐKKD
  @ApiProperty({ example: 'Tp Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  license_registration_province?: string;

  @ApiProperty({ example: 'Phường Chợ Lớn' })
  @IsOptional()
  @IsString()
  license_registration_ward?: string;

  @ApiProperty({ example: '192 Nguyễn Trãi' })
  @IsOptional()
  @IsString()
  license_registration_adress?: string;

  @ApiProperty({ example: 'gnagroup@gmail.com' })
  @IsOptional()
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email không đúng định dạng',
  })
  email?: string;

  @ApiProperty({ example: '0912345678' })
  @IsOptional()
  @IsString()
  business_phone?: string | null;

  @ApiProperty({ example: 'Trần Thị B' })
  @IsOptional()
  @IsString()
  representative_name?: string | null;

  @ApiProperty({ example: '0819231432' })
  @IsOptional()
  @IsString()
  representative_phone?: string | null;

  // Địa chỉ HĐKD
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

  // File đính kèm
  @ApiProperty()
  @IsOptional()
  @IsString()
  business_license_file_url?: string | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  other_document_file_url?: string | null;
}
export class ConfirmChangeCompanyEmailDTO {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ example: 'newemail@gmail.com' })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email không đúng định dạng',
  })
  newEmail: string;
}
