import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateInjuryFactorDto {
  @ApiProperty({ example: '17' })
  @IsString()
  code: string;
  @ApiProperty({ example: 'Té ngã ngang bằng (trượt ngã)' })
  @IsString()
  name: string;
  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class CreateInjuryTypeDto {
  @ApiProperty({ example: '036' })
  @IsString()
  code: string;
  @ApiProperty({ example: 'Đứt gân tay do vật sắc nhọn' })
  @IsString()
  name: string;
  @ApiProperty({ example: 3 })
  @IsInt()
  parentId: number;
}

export class CreateProfessionDto {
  @ApiProperty({ example: '7114' })
  @IsString()
  code: string;
  @ApiProperty({ example: 'Thợ lắp dựng khung thép' })
  @IsString()
  name: string;
  @ApiProperty({ example: 38 })
  @IsInt()
  @IsOptional()
  parentId?: number | null;
}
