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

  // Mã phường/xã mới 2025 (10105001, ...)
  @Column({ unique: true })
  code: number;

  @Column({ length: 100 })
  name: string;

  // Mô hình 2 cấp: ward thuộc thẳng province
  @Column({ name: 'province_id' })
  provinceId: number;

  @ManyToOne(() => Province, (province) => province.wards)
  @JoinColumn({ name: 'province_id' })
  province: Province;
}
