import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import { AccidentStatisticDto } from './accident_statistic.dto';

export class AccidentDetailDto extends AccidentStatisticDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Vui lòng chọn nguyên nhân tai nạn' })
  @IsInt()
  @IsPositive()
  accident_cause_id: number;

  @ApiProperty({ example: 5 })
  @IsNotEmpty({ message: 'Vui lòng chọn yếu tố gây chấn thương' })
  @IsInt()
  @IsPositive()
  injury_factor_id: number;

  @ApiProperty({ example: 12 })
  @IsNotEmpty({ message: 'Vui lòng chọn nghề nghiệp' })
  @IsInt()
  @IsPositive()
  profession_id: number;
}
