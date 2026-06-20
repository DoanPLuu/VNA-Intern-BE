import { OmitType } from '@nestjs/swagger';
import { CreateReportDto } from './create-report.dto';
// Kế thừa toàn bộ của CreateReportDto ngoại trừ report_period_id
export class UpdateReportDto extends OmitType(CreateReportDto, [
  'report_period_id',
] as const) {}
/*
{
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
    "total_accidents": 1,
    "total_fatal_accidents": 1,
    "total_accidents_with_two_or_more_victims": 1,
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
    "total_accidents": 1,
    "total_fatal_accidents": 0,
    "total_accidents_with_two_or_more_victims": 0,
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
    "total_accidents": 1,
    "total_fatal_accidents": 1,
    "total_accidents_with_two_or_more_victims": 1,
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
    "total_accidents": 1,
    "total_fatal_accidents": 0,
    "total_accidents_with_two_or_more_victims": 0,
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
