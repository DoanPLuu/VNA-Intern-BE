import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum OtpType {
  CHANGE_EMAIL = 'CHANGE_EMAIL',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
}

@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 6 })
  code: string;

  @Column({ type: 'varchar' })
  type: OtpType;

  @Column({ name: 'is_used', default: false })
  isUsed: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // @ManyToOne(() => User, (user) => user.otpCodes, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'user_id' })
  // user: User;
}
