import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('injury_type')
export class InjuryType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', default: 'Cấp 2' })
  level: string;

  @Column({ name: 'parent_id', type: 'int', nullable: true })
  parentId: number | null;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ManyToOne(() => InjuryType, (injuryType) => injuryType.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: InjuryType;

  @OneToMany(() => InjuryType, (injuryType) => injuryType.parent)
  children: InjuryType[];
}
