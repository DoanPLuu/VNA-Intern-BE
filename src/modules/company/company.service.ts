import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Response as ApiResponse } from 'src/common';
import { LocationService } from '../location/location.service';
import { Province } from '../location/entities/province.entity';
import { Ward } from '../location/entities/ward.entity';
import { Account, AccountType } from '../auth/entities/account.entity';
import { Company, CompanyStatus } from './entities/company.entity';
import { BusinessIndustry } from './entities/business-industry.entity';
import { BusinessType } from './entities/business-type.entity';
import { CreateCompany } from './dto/company.dto';
import { OtpCode, OtpType } from '../user/entities/otp-code.entity';
import { MailService } from 'src/common/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { UpdateCompany } from './dto/update-company.dto';
import { InitializeCompanyPassword } from './dto/initialize-company-password.dto';
import * as XLSX from 'xlsx';
import { DateUtil } from 'src/common/utils/date.util';

interface JwtPayload {
  sub: number;
  username: string;
  accountType: AccountType;
}
function parseDate(value: string | number | undefined): Date | null {
  if (!value) return null;

  // Excel serial number (kiểu số)
  if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? null : date;
  }

  // String format: dd-MM-yyyy
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const date = new Date(`${year}-${month}-${day}`);
  return isNaN(date.getTime()) ? null : date;
}
// Thêm interface này trên đầu service hoặc file riêng
interface ExcelRow {
  'Tên doanh nghiệp'?: string;
  'Mã số thuế'?: string | number;
  'Loại hình kinh doanh'?: string;
  'Ngành nghề kinh doanh'?: string;
  'Tỉnh/TP ĐKKD'?: string;
  'Phường/Xã ĐKKD'?: string;
  Email?: string;
  'Ngày cấp GPKD'?: string | number;
  'Địa chỉ ĐKKD'?: string;
  'Tên nước ngoài'?: string;
  'SĐT doanh nghiệp'?: string;
  'Người đại diện'?: string;
  'SĐT đại diện'?: string;
  'Tỉnh/TP HĐKD'?: string;
  'Phường/Xã HĐKD'?: string;
  'Địa chỉ HĐKD'?: string;
}

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(BusinessIndustry)
    private readonly businessIndustryRepo: Repository<BusinessIndustry>,
    @InjectRepository(BusinessType)
    private readonly businessTypeRepo: Repository<BusinessType>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(OtpCode)
    private readonly otpCodeRepo: Repository<OtpCode>,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    private readonly locationService: LocationService,
  ) {}

  // ── Lookup ───────────────────────────────────────────────────

  getAllCompanies() {
    return this.companyRepo.find({
      where: {
        status: In([
          CompanyStatus.ACTIVE,
          CompanyStatus.PENDING,
          CompanyStatus.INACTIVE,
        ]),
      },
    });
  }

  getAllBusinessType() {
    return this.businessTypeRepo.find({ where: { status: 'ACTIVE' } });
  }

  getAllBusinessIndustry() {
    return this.businessIndustryRepo.find({ where: { status: 'ACTIVE' } });
  }

  async getCompanyProfile(taxCode: string) {
    const company = await this.companyRepo.findOne({
      where: { taxCode },
      relations: {
        businessType: true,
        businessIndustry: true,
        provinceDkkd: true,
        wardDkkd: true,
        provinceHdkd: true,
        wardHdkd: true,
        account: true,
      },
    });
    if (!company) {
      throw ApiResponse.errorNotFound(
        `Không tìm thấy doanh nghiệp có mã số thuế: ${taxCode}`,
      );
    }

    return ApiResponse.success(
      {
        taxCode: company.taxCode,
        companyName: company.companyName,
        foreignCompanyName: company.foreignCompanyName,
        licenseIssueDate: DateUtil.formatBirthday(company.licenseIssueDate),
        businessType: company.businessType?.name ?? null,
        businessIndustry: company.businessIndustry?.name ?? null,
        email: company.account?.email ?? null,
        status: company.status,
        provinceDKKD: company.provinceDkkd?.name ?? null,
        wardDKKD: company.wardDkkd?.name ?? null,
        addressDKKD: company.addressDkkd,
        provinceHDKD: company.provinceHdkd?.name ?? null,
        wardHDKD: company.wardHdkd?.name ?? null,
        addressHDKD: company.addressHdkd,
        representativeName: company.representativeName,
        representativePhone: company.representativePhone,
        businessPhone: company.businessPhone,
        gpkdFile: company.gpkdFilePath,
        gtkFile: company.gtkFilePath,
      },
      'OK',
    );
  }
  async reinitializeCompanyPassword(
    accountType: AccountType,
    dto: InitializeCompanyPassword,
  ) {
    if (accountType !== AccountType.SO)
      throw ApiResponse.errorForbidden(
        'Tài khoản hiện tại không thể thực hiện chức năng này',
      );
    const account = await this.accountRepo.findOne({
      where: { username: dto.tax_code },
    });
    if (!account)
      throw ApiResponse.errorNotFound(
        `Không tìm thấy doanh nghiệp có mã số thuế ${dto.tax_code}`,
      );
    account.password = await bcrypt.hash(dto.password, 10);
    await this.accountRepo.save(account);
    return ApiResponse.success(null, 'Khởi tạo mật khẩu thành công');
  }

  async banCompany(tax_code: string) {
    const company = await this.companyRepo.findOne({
      where: { taxCode: tax_code },
      relations: { account: true },
    });
    if (!company)
      throw ApiResponse.errorNotFound(
        `Không tìm thấy doanh nghiệp có mã số thuế: ${tax_code}`,
      );
    if (company.status === CompanyStatus.INACTIVE)
      throw ApiResponse.errorBad(
        `Doanh nghiệp ${tax_code} đã bị khóa trước đó`,
      );

    company.status = CompanyStatus.INACTIVE;
    company.account.isActive = false;
    await this.companyRepo.save(company);
    await this.accountRepo.save(company.account);
    return ApiResponse.success(
      null,
      `Khóa tài khoản có mã số thuế ${tax_code} thành công`,
    );
  }

  async unbanCompany(tax_code: string) {
    const company = await this.companyRepo.findOne({
      where: { taxCode: tax_code },
      relations: { account: true },
    });
    if (!company)
      throw ApiResponse.errorNotFound(
        `Không tìm thấy doanh nghiệp có mã số thuế: ${tax_code}`,
      );

    if (company.status === CompanyStatus.ACTIVE) {
      throw ApiResponse.errorBad(
        `Doanh nghiệp ${tax_code} đang hoạt động, không cần mở khóa`,
      );
    }
    company.status = CompanyStatus.ACTIVE;
    company.account.isActive = true;
    await this.companyRepo.save(company);
    await this.accountRepo.save(company.account);
    return ApiResponse.success(
      null,
      `Mở khóa tài khoản có mã số thuế ${tax_code} thành công`,
    );
  }

  async deleteCompany(accountType: AccountType, tax_code: string) {
    if (accountType !== AccountType.SO)
      throw ApiResponse.errorForbidden(
        'Tài khoản hiện tại không thể thực hiện chức năng này',
      );
    const company = await this.companyRepo.findOne({
      where: { taxCode: tax_code },
      relations: { account: true },
    });
    if (!company)
      throw ApiResponse.errorNotFound(
        `Không tìm thấy doanh nghiệp có mã số thuế: ${tax_code}`,
      );
    const account = company.account;
    if (company.account.isDeleted)
      throw ApiResponse.errorBad(`Doanh nghiệp ${tax_code} đã bị xóa`);
    account.isDeleted = true;
    await this.accountRepo.save(account);
    company.status = CompanyStatus.INACTIVE;
    await this.companyRepo.save(company);
    return ApiResponse.success(null, 'Xóa Doanh nghiệp thành công');
  }

  async restoreCompany(tax_code: string) {
    const company = await this.companyRepo.findOne({
      where: { taxCode: tax_code },
      relations: { account: true },
    });
    if (!company)
      throw ApiResponse.errorNotFound(
        `Không tìm thấy doanh nghiệp có mã số thuế: ${tax_code}`,
      );

    if (!company.account.isDeleted)
      throw ApiResponse.errorBad(`Doanh nghiệp ${tax_code} chưa bị xóa`);

    company.account.isDeleted = false;
    company.account.isActive = true;
    company.status = CompanyStatus.ACTIVE;

    await this.accountRepo.save(company.account);
    await this.companyRepo.save(company);

    return ApiResponse.success(
      null,
      `Khôi phục doanh nghiệp ${tax_code} thành công`,
    );
  }

  // ── Preview (validate + trả về data đã resolve, chưa lưu) ────
  async previewCompany(dto: CreateCompany) {
    await this.checkDuplicates(dto);

    // Resolve lookup data
    const resolved = await this.resolveLookups(dto);

    const {
      businessType,
      businessIndustry,
      provinceDKKD,
      wardDKKD,
      provinceHDKD,
      wardHDKD,
    } = resolved;

    return ApiResponse.success(
      {
        taxCode: dto.tax_code,
        companyName: dto.business_name,
        foreignCompanyName: dto.foreign_business_name,
        licenseIssueDate: DateUtil.formatBirthday(dto.license_issue_date),
        businessType: businessType.name,
        businessIndustry: businessIndustry.name,
        email: dto.email,
        provinceDKKD: provinceDKKD.name,
        wardDKKD: wardDKKD.name,
        addressDKKD: dto.license_registration_adress,
        provinceHDKD: provinceHDKD?.name ?? null,
        wardHDKD: wardHDKD?.name ?? null,
        addressHDKD: dto.business_operating_adress,
        representativeName: dto.representative_name,
        representativePhone: dto.representative_phone,
        businessPhone: dto.business_phone,
        gpkdFile: dto.business_license_file_url,
        gtkFile: dto.other_document_file_url,
      },
      'OK',
    );
  }

  // ── Create ───────────────────────────────────────────────────
  async createCompany(dto: CreateCompany) {
    await this.checkDuplicates(dto);

    // Resolve lookup data
    const resolved = await this.resolveLookups(dto);

    const {
      businessType,
      businessIndustry,
      provinceDKKD,
      wardDKKD,
      provinceHDKD,
      wardHDKD,
    } = resolved;

    // Tạo Account
    const rawPassword = '12345678';
    const account = this.accountRepo.create({
      username: dto.tax_code,
      password: await bcrypt.hash(rawPassword, 10),
      email: dto.email,
      accountType: AccountType.DOANH_NGHIEP,
      isActive: true,
      isDeleted: false,
    });
    const savedAccount = await this.accountRepo.save(account);

    // Tạo Company
    const company = this.companyRepo.create({
      accountId: savedAccount.id,
      companyName: dto.business_name,
      foreignCompanyName: dto.foreign_business_name ?? null,
      taxCode: dto.tax_code,
      businessTypeId: businessType.id,
      businessIndustryId: businessIndustry.id,
      licenseIssueDate: dto.license_issue_date ?? null,
      provinceDkkdId: provinceDKKD.id,
      wardDkkdId: wardDKKD.id,
      addressDkkd: dto.license_registration_adress,
      businessPhone: dto.business_phone ?? null,
      representativeName: dto.representative_name ?? null,
      representativePhone: dto.representative_phone ?? null,
      provinceHdkdId: provinceHDKD?.id ?? null,
      wardHdkdId: wardHDKD?.id ?? null,
      addressHdkd: dto.business_operating_adress ?? null,
      gpkdFilePath: dto.business_license_file_url ?? null,
      gtkFilePath: dto.other_document_file_url ?? null,
    });
    await this.companyRepo.save(company);

    return ApiResponse.success(
      { username: savedAccount.username, password: rawPassword },
      'Thêm doanh nghiệp thành công',
    );
  }

  async importFromFile(file: Express.Multer.File) {
    // 1. Parse file Excel
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

    if (rows.length === 0)
      throw ApiResponse.errorBad('File Excel không có dữ liệu');

    const success: string[] = [];
    const errors: { row: number; reason: string }[] = [];

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2; // +2 vì row 1 là header

      try {
        // 2. Map Excel → DTO
        const dto: CreateCompany = {
          business_name: row['Tên doanh nghiệp']?.trim() ?? '',
          tax_code: row['Mã số thuế']?.toString().trim() ?? '',
          business_type: row['Loại hình kinh doanh']?.trim() ?? '',
          business_industry: row['Ngành nghề kinh doanh']?.trim() ?? '',
          license_registration_province: row['Tỉnh/TP ĐKKD']?.trim() ?? '',
          license_registration_ward: row['Phường/Xã ĐKKD']?.trim() ?? '',
          email: row['Email']?.trim() ?? '',

          license_issue_date: parseDate(row['Ngày cấp GPKD']),
          license_registration_adress: row['Địa chỉ ĐKKD'] ?? undefined,
          foreign_business_name: row['Tên nước ngoài'] ?? undefined,
          business_phone: row['SĐT doanh nghiệp'] ?? undefined,
          representative_name: row['Người đại diện'] ?? undefined,
          representative_phone: row['SĐT đại diện'] ?? undefined,
          business_operating_province: row['Tỉnh/TP HĐKD'] ?? undefined,
          business_operating_ward: row['Phường/Xã HĐKD'] ?? undefined,
          business_operating_adress: row['Địa chỉ HĐKD'] ?? undefined,

          business_license_file_url: undefined,
          other_document_file_url: undefined,
        };

        // 3. Validate field bắt buộc
        if (
          !dto.business_name ||
          !dto.tax_code ||
          !dto.business_type ||
          !dto.business_industry ||
          !dto.license_registration_province ||
          !dto.license_registration_ward ||
          !dto.email
        ) {
          errors.push({ row: rowNumber, reason: 'Thiếu thông tin bắt buộc' });
          continue;
        }

        // 4. Kiểm tra trùng tax_code
        const existed = await this.companyRepo.findOne({
          where: { taxCode: dto.tax_code },
        });
        if (existed) {
          errors.push({
            row: rowNumber,
            reason: `Mã số thuế ${dto.tax_code} đã tồn tại`,
          });
          continue;
        }

        // 5. Gọi lại service tạo company (tái dụng logic có sẵn)
        await this.createCompany(dto);
        success.push(dto.tax_code);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Lỗi không xác định';
        errors.push({ row: rowNumber, reason: message });
      }
    }

    return ApiResponse.success(
      {
        total: rows.length,
        successCount: success.length,
        errorCount: errors.length,
        errors,
      },
      `Import hoàn tất: ${success.length} thành công, ${errors.length} lỗi`,
    );
  }

  // ── Preview Update ──────────────────────────────────────────
  async previewUpdateCompany(taxCode: string, dto: UpdateCompany) {
    const company = await this.companyRepo.findOne({
      where: { taxCode },
      relations: {
        businessType: true,
        businessIndustry: true,
        provinceDkkd: true,
        wardDkkd: true,
        provinceHdkd: true,
        wardHdkd: true,
        account: true,
      },
    });
    if (!company) {
      throw ApiResponse.errorNotFound('Không tìm thấy doanh nghiệp');
    }

    // Resolve các lookup nếu dto có thay đổi, giữ nguyên giá trị cũ nếu không
    let businessTypeName = company.businessType?.name ?? null;
    if (dto.business_type !== undefined) {
      const bt = await this.businessTypeRepo.findOne({
        where: { name: dto.business_type.trim() },
      });
      if (!bt)
        throw ApiResponse.errorNotFound(
          'Không tìm thấy loại hình doanh nghiệp',
        );
      businessTypeName = bt.name;
    }

    let businessIndustryName = company.businessIndustry?.name ?? null;
    if (dto.business_industry !== undefined) {
      const bi = await this.businessIndustryRepo.findOne({
        where: { name: dto.business_industry.trim() },
      });
      if (!bi)
        throw ApiResponse.errorNotFound('Không tìm thấy ngành nghề kinh doanh');
      businessIndustryName = bi.name;
    }

    let provinceDKKDName = company.provinceDkkd?.name ?? null;
    if (dto.license_registration_province !== undefined) {
      const p = await this.locationService.getProvinceByName(
        dto.license_registration_province,
      );
      if (!p)
        throw ApiResponse.errorNotFound(
          'Không tìm thấy tỉnh/thành đăng ký kinh doanh',
        );
      provinceDKKDName = p.name;
    }

    let wardDKKDName = company.wardDkkd?.name ?? null;
    if (dto.license_registration_ward !== undefined) {
      const w = await this.locationService.getWardByName(
        dto.license_registration_ward,
      );
      if (!w)
        throw ApiResponse.errorNotFound(
          'Không tìm thấy phường/xã đăng ký kinh doanh',
        );
      wardDKKDName = w.name;
    }

    let provinceHDKDName = company.provinceHdkd?.name ?? null;
    if (dto.business_operating_province !== undefined) {
      if (dto.business_operating_province) {
        const p = await this.locationService.getProvinceByName(
          dto.business_operating_province,
        );
        provinceHDKDName = p?.name ?? null;
      } else {
        provinceHDKDName = null;
      }
    }

    let wardHDKDName = company.wardHdkd?.name ?? null;
    if (dto.business_operating_ward !== undefined) {
      if (dto.business_operating_ward) {
        const w = await this.locationService.getWardByName(
          dto.business_operating_ward,
        );
        wardHDKDName = w?.name ?? null;
      } else {
        wardHDKDName = null;
      }
    }

    return ApiResponse.success(
      {
        // Giá trị sau khi merge: dto mới ghi đè, không có thì giữ cũ
        taxCode: company.taxCode,
        companyName: dto.business_name ?? company.companyName,
        foreignCompanyName:
          dto.foreign_business_name ?? company.foreignCompanyName,
        licenseIssueDate:
          DateUtil.formatBirthday(dto.license_issue_date) ??
          DateUtil.formatBirthday(company.licenseIssueDate),
        businessType: businessTypeName,
        businessIndustry: businessIndustryName,
        email: dto.email ?? company.account?.email,
        provinceDKKD: provinceDKKDName,
        wardDKKD: wardDKKDName,
        addressDKKD: dto.license_registration_adress ?? company.addressDkkd,
        provinceHDKD: provinceHDKDName,
        wardHDKD: wardHDKDName,
        addressHDKD: dto.business_operating_adress ?? company.addressHdkd,
        representativeName:
          dto.representative_name ?? company.representativeName,
        representativePhone:
          dto.representative_phone ?? company.representativePhone,
        businessPhone: dto.business_phone ?? company.businessPhone,
        gpkdFile: dto.business_license_file_url ?? company.gpkdFilePath,
        gtkFile: dto.other_document_file_url ?? company.gtkFilePath,
      },
      'OK',
    );
  }

  async updateCompany(taxCode: string, dto: UpdateCompany, caller: JwtPayload) {
    const company = await this.companyRepo.findOne({
      where: { taxCode },
      relations: { account: true },
    });
    if (!company) {
      throw ApiResponse.errorNotFound('Không tìm thấy doanh nghiệp');
    }

    if (company.status === CompanyStatus.INACTIVE) {
      throw ApiResponse.errorBad(
        'Doanh nghiệp đang bị khóa, không thể cập nhật thông tin',
      );
    }

    // DN chỉ được sửa thông tin của chính mình
    if (
      caller.accountType === AccountType.DOANH_NGHIEP &&
      company.accountId !== caller.sub
    ) {
      throw ApiResponse.errorForbidden(
        'Bạn không có quyền chỉnh sửa doanh nghiệp này',
      );
    }

    // ── Resolve lookups nếu có thay đổi ─────────────────────
    if (dto.business_type !== undefined) {
      const businessType = await this.businessTypeRepo.findOne({
        where: { name: dto.business_type.trim() },
      });
      if (!businessType) {
        throw ApiResponse.errorNotFound(
          'Không tìm thấy loại hình doanh nghiệp',
        );
      }
      company.businessTypeId = businessType.id;
    }

    if (dto.business_industry !== undefined) {
      const businessIndustry = await this.businessIndustryRepo.findOne({
        where: { name: dto.business_industry.trim() },
      });
      if (!businessIndustry) {
        throw ApiResponse.errorNotFound('Không tìm thấy ngành nghề kinh doanh');
      }
      company.businessIndustryId = businessIndustry.id;
    }

    if (dto.license_registration_province !== undefined) {
      const province = await this.locationService.getProvinceByName(
        dto.license_registration_province,
      );
      if (!province) {
        throw ApiResponse.errorNotFound(
          'Không tìm thấy tỉnh/thành đăng ký kinh doanh',
        );
      }
      company.provinceDkkdId = province.id;
    }

    if (dto.license_registration_ward !== undefined) {
      const ward = await this.locationService.getWardByName(
        dto.license_registration_ward,
      );
      if (!ward) {
        throw ApiResponse.errorNotFound(
          'Không tìm thấy phường/xã đăng ký kinh doanh',
        );
      }
      company.wardDkkdId = ward.id;
    }

    if (dto.business_operating_province !== undefined) {
      const province = dto.business_operating_province
        ? await this.locationService.getProvinceByName(
            dto.business_operating_province,
          )
        : null;
      company.provinceHdkdId = province?.id ?? null;
    }

    if (dto.business_operating_ward !== undefined) {
      const ward = dto.business_operating_ward
        ? await this.locationService.getWardByName(dto.business_operating_ward)
        : null;
      company.wardHdkdId = ward?.id ?? null;
    }

    // ── Cập nhật các field đơn giản ─────────────────────────
    if (dto.business_name !== undefined)
      company.companyName = dto.business_name;
    if (dto.foreign_business_name !== undefined)
      company.foreignCompanyName = dto.foreign_business_name;
    if (dto.license_issue_date !== undefined)
      company.licenseIssueDate = dto.license_issue_date;
    if (dto.license_registration_adress !== undefined)
      company.addressDkkd = dto.license_registration_adress;
    if (dto.business_phone !== undefined)
      company.businessPhone = dto.business_phone;
    if (dto.representative_name !== undefined)
      company.representativeName = dto.representative_name;
    if (dto.representative_phone !== undefined)
      company.representativePhone = dto.representative_phone;
    if (dto.business_operating_adress !== undefined)
      company.addressHdkd = dto.business_operating_adress;
    if (dto.business_license_file_url !== undefined)
      company.gpkdFilePath = dto.business_license_file_url;
    if (dto.other_document_file_url !== undefined)
      company.gtkFilePath = dto.other_document_file_url;

    // ── Email: chỉ SO mới được sửa ──────────────────────────
    if (dto.email !== undefined) {
      if (caller.accountType === AccountType.SO) {
        const existEmail = await this.accountRepo.findOne({
          where: { email: dto.email },
        });
        if (existEmail && existEmail.id !== company.accountId) {
          throw ApiResponse.errorDuplicated('Email đã tồn tại');
        }
        await this.accountRepo.update(
          { id: company.accountId },
          { email: dto.email },
        );
      }
      // DN thay đổi email thì hệ thống sẽ gửi mã otp cho email cũ
      else if (
        caller.accountType === AccountType.DOANH_NGHIEP &&
        dto.email !== company.account?.email
      ) {
        throw ApiResponse.errorBad(
          'Vui lòng sử dụng chức năng đổi email riêng để thay đổi email',
        );
      }
    }

    await this.companyRepo.save(company);
    return ApiResponse.success(null, 'Cập nhật doanh nghiệp thành công');
  }

  async requestChangeCompanyEmail(taxCode: string, caller: JwtPayload) {
    const company = await this.companyRepo.findOne({
      where: { taxCode },
      relations: { account: true },
    });
    if (!company) {
      throw ApiResponse.errorNotFound('Không tìm thấy doanh nghiệp');
    }

    // DN chỉ được đổi email của chính mình
    if (company.accountId !== caller.sub) {
      throw ApiResponse.errorForbidden(
        'Bạn không có quyền thực hiện thao tác này',
      );
    }

    const account = company.account;
    if (!account?.email) {
      throw ApiResponse.errorBad('Tài khoản chưa có email để xác thực');
    }

    // Vô hiệu hoá các OTP cũ chưa dùng
    await this.otpCodeRepo.update(
      { accountId: account.id, type: OtpType.CHANGE_EMAIL, isUsed: false },
      { isUsed: true },
    );

    // Tạo OTP mới
    const otp = this.getOTPCode();
    const otpExpiresMinutes = this.config.get<number>('OTP_EXPIRES_MINUTES', 5);
    await this.otpCodeRepo.save(
      this.otpCodeRepo.create({
        accountId: account.id,
        code: otp,
        type: OtpType.CHANGE_EMAIL,
        isUsed: false,
        expiresAt: new Date(Date.now() + otpExpiresMinutes * 60 * 1000),
      }),
    );

    // Gửi OTP đến email CŨ
    await this.mailService.sendChangeEmailOtp(
      account.email,
      company.companyName,
      otp,
    );

    return ApiResponse.success(
      { email: account.email },
      'Đã gửi mã OTP đến email hiện tại',
    );
  }

  async confirmChangeCompanyEmail(
    taxCode: string,
    otp: string,
    newEmail: string,
    caller: JwtPayload,
  ) {
    const company = await this.companyRepo.findOne({
      where: { taxCode },
      relations: { account: true },
    });
    if (!company) {
      throw ApiResponse.errorNotFound('Không tìm thấy doanh nghiệp');
    }

    // DN chỉ được đổi email của chính mình
    if (company.accountId !== caller.sub) {
      throw ApiResponse.errorForbidden(
        'Bạn không có quyền thực hiện thao tác này',
      );
    }

    // Kiểm tra email mới chưa tồn tại
    const emailExists = await this.accountRepo.findOne({
      where: { email: newEmail },
    });
    if (emailExists && emailExists.id !== company.accountId) {
      throw ApiResponse.errorDuplicated(
        'Email này đã được đăng ký bởi tài khoản khác',
      );
    }

    // Xác nhận OTP
    const otpRecord = await this.otpCodeRepo.findOne({
      where: {
        accountId: company.accountId,
        code: otp,
        type: OtpType.CHANGE_EMAIL,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });
    if (!otpRecord) {
      throw ApiResponse.errorBad('Mã OTP không hợp lệ');
    }
    if (otpRecord.expiresAt.getTime() < Date.now()) {
      throw ApiResponse.errorBad('Mã OTP đã hết hạn');
    }

    // Update email mới
    otpRecord.isUsed = true;
    await this.otpCodeRepo.save(otpRecord);
    await this.accountRepo.update(
      { id: company.accountId },
      { email: newEmail },
    );

    return ApiResponse.success(null, 'Thay đổi email thành công');
  }

  // REGISTER DN──────────────────────────────────────────
  async registerCompany(dto: CreateCompany) {
    // Kiểm tra trùng lặp
    await this.checkDuplicates(dto);

    // Resolve lookups
    const resolved = await this.resolveLookups(dto);

    const {
      businessType,
      businessIndustry,
      provinceDKKD,
      wardDKKD,
      provinceHDKD,
      wardHDKD,
    } = resolved;

    // Tạo Account với isActive: false — chờ xác nhận OTP
    const rawPassword = '12345678';
    const account = this.accountRepo.create({
      username: dto.tax_code,
      password: await bcrypt.hash(rawPassword, 10),
      email: dto.email,
      accountType: AccountType.DOANH_NGHIEP,
      isActive: false,
      isDeleted: false,
    });
    const savedAccount = await this.accountRepo.save(account);

    // Tạo Company với status: PENDING
    const company = this.companyRepo.create({
      accountId: savedAccount.id,
      companyName: dto.business_name,
      foreignCompanyName: dto.foreign_business_name ?? null,
      taxCode: dto.tax_code,
      businessTypeId: businessType.id,
      businessIndustryId: businessIndustry.id,
      licenseIssueDate: dto.license_issue_date ?? null,
      provinceDkkdId: provinceDKKD.id,
      wardDkkdId: wardDKKD.id,
      addressDkkd: dto.license_registration_adress,
      businessPhone: dto.business_phone ?? null,
      representativeName: dto.representative_name ?? null,
      representativePhone: dto.representative_phone ?? null,
      provinceHdkdId: provinceHDKD?.id ?? null,
      wardHdkdId: wardHDKD?.id ?? null,
      addressHdkd: dto.business_operating_adress ?? null,
      gpkdFilePath: dto.business_license_file_url ?? null,
      gtkFilePath: dto.other_document_file_url ?? null,
      status: CompanyStatus.PENDING,
    });
    await this.companyRepo.save(company);
    return {
      accountId: savedAccount.id,
      email: dto.email,
      username: savedAccount.username,
      rawPassword,
    };
  }

  /**
   * Bước 2: Kích hoạt Account + Company sau khi OTP hợp lệ.
   */
  async activateCompany(accountId: number) {
    const company = await this.companyRepo.findOne({ where: { accountId } });
    if (!company) {
      throw ApiResponse.errorNotFound('Không tìm thấy doanh nghiệp');
    }

    await this.accountRepo.update({ id: accountId }, { isActive: true });
    await this.companyRepo.update(
      { accountId },
      { status: CompanyStatus.ACTIVE },
    );

    return ApiResponse.success(null, 'Đăng ký doanh nghiệp thành công');
  }

  // ── Private helpers ──────────────────────────────────────────
  private getOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async checkDuplicates(dto: CreateCompany): Promise<void> {
    const existCompany = await this.companyRepo.findOne({
      where: { taxCode: dto.tax_code },
    });
    if (existCompany) {
      throw ApiResponse.errorDuplicated('Mã số thuế đã tồn tại');
    }

    if (dto.email) {
      const existAccount = await this.accountRepo.findOne({
        where: { email: dto.email },
      });
      if (existAccount) {
        throw ApiResponse.errorDuplicated('Email đã tồn tại');
      }
    }
  }

  /**
   * Resolve tất cả foreign-key lookups (businessType, businessIndustry, province, ward).
   * Trả về object chứa các entity đã tìm được, hoặc { error } nếu không tìm thấy.
   */
  private async resolveLookups(dto: CreateCompany): Promise<{
    businessType: BusinessType;
    businessIndustry: BusinessIndustry;
    provinceDKKD: Province;
    wardDKKD: Ward;
    provinceHDKD: Province | null;
    wardHDKD: Ward | null;
  }> {
    const businessType = await this.businessTypeRepo.findOne({
      where: { name: dto.business_type.trim() },
    });
    if (!businessType) {
      throw ApiResponse.errorNotFound('Không tìm thấy loại hình doanh nghiệp');
    }

    const businessIndustry = await this.businessIndustryRepo.findOne({
      where: { name: dto.business_industry.trim() },
    });
    if (!businessIndustry) {
      throw ApiResponse.errorNotFound('Không tìm thấy ngành nghề kinh doanh');
    }

    const provinceDKKD = await this.locationService.getProvinceByName(
      dto.license_registration_province,
    );
    if (!provinceDKKD) {
      throw ApiResponse.errorNotFound(
        'Không tìm thấy tỉnh/thành đăng ký kinh doanh',
      );
    }

    const wardDKKD = await this.locationService.getWardByName(
      dto.license_registration_ward,
    );
    if (!wardDKKD) {
      throw ApiResponse.errorNotFound(
        'Không tìm thấy phường/xã đăng ký kinh doanh',
      );
    }

    // Địa chỉ HĐKD là optional
    let provinceHDKD: Province | null = null;
    let wardHDKD: Ward | null = null;

    if (dto.business_operating_province) {
      provinceHDKD = await this.locationService.getProvinceByName(
        dto.business_operating_province,
      );
    }

    if (dto.business_operating_ward) {
      wardHDKD = await this.locationService.getWardByName(
        dto.business_operating_ward,
      );
    }

    return {
      businessType,
      businessIndustry,
      provinceDKKD,
      wardDKKD,
      provinceHDKD,
      wardHDKD,
    };
  }
}
