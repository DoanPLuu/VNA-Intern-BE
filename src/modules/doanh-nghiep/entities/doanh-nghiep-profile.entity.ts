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

@Entity('doanh_nghiep_profiles')
export class DoanhNghiepProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', unique: true })
  accountId: number;

  // ── Thông tin doanh nghiệp ──────────────────────────────
  @Column({ name: 'ten_doanh_nghiep', length: 300 })
  tenDoanhNghiep: string;

  @Column({ name: 'ten_nuoc_ngoai', length: 300, nullable: true })
  tenNuocNgoai: string;

  // Mã số thuế = username khi đăng ký
  @Column({ name: 'ma_so_thue', unique: true, length: 20 })
  maSoThue: string;

  @Column({ name: 'loai_hinh_kinh_doanh', length: 200, nullable: true })
  loaiHinhKinhDoanh: string;

  @Column({ name: 'nganh_nghe_kinh_doanh', length: 300, nullable: true })
  nganhNgheKinhDoanh: string;

  @Column({ name: 'ngay_cap_gpkd', type: 'date', nullable: true })
  ngayCapGpkd: Date;

  // ── Địa chỉ ĐKKD (mô hình 2 cấp) ───────────────────────
  @Column({ name: 'province_dkkd_id', type: 'int', nullable: true })
  provinceDkkdId: number | null;

  @Column({ name: 'ward_dkkd_id', type: 'int', nullable: true })
  wardDkkdId: number | null;

  @Column({ name: 'dia_chi_dkkd', type: 'text', nullable: true })
  diaChiDkkd: string;

  // ── Thông tin liên hệ ───────────────────────────────────
  @Column({ unique: true, length: 200 })
  email: string;

  @Column({ name: 'so_dien_thoai', length: 20, nullable: true })
  soDienThoai: string;

  @Column({ name: 'nguoi_dung_dau', length: 200, nullable: true })
  nguoiDungDau: string;

  @Column({ name: 'sdt_nguoi_dung_dau', length: 20, nullable: true })
  sdtNguoiDungDau: string;

  // ── Địa chỉ hoạt động KD (mô hình 2 cấp) ───────────────
  @Column({ name: 'province_hdkd_id', type: 'int', nullable: true })
  provinceHdkdId: number | null;

  @Column({ name: 'ward_hdkd_id', type: 'int', nullable: true })
  wardHdkdId: number | null;

  @Column({ name: 'dia_diem_kinh_doanh', type: 'text', nullable: true })
  diaDiemKinhDoanh: string;

  // ── File đính kèm ───────────────────────────────────────
  @Column({ name: 'gpkd_file_path', type: 'varchar', nullable: true })
  gpkdFilePath: string | null;

  @Column({ name: 'gtk_file_path', type: 'varchar', nullable: true })
  gtkFilePath: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ── Relations ──────────────────────────────────────────────
  @OneToOne(() => Account, (account) => account.doanhNghiepProfile)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Province, { nullable: true })
  @JoinColumn({ name: 'province_dkkd_id' })
  provinceDkkd: Province;

  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'ward_dkkd_id' })
  wardDkkd: Ward;

  @ManyToOne(() => Province, { nullable: true })
  @JoinColumn({ name: 'province_hdkd_id' })
  provinceHdkd: Province;

  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'ward_hdkd_id' })
  wardHdkd: Ward;
}
