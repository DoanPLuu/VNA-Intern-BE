import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
export class LoginDTO {
  @ApiProperty({ example: 'admin' })
  @IsOptional({ message: 'Username khong duoc de trong' })
  @IsString({ message: 'Username phai la 1 chuoi' })
  username: string;

  @ApiProperty({ example: 'Admin@123' })
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

export class ConfirmNewEmailDTO {
  @ApiProperty({ example: '767155' })
  @IsOptional()
  @IsString()
  otp: string;

  @ApiProperty({ example: 'newEmail@gmail.com' })
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
export class ChangePasswordDTO {
  @ApiProperty({ example: 'Admin@123' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  @IsString({ message: 'Mật khẩu không hợp lệ' })
  password: string;

  @ApiProperty({ example: 'Admin@456' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  newPassword: string;

  @ApiProperty({ example: 'Admin@456' })
  @IsNotEmpty({ message: 'Vui lòng xác nhận mật khẩu mới' })
  @MinLength(8, { message: 'Xác nhận mật khẩu phải có ít nhất 8 ký tự' })
  confirmPassword: string;
}
//user-manager
export class AdminVerifyChangeEmailOtpDTO {
  @ApiProperty({ example: '123456' })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString({ message: 'Mã OTP phải là chuỗi ký tự' })
  @Length(6, 6, { message: 'Mã OTP phải gồm 6 ký tự' })
  otp: string;
}

export class AdminSubmitNewEmailDTO {
  @ApiProperty({ example: 'newemail@gmail.com' })
  @IsNotEmpty({ message: 'Email mới không được để trống' })
  @IsEmail({}, { message: 'Email mới không đúng định dạng' })
  newEmail: string;

  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @IsNotEmpty({ message: 'Phiên đổi email không được để trống' })
  @IsString({ message: 'Phiên đổi email không hợp lệ' })
  sessionId: string;
}
