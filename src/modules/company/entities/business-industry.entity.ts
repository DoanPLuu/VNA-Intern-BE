import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('business_industries')
export class BusinessIndustry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ name: 'parent_id', type: 'int', nullable: true })
  parentId: number | null;

  @Column({ default: 'ACTIVE' })
  status: string;

  @ManyToOne(() => BusinessIndustry, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: BusinessIndustry;
}
