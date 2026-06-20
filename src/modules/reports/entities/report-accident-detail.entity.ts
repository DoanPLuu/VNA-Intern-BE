import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReportStatistic } from './report-statistic.entity';
import { InjuryFactor } from '../../category/entities/injury-factor.entity';
import { Profession } from '../../category/entities/profession.entity';
import { AccidentCause } from 'src/modules/category/entities/account-cause.entity';

@Entity('report_accident_details')
export class ReportAccidentDetail {
  @PrimaryGeneratedColumn()
  id: number;

  // Thuộc về mục thống kê nào (TNLĐ chung / TNLĐ được hưởng trợ cấp)
  @Column({ name: 'report_statistic_id' })
  reportStatisticId: number;

  // ----- Phân loại theo danh mục cố định -----
  @Column({ name: 'accident_cause_id', nullable: true })
  accidentCauseId: number | null;

  @Column({ name: 'injury_factor_id', nullable: true })
  injuryFactorId: number | null;

  @Column({ name: 'profession_id', nullable: true })
  professionId: number | null;

  // ----- Số liệu trong nhóm này -----
  @Column({ name: 'total_incidents', type: 'int', default: 0 })
  totalIncidents: number;

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

  // ----- Thiệt hại trong nhóm này -----
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  // ---------- Relations -----------
  @ManyToOne(() => ReportStatistic, (statistic) => statistic.accidentDetails)
  @JoinColumn({ name: 'report_statistic_id' })
  reportStatistic: ReportStatistic;

  @ManyToOne(() => AccidentCause)
  @JoinColumn({ name: 'accident_cause_id' })
  accidentCause: AccidentCause;

  @ManyToOne(() => InjuryFactor)
  @JoinColumn({ name: 'injury_factor_id' })
  injuryFactor: InjuryFactor;

  @ManyToOne(() => Profession)
  @JoinColumn({ name: 'profession_id' })
  profession: Profession;
}
