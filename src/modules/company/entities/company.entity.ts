import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Province } from 'src/modules/location/entities/province.entity';
import { Ward } from 'src/modules/location/entities/ward.entity';
import { BusinessType } from './business-type.entity';
import { BusinessIndustry } from './business-industry.entity';

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  // Mã số thuế = username của account DN
  @Column({ name: 'tax_code', unique: true, nullable: true })
  taxCode: string;

  @Column()
  name: string;

  @Column({ name: 'business_type_id', type: 'int', nullable: true })
  businessTypeId: number | null;

  @Column({ name: 'business_industry_id', type: 'int', nullable: true })
  businessIndustryId: number | null;

  @Column({ name: 'representative_name', nullable: true })
  representativeName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'province_id', type: 'int', nullable: true })
  provinceId: number | null;

  @Column({ name: 'ward_id', type: 'int', nullable: true })
  wardId: number | null;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.PENDING,
  })
  status: CompanyStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => BusinessType, { nullable: true, eager: true })
  @JoinColumn({ name: 'business_type_id' })
  businessType: BusinessType;

  @ManyToOne(() => BusinessIndustry, { nullable: true, eager: true })
  @JoinColumn({ name: 'business_industry_id' })
  businessIndustry: BusinessIndustry;

  @ManyToOne(() => Province, { nullable: true })
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'ward_id' })
  ward: Ward;
}
