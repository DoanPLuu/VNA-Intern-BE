import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
// Nghề nghiệp của công nhân
@Entity('professions')
export class Profession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  level: string;

  @Column({ name: 'parent_id', type: 'int', nullable: true })
  parentId: number | null;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ManyToOne(() => Profession, (profession) => profession.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Profession;

  @OneToMany(() => Profession, (profession) => profession.parent)
  children: Profession[];
}
