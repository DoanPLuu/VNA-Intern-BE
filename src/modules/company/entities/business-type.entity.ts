import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('business_types')
export class BusinessType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ default: 'ACTIVE' })
  status: string;
}
