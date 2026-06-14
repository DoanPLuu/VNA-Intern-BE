import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword, Matches } from 'class-validator';

export class InitializeCompanyPassword {
  @ApiProperty({ example: '1234567890' })
  @Matches(/^(\d{10}|\d{10}-\d{3})$/, {
    message:
      'Mã số thuế không hợp lệ, phải đủ 10 chữ số hoặc 13 chữ số. Vd: 1234567890 hoặc 1234567890-123',
  })
  tax_code: string;

  @ApiProperty({ example: 'Comp@ny123' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
    },
  )
  password: string;
}
