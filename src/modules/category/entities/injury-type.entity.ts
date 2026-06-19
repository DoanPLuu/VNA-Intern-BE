import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('injury_type')
export class InjuryType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  level: string;

  @Column({ type: 'boolean', default: true })
  status: boolean;
}
