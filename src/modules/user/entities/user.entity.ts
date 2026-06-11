import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from 'src/modules/auth/entities/account.entity';
import { Province } from 'src/modules/location/entities/province.entity';
import { Ward } from 'src/modules/location/entities/ward.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'account_id', unique: true })
  accountId: number;

  @Column({ name: 'full_name', type: 'varchar', length: 200, nullable: true })
  fullName: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string | null;

  /**
   * Chức vụ — bắt buộc với nhân viên Sở nhưng nullable ở DB
   * để tạo profile rỗng ngay khi tạo Account.
   */
  @Column({ type: 'varchar', length: 200, nullable: true })
  position: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'province_id', type: 'int', nullable: true })
  provinceId: number | null;

  @Column({ name: 'ward_id', type: 'int', nullable: true })
  wardId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ── Relations ──────────────────────────────────────────────
  @OneToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Province, { nullable: true })
  @JoinColumn({ name: 'province_id' })
  province: Province | null;

  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'ward_id' })
  ward: Ward | null;
}
