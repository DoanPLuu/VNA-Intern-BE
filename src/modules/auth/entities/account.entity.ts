import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn({ name: 'account_id' })
  id: number;

  @Column({ name: 'username', unique: true })
  username: string;

  @Column({ name: 'password' })
  password: string;

  @Column({ name: 'role', default: 'DN' }) // Có 2 loại role SO (Sở) và DN (Doanh nghiệp)
  role: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToOne(() => User, (user) => user.account)
  user: User;
}
