import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ReportPeriodStatus {
  OPEN = 'OPEN', // Đang mở
  CLOSED = 'CLOSED', // Đã đóng/hết hạn
}

@Entity('report_periods')
export class ReportPeriod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string; // VD: "Báo cáo TNLĐ 6 tháng đầu năm 2022"

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int', nullable: true })
  quarter: number | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({
    type: 'varchar',
    default: ReportPeriodStatus.OPEN,
  })
  status: ReportPeriodStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
