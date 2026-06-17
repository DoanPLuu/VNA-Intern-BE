import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from 'src/modules/auth/entities/account.entity';
import { Province } from 'src/modules/location/entities/province.entity';
import { Ward } from 'src/modules/location/entities/ward.entity';
import { BusinessIndustry } from './business-industry.entity';
import { BusinessType } from './business-type.entity';

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  DELETED = 'DELETED',
}

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'account_id', unique: true })
  accountId: number;

  // ── Thông tin doanh nghiệp ──────────────────────────────
  @Column({ name: 'company_name', length: 300 })
  companyName: string;

  @Column({
    name: 'foreign_company_name',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  foreignCompanyName: string | null;

  // Mã số thuế = username khi đăng ký
  @Column({ name: 'tax_code', unique: true, length: 20 })
  taxCode: string;

  @Column({ name: 'business_type_id', type: 'int' })
  businessTypeId: number;

  @Column({ name: 'business_industry_id', type: 'int' })
  businessIndustryId: number;

  @Column({ name: 'license_issue_date', type: 'date', nullable: true })
  licenseIssueDate: Date | null;

  // ── Địa chỉ ĐKKD (mô hình 2 cấp) ───────────────────────
  @Column({ name: 'province_dkkd_id', type: 'int' })
  provinceDkkdId: number;

  @Column({ name: 'ward_dkkd_id', type: 'int' })
  wardDkkdId: number;

  @Column({ name: 'dia_chi_dkkd', type: 'text', nullable: true })
  addressDkkd: string | null;

  // ── Thông tin liên hệ ───────────────────────────────────
  @Column({
    name: 'business_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  businessPhone: string | null;

  @Column({
    name: 'representative_name',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  representativeName: string | null;

  @Column({
    name: 'representative_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  representativePhone: string | null;

  // ── Địa chỉ hoạt động KD (mô hình 2 cấp) ───────────────
  @Column({ name: 'province_hdkd_id', type: 'int', nullable: true })
  provinceHdkdId: number | null;

  @Column({ name: 'ward_hdkd_id', type: 'int', nullable: true })
  wardHdkdId: number | null;

  @Column({ name: 'address_hdkd', type: 'text', nullable: true })
  addressHdkd: string | null;

  // ── File đính kèm ───────────────────────────────────────
  @Column({ name: 'gpkd_file_path', type: 'varchar', nullable: true })
  gpkdFilePath: string | null;

  @Column({ name: 'gtk_file_path', type: 'varchar', nullable: true })
  gtkFilePath: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.ACTIVE,
  })
  status: CompanyStatus;

  // ── Relations ──────────────────────────────────────────────
  @OneToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => BusinessType, { eager: true })
  @JoinColumn({ name: 'business_type_id' })
  businessType: BusinessType;

  @ManyToOne(() => BusinessIndustry, { eager: true })
  @JoinColumn({ name: 'business_industry_id' })
  businessIndustry: BusinessIndustry;

  @ManyToOne(() => Province)
  @JoinColumn({ name: 'province_dkkd_id' })
  provinceDkkd: Province;

  @ManyToOne(() => Ward)
  @JoinColumn({ name: 'ward_dkkd_id' })
  wardDkkd: Ward;

  @ManyToOne(() => Province, { nullable: true })
  @JoinColumn({ name: 'province_hdkd_id' })
  provinceHdkd: Province | null;

  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'ward_hdkd_id' })
  wardHdkd: Ward | null;
}
