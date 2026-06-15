import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleUserActiveDto {
  @ApiProperty({ example: true, description: 'Trạng thái kích hoạt tài khoản' })
  @IsBoolean({ message: 'Trạng thái kích hoạt phải là true hoặc false' })
  isActive: boolean;
}
