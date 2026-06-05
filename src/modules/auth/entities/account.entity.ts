import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SoProfile } from 'src/modules/so/entities/so-profile.entity';
import { DoanhNghiepProfile } from 'src/modules/doanh-nghiep/entities/doanh-nghiep-profile.entity';

export enum AccountRole {
  SO = 'SO',
  DOANH_NGHIEP = 'DN',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn({ name: 'account_id' })
  id: number;

  @Column({ name: 'username', unique: true, length: 100 })
  username: string;

  @Column({ name: 'password' })
  password: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: AccountRole,
    default: AccountRole.DOANH_NGHIEP,
  })
  role: AccountRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // eager: true → tự động load profile khi query account, không cần khai báo relations
  @OneToOne(() => SoProfile, (profile) => profile.account, { eager: true })
  soProfile: SoProfile;

  @OneToOne(() => DoanhNghiepProfile, (profile) => profile.account, {
    eager: true,
  })
  doanhNghiepProfile: DoanhNghiepProfile;
}
