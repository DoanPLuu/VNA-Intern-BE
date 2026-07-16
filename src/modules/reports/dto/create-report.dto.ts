import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsPositive, ValidateNested } from 'class-validator';
import { AccidentDetailDto } from './accident-detail.dto';
import { AccidentStatisticDto } from './accident-statistic.dto';
import { CompanyInfoDto } from './company-info.dto';

export class CreateReportDto {
  @ApiProperty({ example: 1, description: 'ID kỳ báo cáo' })
  @IsInt()
  @IsPositive()
  report_period_id: number;

  @ApiProperty({ type: CompanyInfoDto })
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  company_info: CompanyInfoDto;

  @ApiProperty({
    type: AccidentStatisticDto,
    description: 'Tổng số vụ TNLĐ chung',
  })
  @ValidateNested()
  @Type(() => AccidentStatisticDto)
  general_statistic: AccidentStatisticDto;

  @ApiProperty({
    type: [AccidentDetailDto],
    description:
      'Chi tiết từng vụ TNLĐ chung, số lượng phải bằng general_statistic.total_accidents',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccidentDetailDto)
  general_details: AccidentDetailDto[];

  @ApiProperty({
    type: AccidentStatisticDto,
    description: 'Tổng số vụ TNLĐ được hưởng trợ cấp',
  })
  @ValidateNested()
  @Type(() => AccidentStatisticDto)
  subsidized_statistic: AccidentStatisticDto;

  @ApiProperty({
    type: [AccidentDetailDto],
    description:
      'Chi tiết từng vụ TNLĐ được hưởng trợ cấp, số lượng phải bằng subsidized_statistic.total_accidents',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccidentDetailDto)
  subsidized_details: AccidentDetailDto[];
}
