import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Response } from 'src/common';
import { LocationService } from '../location/location.service';
import { Province } from '../location/entities/province.entity';
import { Ward } from '../location/entities/ward.entity';
import { Account, AccountType } from '../auth/entities/account.entity';
import { Company } from './entities/company.entity';
import { BusinessIndustry } from './entities/business-industry.entity';
import { BusinessType } from './entities/business-type.entity';
import { CreateCompany } from './dto/company.dto';

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
    private readonly locationService: LocationService,
  ) {}

  // ── Lookup ───────────────────────────────────────────────────

  getAllCompanies() {
    return this.companyRepo.find();
  }

  getAllBusinessType() {
    return this.businessTypeRepo.find({ where: { status: 'ACTIVE' } });
  }

  getAllBusinessIndustry() {
    return this.businessIndustryRepo.find({ where: { status: 'ACTIVE' } });
  }

  getDetailCompany(taxCode: string) {
    return this.companyRepo.findOne({
      where: { taxCode },
      relations: {
        businessType: true,
        businessIndustry: true,
        provinceDkkd: true,
        wardDkkd: true,
        provinceHdkd: true,
        wardHdkd: true,
      },
    });
  }

  // ── Preview (validate + trả về data đã resolve, chưa lưu) ────
  async previewCompany(dto: CreateCompany) {
    const duplicateError = await this.checkDuplicates(dto);
    if (duplicateError) return duplicateError;

    // Resolve lookup data
    const resolved = await this.resolveLookups(dto);
    if ('error' in resolved) return resolved.error;

    const {
      businessType,
      businessIndustry,
      provinceDKKD,
      wardDKKD,
      provinceHDKD,
      wardHDKD,
    } = resolved;

    return Response.success(
      {
        taxCode: dto.tax_code,
        companyName: dto.business_name,
        foreignCompanyName: dto.foreign_business_name,
        licenseIssueDate: dto.license_issue_date,
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
    const duplicateError = await this.checkDuplicates(dto);
    if (duplicateError) return duplicateError;
    // Resolve lookup data
    const resolved = await this.resolveLookups(dto);
    if ('error' in resolved) return resolved.error;

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

    return Response.success(
      { username: savedAccount.username, password: rawPassword },
      'Thêm doanh nghiệp thành công',
    );
  }

  // ── Private helpers ──────────────────────────────────────────
  private async checkDuplicates(dto: CreateCompany) {
    const existCompany = await this.companyRepo.findOne({
      where: { taxCode: dto.tax_code },
    });
    if (existCompany) {
      return Response.errorDuplicated('Mã số thuế đã tồn tại');
    }

    if (dto.email) {
      const existAccount = await this.accountRepo.findOne({
        where: { email: dto.email },
      });
      if (existAccount) {
        return Response.errorDuplicated('Email đã tồn tại');
      }
    }

    return null;
  }

  /**
   * Resolve tất cả foreign-key lookups (businessType, businessIndustry, province, ward).
   * Trả về object chứa các entity đã tìm được, hoặc { error } nếu không tìm thấy.
   *
   * BUG CŨ: Cả previewCompany và createCompany đều gọi riêng lẻ từng lookup
   * → duplicated code và dễ bỏ sót kiểm tra null (createCompany dùng ! assertion
   *   mà không guard trước → runtime crash nếu businessType/Industry không tồn tại).
   */
  private async resolveLookups(dto: CreateCompany): Promise<
    | {
        businessType: BusinessType;
        businessIndustry: BusinessIndustry;
        provinceDKKD: Province;
        wardDKKD: Ward;
        provinceHDKD: Province | null;
        wardHDKD: Ward | null;
      }
    | { error: ReturnType<typeof Response.errorNotFound> }
  > {
    const businessType = await this.businessTypeRepo.findOne({
      where: { name: dto.business_type.trim() },
    });
    if (!businessType) {
      return {
        error: Response.errorNotFound('Không tìm thấy loại hình doanh nghiệp'),
      };
    }

    const businessIndustry = await this.businessIndustryRepo.findOne({
      where: { name: dto.business_industry.trim() },
    });
    if (!businessIndustry) {
      return {
        error: Response.errorNotFound('Không tìm thấy ngành nghề kinh doanh'),
      };
    }

    const provinceDKKD = await this.locationService.getProvinceByName(
      dto.license_registration_province,
    );
    if (!provinceDKKD) {
      return {
        error: Response.errorNotFound(
          'Không tìm thấy tỉnh/thành đăng ký kinh doanh',
        ),
      };
    }

    const wardDKKD = await this.locationService.getWardByName(
      dto.license_registration_ward,
    );
    if (!wardDKKD) {
      return {
        error: Response.errorNotFound(
          'Không tìm thấy phường/xã đăng ký kinh doanh',
        ),
      };
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
