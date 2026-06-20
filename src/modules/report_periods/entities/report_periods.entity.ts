import { Report } from 'src/modules/reports/entities/report.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ReportPeriodStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}
@Entity('report_periods')
export class ReportPeriod {
  @PrimaryGeneratedColumn({ comment: 'Khóa chính' })
  id: number;

  @Column({
    type: 'varchar',
    nullable: false,
    comment: 'Tên kỳ báo cáo (VD: Báo cáo TNLĐ 6 tháng đầu năm 2022)',
  })
  name: string;

  @Column({
    type: 'int',
    nullable: false,
    comment: 'Năm báo cáo',
  })
  year: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Quý báo cáo (nếu có)',
  })
  quarter: number | null;

  @Column({
    name: 'start_date',
    type: 'date',
    nullable: true,
    comment: 'Ngày bắt đầu kỳ báo cáo',
  })
  startDate: Date | null;

  @Column({
    name: 'end_date',
    type: 'date',
    nullable: true,
    comment: 'Ngày kết thúc kỳ báo cáo',
  })
  endDate: Date | null;

  @Column({
    name: 'due_date',
    type: 'date',
    nullable: true,
    comment: 'Hạn chót nộp báo cáo',
  })
  dueDate: Date | null;

  @Column({
    type: 'varchar',
    default: ReportPeriodStatus.OPEN,
    comment: 'Trạng thái kỳ báo cáo (OPEN: Đang mở, CLOSED: Đã đóng/hết hạn)',
  })
  status: ReportPeriodStatus;

  @CreateDateColumn({
    name: 'created_at',
    comment: 'Thời gian tạo kỳ báo cáo',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    comment: 'Thời gian cập nhật kỳ báo cáo',
  })
  updatedAt: Date;

  //   Thiết lập mối quan hệ: Một kỳ báo cáo có nhiều báo cáo
  @OneToMany(() => Report, (report) => report.reportPeriod)
  reports: Report[];
}
