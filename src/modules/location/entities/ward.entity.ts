import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Province } from './province.entity';

@Entity('wards')
export class Ward {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'province_id' })
  provinceId: number;

  @ManyToOne(() => Province, (province) => province.wards)
  @JoinColumn({ name: 'province_id' })
  province: Province;
}
