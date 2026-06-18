import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('accident_causes')
export class AccidentCause {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'boolean', default: true })
  status: boolean;
}
