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
import { Province } from 'src/modules/location/entities/province.entity';
import { Ward } from 'src/modules/location/entities/ward.entity';
import { Role } from 'src/modules/role/entities/role.entity';

export enum AccountType {
  SO = 'SO',
  DOANH_NGHIEP = 'DN',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  // Phân biệt giao diện Sở vs Doanh nghiệp
  @Column({
    name: 'account_type',
    type: 'enum',
    enum: AccountType,
    default: AccountType.SO,
  })
  accountType: AccountType;

  // Thông tin cá nhân (theo SQL mới - gộp vào accounts)
  @Column({ name: 'full_name', nullable: true })
  fullName: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  position: string; // chức danh

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'province_id', type: 'int', nullable: true })
  provinceId: number | null;

  @Column({ name: 'ward_id', type: 'int', nullable: true })
  wardId: number | null;

  // role_id chỉ có giá trị khi accountType = SO, NULL khi DN
  @Column({ name: 'role_id', type: 'int', nullable: true })
  roleId: number | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ── Relations ──────────────────────────────────────────
  @ManyToOne(() => Role, { nullable: true, eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Province, { nullable: true })
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'ward_id' })
  ward: Ward;
}
