import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
// import { OtpCode } from './otp-code.entity';
// import { EmailChangeRequest } from './email-change-request.entity';
import { Account } from 'src/modules/auth/entities/account.entity';
// import { District } from 'src/modules/location/entities/district.entity';
// import { Province } from 'src/modules/location/entities/provinces.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 200, nullable: true })
  fullName: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ length: 10, nullable: true })
  gender: string;

  // Chức danh hoặc nghề nghiệp
  @Column({ length: 100, nullable: true })
  title: string;

  // ProvinceId la so tinh thanh, vd: 79 la TP_HCM
  @Column({ name: 'province_id', type: 'int', nullable: true })
  provinceId?: number | null;

  // DistrictId la so quan huyen, vd: 77 la Quan_1
  @Column({ name: 'district_id', type: 'int', nullable: true })
  districtId?: number | null;

  // Address la dia chi, vd: 123 Nguyen Trai
  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => Account, (account) => account.user)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  // @ManyToOne(() => Province)
  // @JoinColumn({ name: 'province_id' })
  // province: Province;

  // @ManyToOne(() => District)
  // @JoinColumn({ name: 'district_id' })
  // district: District;

  // @OneToMany(() => OtpCode, (otp) => otp.user)
  // otpCodes: OtpCode[];

  // @OneToMany(() => EmailChangeRequest, (r) => r.user)
  // emailChangeRequests: EmailChangeRequest[];
}
