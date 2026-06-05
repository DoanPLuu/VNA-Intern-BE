import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Ward } from './ward.entity';

@Entity('provinces')
export class Province {
  @PrimaryGeneratedColumn()
  id: number;

  // Mã tỉnh theo BNV (01, 02, ..., 34)
  @Column({ length: 10, unique: true })
  code: string;

  @Column({ length: 100 })
  name: string;

  @OneToMany(() => Ward, (ward) => ward.province)
  wards: Ward[];
}
