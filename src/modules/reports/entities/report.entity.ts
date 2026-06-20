import { Company } from 'src/modules/company/entities/company.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
// import { ReportPeriod } from './report-period.entity';
import { Account } from 'src/modules/auth/entities/account.entity';
import { ReportStatistic } from './report-statistic.entity';
import { ReportPeriod } from 'src/modules/report_periods/entities/report_periods.entity';

export enum ReportType {
  TAI_NAN_LAO_DONG = 'TAI_NAN_LAO_DONG',
}

export enum ReportStatus {
  DRAFT = 'DRAFT', // Nháp
  SUBMITTED = 'SUBMITTED', // Đã nộp
  APPROVED = 'APPROVED', // Đã duyệt
  REJECTED = 'REJECTED', // Bị từ chối
}

@Entity('reports')
@Unique(['companyId', 'reportPeriodId'])
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'company_id' })
  companyId: number;

  @Column({ name: 'report_period_id' })
  reportPeriodId: number;

  @Column({
    name: 'report_type',
    type: 'varchar',
    default: ReportType.TAI_NAN_LAO_DONG,
  })
  reportType: ReportType;

  // Nội dung chi tiết báo cáo dạng văn bản hoặc JSON bổ sung
  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'varchar', default: ReportStatus.DRAFT })
  status: ReportStatus;

  // ----- Snapshot thông tin doanh nghiệp tại thời điểm làm báo cáo -----
  @Column({ name: 'total_employees', type: 'int', nullable: true })
  totalEmployees: number | null;

  @Column({ name: 'total_female_employees', type: 'int', nullable: true })
  totalFemaleEmployees: number | null;

  @Column({
    name: 'total_salary_fund',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  totalSalaryFund: number | null;

  // ----- Quy trình nộp/duyệt -----
  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'approved_by', type: 'int', nullable: true })
  approvedBy: number | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  // Ghi chú thêm (VD: lý do từ chối)
  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // -------- relations --------------
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => ReportPeriod)
  @JoinColumn({ name: 'report_period_id' })
  reportPeriod: ReportPeriod;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'approved_by' })
  approver: Account;

  @OneToMany(() => ReportStatistic, (statistic) => statistic.report)
  statistics: ReportStatistic[];
}
