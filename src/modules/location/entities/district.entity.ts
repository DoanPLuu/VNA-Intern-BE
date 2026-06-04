import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Province } from './provinces.entity';

@Entity('districts')
export class District {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  districtName: string;

  @ManyToOne(() => Province, (province) => province.districts)
  @JoinColumn({ name: 'province_id' })
  province: Province;
}
