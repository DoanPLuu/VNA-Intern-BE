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

export enum SoVaiTro {
  QUAN_TRI = 'QUAN_TRI',
  NGUOI_DUNG = 'NGUOI_DUNG',
  LANH_DAO = 'LANH_DAO',
}

@Entity('so_profiles')
export class SoProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', unique: true })
  accountId: number;

  @Column({ name: 'full_name', length: 200, nullable: true })
  fullName: string;

  @Column({ unique: true, nullable: true, length: 200 })
  email: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ length: 10, nullable: true })
  gender: string;

  @Column({ length: 100, nullable: true })
  title: string;

  @Column({
    name: 'vai_tro',
    type: 'enum',
    enum: SoVaiTro,
    default: SoVaiTro.NGUOI_DUNG,
  })
  vaiTro: SoVaiTro;

  // Mô hình 2 cấp: chỉ có province + ward (không có district)
  @Column({ name: 'province_id', type: 'int', nullable: true })
  provinceId: number | null;

  @Column({ name: 'ward_id', type: 'int', nullable: true })
  wardId: number | null;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Account, (account) => account.soProfile)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Province, { nullable: true })
  @JoinColumn({ name: 'province_id' })
  province: Province | null;

  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'ward_id' })
  ward: Ward | null;
}
