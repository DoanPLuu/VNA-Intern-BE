import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('email_change_requests')
export class EmailChangeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'new_email' })
  newEmail: string;

  @Column({ name: 'otp_id', nullable: true })
  otpId: string;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // @ManyToOne(() => User, (user) => user.emailChangeRequests, {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'user_id' })
  // user: User;
}
