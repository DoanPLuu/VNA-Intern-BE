import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Response } from 'src/common';
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

interface JwtPayload {
  sub: number;
  username: string;
  accountType: AccountType;
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
      where: { status: In([CompanyStatus.ACTIVE, CompanyStatus.PENDING]) },
    });
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
  async reinitializeCompanyPassword(
    accountType: AccountType,
    dto: InitializeCompanyPassword,
  ) {
    if (accountType !== AccountType.SO)
      throw Response.errorForbidden(
        'Tài khoản hiện tại không thể thực hiện chức năng này',
      );
    const account = await this.accountRepo.findOne({
      where: { username: dto.tax_code },
    });
    if (!account)
      throw Response.errorNotFound(
        `Không tìm thấy doanh nghiệp có mã số thuế ${dto.tax_code}`,
      );
    account.password = await bcrypt.hash(dto.password, 10);
    await this.accountRepo.save(account);
    return Response.success(null, 'Khởi tạo mật khẩu thành công');
  }
  async deleteCompany(accountType: AccountType, tax_code: string) {
    if (accountType !== AccountType.SO)
      throw Response.errorForbidden(
        'Tài khoản hiện tại không thể thực hiện chức năng này',
      );
    const company = await this.companyRepo.findOne({
      where: { taxCode: tax_code },
      relations: { account: true },
    });
    if (!company)
      throw Response.errorNotFound(
        `Không tìm thấy doanh nghiệp có mã số thuế: ${tax_code}`,
      );
    const account = company.account;
    account.isDeleted = true;
    await this.accountRepo.save(account);
    company.status = CompanyStatus.INACTIVE;
    await this.companyRepo.save(company);
    return Response.success(null, 'Xóa Doanh nghiệp thành công');
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

    return Response.success(
      { username: savedAccount.username, password: rawPassword },
      'Thêm doanh nghiệp thành công',
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
      throw Response.errorNotFound('Không tìm thấy doanh nghiệp');
    }

    // Resolve các lookup nếu dto có thay đổi, giữ nguyên giá trị cũ nếu không
    let businessTypeName = company.businessType?.name ?? null;
    if (dto.business_type !== undefined) {
      const bt = await this.businessTypeRepo.findOne({
        where: { name: dto.business_type.trim() },
      });
      if (!bt)
        throw Response.errorNotFound('Không tìm thấy loại hình doanh nghiệp');
      businessTypeName = bt.name;
    }

    let businessIndustryName = company.businessIndustry?.name ?? null;
    if (dto.business_industry !== undefined) {
      const bi = await this.businessIndustryRepo.findOne({
        where: { name: dto.business_industry.trim() },
      });
      if (!bi)
        throw Response.errorNotFound('Không tìm thấy ngành nghề kinh doanh');
      businessIndustryName = bi.name;
    }

    let provinceDKKDName = company.provinceDkkd?.name ?? null;
    if (dto.license_registration_province !== undefined) {
      const p = await this.locationService.getProvinceByName(
        dto.license_registration_province,
      );
      if (!p)
        throw Response.errorNotFound(
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
        throw Response.errorNotFound(
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

    return Response.success(
      {
        // Giá trị sau khi merge: dto mới ghi đè, không có thì giữ cũ
        taxCode: company.taxCode,
        companyName: dto.business_name ?? company.companyName,
        foreignCompanyName:
          dto.foreign_business_name ?? company.foreignCompanyName,
        licenseIssueDate: dto.license_issue_date ?? company.licenseIssueDate,
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
      throw Response.errorNotFound('Không tìm thấy doanh nghiệp');
    }

    // DN chỉ được sửa thông tin của chính mình
    if (
      caller.accountType === AccountType.DOANH_NGHIEP &&
      company.accountId !== caller.sub
    ) {
      throw Response.errorForbidden(
        'Bạn không có quyền chỉnh sửa doanh nghiệp này',
      );
    }

    // ── Resolve lookups nếu có thay đổi ─────────────────────
    if (dto.business_type !== undefined) {
      const businessType = await this.businessTypeRepo.findOne({
        where: { name: dto.business_type.trim() },
      });
      if (!businessType) {
        throw Response.errorNotFound('Không tìm thấy loại hình doanh nghiệp');
      }
      company.businessTypeId = businessType.id;
    }

    if (dto.business_industry !== undefined) {
      const businessIndustry = await this.businessIndustryRepo.findOne({
        where: { name: dto.business_industry.trim() },
      });
      if (!businessIndustry) {
        throw Response.errorNotFound('Không tìm thấy ngành nghề kinh doanh');
      }
      company.businessIndustryId = businessIndustry.id;
    }

    if (dto.license_registration_province !== undefined) {
      const province = await this.locationService.getProvinceByName(
        dto.license_registration_province,
      );
      if (!province) {
        throw Response.errorNotFound(
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
        throw Response.errorNotFound(
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
          throw Response.errorDuplicated('Email đã tồn tại');
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
        throw Response.errorBad(
          'Vui lòng sử dụng chức năng đổi email riêng để thay đổi email',
        );
      }
    }

    await this.companyRepo.save(company);
    return Response.success(null, 'Cập nhật doanh nghiệp thành công');
  }

  async requestChangeCompanyEmail(taxCode: string, caller: JwtPayload) {
    const company = await this.companyRepo.findOne({
      where: { taxCode },
      relations: { account: true },
    });
    if (!company) {
      throw Response.errorNotFound('Không tìm thấy doanh nghiệp');
    }

    // DN chỉ được đổi email của chính mình
    if (company.accountId !== caller.sub) {
      throw Response.errorForbidden(
        'Bạn không có quyền thực hiện thao tác này',
      );
    }

    const account = company.account;
    if (!account?.email) {
      throw Response.errorBad('Tài khoản chưa có email để xác thực');
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

    return Response.success(
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
      throw Response.errorNotFound('Không tìm thấy doanh nghiệp');
    }

    // DN chỉ được đổi email của chính mình
    if (company.accountId !== caller.sub) {
      throw Response.errorForbidden(
        'Bạn không có quyền thực hiện thao tác này',
      );
    }

    // Kiểm tra email mới chưa tồn tại
    const emailExists = await this.accountRepo.findOne({
      where: { email: newEmail },
    });
    if (emailExists && emailExists.id !== company.accountId) {
      throw Response.errorDuplicated(
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
      throw Response.errorBad('Mã OTP không hợp lệ');
    }
    if (otpRecord.expiresAt.getTime() < Date.now()) {
      throw Response.errorBad('Mã OTP đã hết hạn');
    }

    // Update email mới
    otpRecord.isUsed = true;
    await this.otpCodeRepo.save(otpRecord);
    await this.accountRepo.update(
      { id: company.accountId },
      { email: newEmail },
    );

    return Response.success(null, 'Thay đổi email thành công');
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
      throw Response.errorNotFound('Không tìm thấy doanh nghiệp');
    }

    await this.accountRepo.update({ id: accountId }, { isActive: true });
    await this.companyRepo.update(
      { accountId },
      { status: CompanyStatus.ACTIVE },
    );

    return Response.success(null, 'Đăng ký doanh nghiệp thành công');
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
      throw Response.errorDuplicated('Mã số thuế đã tồn tại');
    }

    if (dto.email) {
      const existAccount = await this.accountRepo.findOne({
        where: { email: dto.email },
      });
      if (existAccount) {
        throw Response.errorDuplicated('Email đã tồn tại');
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
      throw Response.errorNotFound('Không tìm thấy loại hình doanh nghiệp');
    }

    const businessIndustry = await this.businessIndustryRepo.findOne({
      where: { name: dto.business_industry.trim() },
    });
    if (!businessIndustry) {
      throw Response.errorNotFound('Không tìm thấy ngành nghề kinh doanh');
    }

    const provinceDKKD = await this.locationService.getProvinceByName(
      dto.license_registration_province,
    );
    if (!provinceDKKD) {
      throw Response.errorNotFound(
        'Không tìm thấy tỉnh/thành đăng ký kinh doanh',
      );
    }

    const wardDKKD = await this.locationService.getWardByName(
      dto.license_registration_ward,
    );
    if (!wardDKKD) {
      throw Response.errorNotFound(
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
