import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
// Nghề nghiệp của công nhân
@Entity('professions')
export class Profession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'boolean', default: true })
  status: boolean;
}
