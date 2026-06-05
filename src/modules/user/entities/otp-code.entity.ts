import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from 'src/modules/auth/entities/account.entity';

export enum OtpType {
  FORGOT_PASSWORD = 'FORGOT_PASSWORD', // Quên mật khẩu
  CHANGE_EMAIL = 'CHANGE_EMAIL', // Đổi email (role Sở)
  REGISTER_DN = 'REGISTER_DN', // Đăng ký doanh nghiệp
}

@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // account_id nullable vì REGISTER_DN chưa có account
  @Column({ name: 'account_id', type: 'int', nullable: true })
  accountId: number | null;

  // Email nhận OTP (dùng khi chưa có account - đăng ký DN)
  @Column({ name: 'email', type: 'varchar', length: 200, nullable: true })
  email: string | null;

  @Column({ name: 'otp_code', type: 'varchar', length: 6 })
  code: string;

  @Column({ type: 'enum', enum: OtpType })
  type: OtpType;

  @Column({ name: 'is_used', default: false })
  isUsed: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;
}
