import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ unique: true, nullable: true, type: 'varchar' })
  email?: string | null;

  @Column({
    name: 'account_type',
    type: 'enum',
    enum: AccountType,
    default: AccountType.SO,
  })
  accountType: AccountType;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
