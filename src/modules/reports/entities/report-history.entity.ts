import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Report } from './report.entity';

@Entity('report_histories')
export class ReportHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'report_id' })
  reportId: number;

  // Loại hành động: 'SUBMITTED', 'APPROVED', 'REJECTED'
  @Column()
  action: string;

  // Tên người thực hiện để in ra UI (VD: 'Công ty TNHH VNA' hoặc 'Nguyễn Văn A')
  @Column({ name: 'actor_name' })
  actorName: string;

  // Ghi chú/Lý do từ chối (nếu có)
  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // Thời gian thao tác

  @ManyToOne(() => Report)
  @JoinColumn({ name: 'report_id' })
  report: Report;
}
