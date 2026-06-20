import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum AccidentCauseGroup {
  EMPLOYER = 'EMPLOYER', // Do người sử dụng lao động
  EMPLOYEE = 'EMPLOYEE', // Do người lao động
  OTHER = 'OTHER', // Khách quan
}

@Entity('accident_causes')
export class AccidentCause {
  @PrimaryGeneratedColumn()
  id: number;

  // Mã số hiển thị trong báo cáo tổng hợp (1-9, Image 5-6)
  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  // Nhóm nguyên nhân để hiển thị header trong báo cáo tổng hợp
  @Column({ name: 'cause_group', type: 'varchar', nullable: true })
  causeGroup: AccidentCauseGroup | null;

  @Column({ type: 'boolean', default: true })
  status: boolean;
}
