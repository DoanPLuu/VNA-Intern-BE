import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReportAccidentDetail } from './report-accident-detail.entity';
import { Report } from './report.entity';

export enum ReportCategory {
  GENERAL = 'GENERAL', // TNLĐ chung (Image 1)
  SUBSIDIZED = 'SUBSIDIZED', // TNLĐ được hưởng trợ cấp theo Khoản 2 Điều 39 (Image 3)
}

@Entity('report_statistics')
export class ReportStatistic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'report_id' })
  reportId: number;

  @Column({ name: 'report_category', type: 'varchar' })
  reportCategory: ReportCategory;

  // ----- Tổng số vụ & số nạn nhân -----
  @Column({ name: 'total_incidents', type: 'int', default: 0 })
  totalIncidents: number; // Quyết định số lượng ReportAccidentDetail tương ứng

  @Column({ name: 'incidents_with_fatalities', type: 'int', default: 0 })
  incidentsWithFatalities: number;

  @Column({ name: 'incidents_with_multiple_victims', type: 'int', default: 0 })
  incidentsWithMultipleVictims: number;

  @Column({ name: 'total_victims', type: 'int', default: 0 })
  totalVictims: number;

  @Column({ name: 'total_female_victims', type: 'int', default: 0 })
  totalFemaleVictims: number;

  @Column({ name: 'total_fatalities', type: 'int', default: 0 })
  totalFatalities: number;

  @Column({ name: 'total_severe_injuries', type: 'int', default: 0 })
  totalSevereInjuries: number;

  @Column({ name: 'unmanaged_victims', type: 'int', default: 0 })
  unmanagedVictims: number;

  @Column({ name: 'unmanaged_female_victims', type: 'int', default: 0 })
  unmanagedFemaleVictims: number;

  @Column({ name: 'unmanaged_fatalities', type: 'int', default: 0 })
  unmanagedFatalities: number;

  @Column({ name: 'unmanaged_severe_injuries', type: 'int', default: 0 })
  unmanagedSevereInjuries: number;

  // ----- Thiệt hại -----
  @Column({
    name: 'medical_costs',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  medicalCosts: number;

  @Column({
    name: 'treatment_salary_costs',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  treatmentSalaryCosts: number;

  @Column({
    name: 'compensation_costs',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  compensationCosts: number;

  @Column({
    name: 'total_costs',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  totalCosts: number;

  @Column({ name: 'total_days_off', type: 'int', default: 0 })
  totalDaysOff: number;

  @Column({
    name: 'property_damage',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  propertyDamage: number;

  // ------------- Relations ------------
  @ManyToOne(() => Report, (report) => report.statistics)
  @JoinColumn({ name: 'report_id' })
  report: Report;

  @OneToMany(() => ReportAccidentDetail, (detail) => detail.reportStatistic)
  accidentDetails: ReportAccidentDetail[];
}
