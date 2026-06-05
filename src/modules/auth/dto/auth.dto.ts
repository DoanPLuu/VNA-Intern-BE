import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
  IsEmail,
} from 'class-validator';
export class LoginDTO {
  @ApiProperty()
  @IsOptional({ message: 'Username khong duoc de trong' })
  @IsString({ message: 'Username phai la 1 chuoi' })
  username: string;

  @ApiProperty()
  @IsOptional({ message: 'Password khong duoc de trong' })
  @IsString({ message: 'Password phai la 1 chuoi' })
  password: string;

  @ApiProperty()
  @IsBoolean({ message: 'RememberMe phai la 1 boolean' })
  rememberMe: boolean;
}

export class RegisterDTO {
  @ApiProperty()
  @IsOptional({ message: 'Username khong duoc de trong' })
  @IsString({ message: 'Username phai la 1 chuoi' })
  username: string;

  @ApiProperty()
  @IsOptional({ message: 'Password khong duoc de trong' })
  @IsString({ message: 'Password phai la 1 chuoi' })
  password: string;
}

export class RefreshTokenDTO {
  @ApiProperty()
  @IsOptional({ message: 'Refresh token khong duoc de trong' })
  @IsString({ message: 'Refresh token phai la 1 chuoi' })
  refreshToken: string;
}

export class ChangePasswordDTO {
  @ApiProperty()
  @IsOptional({ message: 'Vui long nhap mat khau cu' })
  oldPassword: string;

  @ApiProperty()
  @IsOptional({ message: 'Vui long nhap mat khau moi' })
  newPassword: string;
}

export class VerifyOtpDTO {
  @ApiProperty()
  @IsOptional({ message: 'Vui long nhap ma otp' })
  @Length(6, 6, { message: 'Ma OTP phai gom 6 ky tu' })
  otp: string;
}

export class ConfirmNewEmailDTO {
  @ApiProperty()
  @IsOptional({ message: 'Vui long nhap email moi' })
  @IsString({ message: 'Email phai la 1 chuoi' })
  email: string;
}
export class ResetPasswordDTO {
  @ApiProperty()
  @IsNotEmpty({ message: 'Vui lòng nhập email' })
  @IsEmail({}, { message: 'vui lòng nhập đúng định dạng' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Vui lòng nhập mã otp' })
  @Length(6, 6, { message: 'Mã OTP phải gồm 6 ký tự' })
  otp: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  newPassword: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Vui lòng xác nhận mật khẩu mới' })
  @MinLength(8, { message: 'Xác nhận mật khẩu phải có ít nhất 8 ký tự' })
  confirmPassword: string;
}
