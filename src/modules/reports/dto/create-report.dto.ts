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

// INSERT INTO report_periods (name, year, start_date, end_date, due_date, status)
// VALUES ('Báo cáo TNLĐ 6 tháng đầu năm 2026', 2026, '2026-01-01', '2026-06-30', '2026-07-15', 'OPEN');

/* 
{
  "report_period_id": 1,
  "company_info": {
    "total_employees": 100,
    "total_female_employees": 5,
    "total_salary_fund": 10000000
  },
  "general_statistic": {
    "total_accidents": 2,
    "total_fatal_accidents": 1,
    "total_accidents_with_two_or_more_victims": 1,
    "total_victims": 10,
    "total_female_victims": 5,
    "total_fatalities": 5,
    "total_seriously_injured": 10,
    "unmanaged_victims": 0,
    "unmanaged_female_victims": 0,
    "unmanaged_fatalities": 0,
    "unmanaged_seriously_injured": 0,
    "medical_expenses": 10000000,
    "salary_paid_during_treatment": 10000000,
    "compensation_expenses": 10000000,
    "total_leave_days": 20,
    "property_damage_expenses": 10000000
  },
  "general_statistic": {
  "total_accidents": 2,
  "total_fatal_accidents": 1,
  "total_accidents_with_two_or_more_victims": 1,
  "total_victims": 10,
  "total_female_victims": 5,
  "total_fatalities": 3,
  "total_seriously_injured": 4,
  "unmanaged_victims": 0,
  "unmanaged_female_victims": 0,
  "unmanaged_fatalities": 0,
  "unmanaged_seriously_injured": 0,
  "medical_expenses": 10000000,
  "salary_paid_during_treatment": 10000000,
  "compensation_expenses": 10000000,
  "total_leave_days": 20,
  "property_damage_expenses": 10000000
},
"general_details": [
  {
    "accident_cause_id": 1,
    "injury_factor_id": 5,
    "profession_id": 12,
    "total_victims": 6,
    "total_female_victims": 3,
    "total_fatalities": 2,
    "total_seriously_injured": 2,
    "unmanaged_victims": 0,
    "unmanaged_female_victims": 0,
    "unmanaged_fatalities": 0,
    "unmanaged_seriously_injured": 0,
    "medical_expenses": 5000000,
    "salary_paid_during_treatment": 5000000,
    "compensation_expenses": 5000000,
    "total_leave_days": 10,
    "property_damage_expenses": 5000000
  },
  {
    "accident_cause_id": 3,
    "injury_factor_id": 14,
    "profession_id": 24,
    "total_victims": 4,
    "total_female_victims": 2,
    "total_fatalities": 1,
    "total_seriously_injured": 2,
    "unmanaged_victims": 0,
    "unmanaged_female_victims": 0,
    "unmanaged_fatalities": 0,
    "unmanaged_seriously_injured": 0,
    "medical_expenses": 5000000,
    "salary_paid_during_treatment": 5000000,
    "compensation_expenses": 5000000,
    "total_leave_days": 10,
    "property_damage_expenses": 5000000
  }
],
  "subsidized_statistic": {
  "total_accidents": 2,
  "total_fatal_accidents": 1,
  "total_accidents_with_two_or_more_victims": 1,
  "total_victims": 10,
  "total_female_victims": 5,
  "total_fatalities": 3,
  "total_seriously_injured": 4,
  "unmanaged_victims": 0,
  "unmanaged_female_victims": 0,
  "unmanaged_fatalities": 0,
  "unmanaged_seriously_injured": 0,
  "medical_expenses": 10000000,
  "salary_paid_during_treatment": 10000000,
  "compensation_expenses": 10000000,
  "total_leave_days": 20,
  "property_damage_expenses": 10000000
},
"subsidized_details": [
  {
    "accident_cause_id": 1,
    "injury_factor_id": 5,
    "profession_id": 12,
    "total_victims": 6,
    "total_female_victims": 3,
    "total_fatalities": 2,
    "total_seriously_injured": 2,
    "unmanaged_victims": 0,
    "unmanaged_female_victims": 0,
    "unmanaged_fatalities": 0,
    "unmanaged_seriously_injured": 0,
    "medical_expenses": 5000000,
    "salary_paid_during_treatment": 5000000,
    "compensation_expenses": 5000000,
    "total_leave_days": 10,
    "property_damage_expenses": 5000000
  },
  {
    "accident_cause_id": 2,
    "injury_factor_id": 14,
    "profession_id": 12,
    "total_victims": 4,
    "total_female_victims": 2,
    "total_fatalities": 1,
    "total_seriously_injured": 2,
    "unmanaged_victims": 0,
    "unmanaged_female_victims": 0,
    "unmanaged_fatalities": 0,
    "unmanaged_seriously_injured": 0,
    "medical_expenses": 5000000,
    "salary_paid_during_treatment": 5000000,
    "compensation_expenses": 5000000,
    "total_leave_days": 10,
    "property_damage_expenses": 5000000
  }
]
}
*/
