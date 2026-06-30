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
import { DateUtil } from 'src/common/utils/date.util';
import { Workbook } from 'exceljs';
import { SessionService } from '../session/session.service';
import { JwtPayload } from 'src/common/guards/jwt.strategy';

// Thêm interface này trên đầu service hoặc file riêng
type ExcelLoadInput = Parameters<Workbook['xlsx']['load']>[0];

type ImportCompanyRow = {
  rowNumber: number;
  businessName: string;
  taxCode: string;
  businessType: string;
  businessIndustry: string;
  licenseIssueDate?: string; // DD-MM-YYYY
  licenseRegistrationProvince: string;
  licenseRegistrationWard: string;
  licenseRegistrationAddress?: string;
  foreignBusinessName?: string;
  email: string;
  businessPhone?: string;
  representativeName?: string;
  representativePhone?: string;
  businessOperatingProvince?: string;
  businessOperatingWard?: string;
  businessOperatingAddress?: string;
};

type PreparedImportCompanyRow = ImportCompanyRow & {
  businessTypeId: number;
  businessIndustryId: number;
  provinceDkkdId: number;
  wardDkkdId: number;
  provinceHdkdId: number | null;
  wardHdkdId: number | null;
  errors: string[];
};

type ImportCompanyPreviewItem = ImportCompanyRow & {
  isValid: boolean;
  errors: string[];
};

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
    private readonly sessionService: SessionService,
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
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Lấy danh sách company cho việc xóa company và restore
  async getDeletedCompanies() {
    return await this.companyRepo.find({
      relations: { account: true },
      where: {
        status: CompanyStatus.DELETED,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  getAllBusinessType() {
    return this.businessTypeRepo.find({ where: { status: 'ACTIVE' } });
  }

  getAllBusinessIndustry() {
    return this.businessIndustryRepo.find({
      select: { code: true, name: true },
      where: { status: 'ACTIVE', level: 'Cấp 4' },
    });
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
    await this.sessionService.invalidateAccountSessions(account.id);
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
    await this.sessionService.invalidateAccountSessions(company.account.id);
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
    await this.sessionService.invalidateAccountSessions(account.id);
    company.status = CompanyStatus.DELETED;
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
  // ── Sinh file Excel mẫu (data + hướng dẫn + danh mục) ─────────
  async generateImportCompanyTemplate(): Promise<Buffer> {
    const workbook = new Workbook();

    // ── Sheet 1: dữ liệu nhập ──────────────────────────────────────
    const dataSheet = workbook.addWorksheet('Companies');
    dataSheet.columns = [
      { header: 'businessName', key: 'businessName', width: 30 },
      { header: 'taxCode', key: 'taxCode', width: 18 },
      { header: 'businessType', key: 'businessType', width: 28 },
      { header: 'businessIndustry', key: 'businessIndustry', width: 28 },
      { header: 'licenseIssueDate', key: 'licenseIssueDate', width: 16 },
      {
        header: 'licenseRegistrationProvince',
        key: 'licenseRegistrationProvince',
        width: 24,
      },
      {
        header: 'licenseRegistrationWard',
        key: 'licenseRegistrationWard',
        width: 24,
      },
      {
        header: 'licenseRegistrationAddress',
        key: 'licenseRegistrationAddress',
        width: 30,
      },
      { header: 'email', key: 'email', width: 28 },
      { header: 'foreignBusinessName', key: 'foreignBusinessName', width: 24 },
      { header: 'businessPhone', key: 'businessPhone', width: 16 },
      { header: 'representativeName', key: 'representativeName', width: 22 },
      { header: 'representativePhone', key: 'representativePhone', width: 18 },
      {
        header: 'businessOperatingProvince',
        key: 'businessOperatingProvince',
        width: 24,
      },
      {
        header: 'businessOperatingWard',
        key: 'businessOperatingWard',
        width: 24,
      },
      {
        header: 'businessOperatingAddress',
        key: 'businessOperatingAddress',
        width: 30,
      },
    ];

    dataSheet.addRow({
      businessName: 'Công ty TNHH Môi trường xanh',
      taxCode: '1234567890',
      businessType: 'Công ty TNHH một thành viên',
      businessIndustry: 'Trồng rừng và chăm sóc rừng',
      licenseIssueDate: '09-01-2020',
      licenseRegistrationProvince: 'Tp Hồ Chí Minh',
      licenseRegistrationWard: 'Phường Chợ Lớn',
      licenseRegistrationAddress: '192 Nguyễn Trãi',
      email: 'gnagroup@gmail.com',
      foreignBusinessName: 'GNA Group',
      businessPhone: '0912345678',
      representativeName: 'Trần Thị B',
      representativePhone: '0819231432',
      businessOperatingProvince: 'Tp Hồ Chí Minh',
      businessOperatingWard: 'Phường Chợ Lớn',
      businessOperatingAddress: '192 Nguyễn Trãi',
    });

    // ── Sheet 2: hướng dẫn ───────────────────────────────────────
    const guideSheet = workbook.addWorksheet('HuongDan');
    guideSheet.columns = [
      { header: 'Cột', key: 'column', width: 28 },
      { header: 'Bắt buộc', key: 'required', width: 12 },
      { header: 'Mô tả', key: 'description', width: 65 },
      { header: 'Ví dụ', key: 'example', width: 30 },
    ];

    guideSheet.addRows([
      [
        'businessName',
        'Có',
        'Tên doanh nghiệp, không chứa ký tự đặc biệt',
        'Công ty TNHH Môi trường xanh',
      ],
      [
        'taxCode',
        'Có',
        'Mã số thuế duy nhất, 10 chữ số hoặc 10 chữ số-3 chữ số',
        '1234567890 hoặc 1234567890-123',
      ],
      [
        'businessType',
        'Có',
        'Tên loại hình kinh doanh, xem tại sheet DanhMuc',
        'Công ty TNHH một thành viên',
      ],
      [
        'businessIndustry',
        'Có',
        'Tên ngành nghề kinh doanh, xem tại sheet DanhMuc',
        'Trồng rừng và chăm sóc rừng',
      ],
      [
        'licenseIssueDate',
        'Không',
        'Ngày cấp GPKD, định dạng DD-MM-YYYY',
        '09-01-2020',
      ],
      [
        'licenseRegistrationProvince',
        'Có',
        'Tỉnh/thành phố đăng ký kinh doanh, xem tại sheet DanhMuc',
        'Tp Hồ Chí Minh',
      ],
      [
        'licenseRegistrationWard',
        'Có',
        'Phường/xã đăng ký kinh doanh, phải thuộc tỉnh đã chọn',
        'Phường Chợ Lớn',
      ],
      [
        'licenseRegistrationAddress',
        'Không',
        'Địa chỉ chi tiết đăng ký kinh doanh',
        '192 Nguyễn Trãi',
      ],
      ['email', 'Có', 'Email duy nhất trong hệ thống', 'gnagroup@gmail.com'],
      [
        'foreignBusinessName',
        'Không',
        'Tên doanh nghiệp bằng tiếng nước ngoài',
        'GNA Group',
      ],
      ['businessPhone', 'Không', 'Số điện thoại doanh nghiệp', '0912345678'],
      ['representativeName', 'Không', 'Tên người đại diện', 'Trần Thị B'],
      [
        'representativePhone',
        'Không',
        'Số điện thoại người đại diện',
        '0819231432',
      ],
      [
        'businessOperatingProvince',
        'Không',
        'Tỉnh/thành phố hoạt động kinh doanh',
        'Tp Hồ Chí Minh',
      ],
      [
        'businessOperatingWard',
        'Không',
        'Phường/xã hoạt động kinh doanh, phải thuộc tỉnh đã chọn',
        'Phường Bình Thọ',
      ],
      [
        'businessOperatingAddress',
        'Không',
        'Địa chỉ chi tiết hoạt động kinh doanh',
        '192 Nguyễn Trãi',
      ],
    ]);

    // ── Sheet 3: danh mục tham chiếu (businessType / industry / province / ward) ──
    const [businessTypes, businessIndustries, provinces] = await Promise.all([
      this.businessTypeRepo.find({ where: { status: 'ACTIVE' } }),
      this.businessIndustryRepo.find({ where: { status: 'ACTIVE' } }),
      this.locationService.getProvinces(),
    ]);

    const catalogSheet = workbook.addWorksheet('DanhMuc');
    catalogSheet.columns = [
      { header: 'Loại hình kinh doanh', key: 'businessType', width: 30 },
      { header: 'Ngành nghề kinh doanh', key: 'businessIndustry', width: 30 },
      { header: 'Tỉnh/Thành phố', key: 'province', width: 28 },
    ];

    const maxRows = Math.max(
      businessTypes.length,
      businessIndustries.length,
      provinces.length,
    );

    for (let i = 0; i < maxRows; i++) {
      catalogSheet.addRow({
        businessType: businessTypes[i]?.name ?? '',
        businessIndustry: businessIndustries[i]?.name ?? '',
        province: provinces[i]?.name ?? '',
      });
    }

    // ── Sheet 4: danh mục phường/xã (gộp theo tỉnh, để tránh quá nhiều cột) ──
    const wardSheet = workbook.addWorksheet('DanhMucPhuongXa');
    wardSheet.columns = [
      { header: 'Tỉnh/Thành phố', key: 'province', width: 28 },
      { header: 'Phường/Xã', key: 'ward', width: 28 },
    ];

    for (const province of provinces) {
      const wards = await this.locationService.getWardsByProvince(province.id);
      for (const ward of wards) {
        wardSheet.addRow({ province: province.name, ward: ward.name });
      }
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /* ── Preview trước khi import thật ───────────────────────────── */

  async previewImportCompanies(fileBuffer: Buffer) {
    const rows = await this.parseImportCompanyFile(fileBuffer);
    const preparedRows = await this.validateImportCompanyRows(rows);

    const items: ImportCompanyPreviewItem[] = preparedRows.map((row) => ({
      rowNumber: row.rowNumber,
      businessName: row.businessName,
      taxCode: row.taxCode,
      businessType: row.businessType,
      businessIndustry: row.businessIndustry,
      licenseIssueDate: row.licenseIssueDate,
      licenseRegistrationProvince: row.licenseRegistrationProvince,
      licenseRegistrationWard: row.licenseRegistrationWard,
      licenseRegistrationAddress: row.licenseRegistrationAddress,
      foreignBusinessName: row.foreignBusinessName,
      email: row.email,
      businessPhone: row.businessPhone,
      representativeName: row.representativeName,
      representativePhone: row.representativePhone,
      businessOperatingProvince: row.businessOperatingProvince,
      businessOperatingWard: row.businessOperatingWard,
      businessOperatingAddress: row.businessOperatingAddress,
      isValid: row.errors.length === 0,
      errors: row.errors,
    }));

    const validCount = items.filter((item) => item.isValid).length;
    const invalidCount = items.length - validCount;

    return ApiResponse.success(
      {
        summary: {
          totalRows: items.length,
          validRows: validCount,
          invalidRows: invalidCount,
          canImport: invalidCount === 0,
        },
        items,
      },
      'Kiểm tra file import thành công',
    );
  }

  async importFromFile(file: Express.Multer.File) {
    const rows = await this.parseImportCompanyFile(file.buffer);
    const preparedRows = await this.validateImportCompanyRows(rows);

    const invalidRows = preparedRows
      .filter((row) => row.errors.length > 0)
      .map((row) => ({
        rowNumber: row.rowNumber,
        businessName: row.businessName,
        taxCode: row.taxCode,
        email: row.email,
        errors: row.errors,
      }));

    if (invalidRows.length > 0) {
      throw ApiResponse.errorBad('File import có dữ liệu không hợp lệ', {
        totalRows: preparedRows.length,
        invalidRows: invalidRows.length,
        items: invalidRows,
      });
    }

    const createdAccountIds = await this.accountRepo.manager.transaction(
      async (manager) => {
        const accountRepo = manager.getRepository(Account);
        const companyRepo = manager.getRepository(Company);

        const createdIds: number[] = [];
        const rawPassword = '12345678';

        for (const row of preparedRows) {
          const account = accountRepo.create({
            username: row.taxCode.trim(),
            password: await bcrypt.hash(rawPassword, 10),
            email: row.email.trim(),
            accountType: AccountType.DOANH_NGHIEP,
            isActive: true,
            isDeleted: false,
          });
          const savedAccount = await accountRepo.save(account);

          const company = companyRepo.create({
            accountId: savedAccount.id,
            companyName: row.businessName.trim(),
            foreignCompanyName: row.foreignBusinessName ?? null,
            taxCode: row.taxCode.trim(),
            businessTypeId: row.businessTypeId,
            businessIndustryId: row.businessIndustryId,
            licenseIssueDate: row.licenseIssueDate
              ? new Date(this.convertDdMmYyyyToIso(row.licenseIssueDate))
              : null,
            provinceDkkdId: row.provinceDkkdId,
            wardDkkdId: row.wardDkkdId,
            addressDkkd: row.licenseRegistrationAddress ?? null,
            businessPhone: row.businessPhone ?? null,
            representativeName: row.representativeName ?? null,
            representativePhone: row.representativePhone ?? null,
            provinceHdkdId: row.provinceHdkdId,
            wardHdkdId: row.wardHdkdId,
            addressHdkd: row.businessOperatingAddress ?? null,
            gpkdFilePath: null,
            gtkFilePath: null,
          });
          await companyRepo.save(company);

          createdIds.push(savedAccount.id);
        }

        return createdIds;
      },
    );

    return ApiResponse.success(
      {
        affected: createdAccountIds.length,
        accountIds: createdAccountIds,
      },
      'Import doanh nghiệp thành công',
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
      (caller.accountType as AccountType) === AccountType.DOANH_NGHIEP &&
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
      if ((caller.accountType as AccountType) === AccountType.SO) {
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
        (caller.accountType as AccountType) === AccountType.DOANH_NGHIEP &&
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
    // Kiểm tra đã có account PENDING với tax_code này chưa
    const existingCompany = await this.companyRepo.findOne({
      where: { taxCode: dto.tax_code },
      relations: { account: true },
    });

    if (existingCompany) {
      // Đã tồn tại và không phải PENDING → báo lỗi trùng bình thường
      if (existingCompany.status !== CompanyStatus.PENDING) {
        throw ApiResponse.errorDuplicated('Mã số thuế đã tồn tại');
      }

      // Đang PENDING → người dùng quay lại sửa thông tin, cập nhật lại
      const account = existingCompany.account;

      // Kiểm tra email mới có trùng với account KHÁC không
      if (dto.email !== account.email) {
        const emailExists = await this.accountRepo.findOne({
          where: { email: dto.email },
        });
        if (emailExists && emailExists.id !== account.id) {
          throw ApiResponse.errorDuplicated('Email đã tồn tại');
        }
      }

      // Resolve lookups để cập nhật lại thông tin công ty
      const resolved = await this.resolveLookups(dto);
      const {
        businessType,
        businessIndustry,
        provinceDKKD,
        wardDKKD,
        provinceHDKD,
        wardHDKD,
      } = resolved;

      // Cập nhật lại account
      await this.accountRepo.update({ id: account.id }, { email: dto.email });

      // Cập nhật lại company
      await this.companyRepo.update(
        { id: existingCompany.id },
        {
          companyName: dto.business_name,
          foreignCompanyName: dto.foreign_business_name ?? null,
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
        },
      );

      // Vô hiệu hóa OTP cũ chưa dùng
      await this.otpCodeRepo.update(
        { accountId: account.id, type: OtpType.REGISTER_DN, isUsed: false },
        { isUsed: true },
      );

      // Trả về để AuthService gửi OTP mới
      return {
        accountId: account.id,
        email: dto.email,
        username: account.username,
        rawPassword: '12345678',
      };
    }

    // ── Chưa có → kiểm tra email rồi tạo mới bình thường ────────
    if (dto.email) {
      const existAccount = await this.accountRepo.findOne({
        where: { email: dto.email },
      });
      if (existAccount) {
        throw ApiResponse.errorDuplicated('Email đã tồn tại');
      }
    }

    const resolved = await this.resolveLookups(dto);
    const {
      businessType,
      businessIndustry,
      provinceDKKD,
      wardDKKD,
      provinceHDKD,
      wardHDKD,
    } = resolved;

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

  // ── Private helper for import file ──────────────────────────────────────────
  private formatDateToDdMmYyyy(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  private normalizeExcelValue(value: unknown): string {
    if (value === null || value === undefined) return '';

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value).trim();
    }

    if (typeof value === 'object') {
      const obj = value as {
        text?: string;
        result?: string | number | boolean | Date | null;
        richText?: Array<{ text: string }>;
      };

      if (typeof obj.text === 'string') return obj.text.trim();

      if (Array.isArray(obj.richText)) {
        return obj.richText
          .map((item) => item.text)
          .join('')
          .trim();
      }

      if (obj.result instanceof Date) {
        return obj.result.toISOString().slice(0, 10);
      }

      if (
        typeof obj.result === 'string' ||
        typeof obj.result === 'number' ||
        typeof obj.result === 'boolean'
      ) {
        return String(obj.result).trim();
      }
    }

    return '';
  }
  private normalizeExcelDateValue(value: unknown): string {
    if (value === null || value === undefined) return '';

    if (value instanceof Date) {
      return this.formatDateToDdMmYyyy(value);
    }

    if (typeof value === 'object') {
      const obj = value as {
        text?: string;
        result?: string | number | boolean | Date | null;
      };

      if (obj.result instanceof Date) {
        return this.formatDateToDdMmYyyy(obj.result);
      }

      if (typeof obj.text === 'string') return obj.text.trim();
    }

    return this.normalizeExcelValue(value);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidTaxCode(taxCode: string): boolean {
    return /^(\d{10}|\d{10}-\d{3})$/.test(taxCode);
  }

  private isValidImportDate(dateString: string): boolean {
    if (!/^\d{2}-\d{2}-\d{4}$/.test(dateString)) return false;

    const [day, month, year] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  private isFutureImportDate(dateString: string): boolean {
    const [day, month, year] = dateString.split('-').map(Number);
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();

    inputDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return inputDate.getTime() > today.getTime();
  }

  private convertDdMmYyyyToIso(dateString: string): string {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }

  // ── Đọc file Excel ra danh sách row thô ───────────────────────
  private async parseImportCompanyFile(
    fileBuffer: Buffer,
  ): Promise<ImportCompanyRow[]> {
    const workbook = new Workbook();
    await workbook.xlsx.load(fileBuffer as unknown as ExcelLoadInput);

    const worksheet =
      workbook.getWorksheet('Companies') ?? workbook.worksheets[0];
    if (!worksheet) {
      throw ApiResponse.errorBad('File Excel không có sheet dữ liệu');
    }

    const rows: ImportCompanyRow[] = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      const businessName = this.normalizeExcelValue(row.getCell(1).value);
      const taxCode = this.normalizeExcelValue(row.getCell(2).value);
      const businessType = this.normalizeExcelValue(row.getCell(3).value);
      const businessIndustry = this.normalizeExcelValue(row.getCell(4).value);
      const licenseIssueDate = this.normalizeExcelDateValue(
        row.getCell(5).value,
      );
      const licenseRegistrationProvince = this.normalizeExcelValue(
        row.getCell(6).value,
      );
      const licenseRegistrationWard = this.normalizeExcelValue(
        row.getCell(7).value,
      );
      const licenseRegistrationAddress = this.normalizeExcelValue(
        row.getCell(8).value,
      );
      const email = this.normalizeExcelValue(row.getCell(9).value);
      const foreignBusinessName = this.normalizeExcelValue(
        row.getCell(10).value,
      );
      const businessPhone = this.normalizeExcelValue(row.getCell(11).value);
      const representativeName = this.normalizeExcelValue(
        row.getCell(12).value,
      );
      const representativePhone = this.normalizeExcelValue(
        row.getCell(13).value,
      );
      const businessOperatingProvince = this.normalizeExcelValue(
        row.getCell(14).value,
      );
      const businessOperatingWard = this.normalizeExcelValue(
        row.getCell(15).value,
      );
      const businessOperatingAddress = this.normalizeExcelValue(
        row.getCell(16).value,
      );

      const isEmptyRow = [
        businessName,
        taxCode,
        businessType,
        businessIndustry,
        licenseIssueDate,
        licenseRegistrationProvince,
        licenseRegistrationWard,
        licenseRegistrationAddress,
        email,
        foreignBusinessName,
        businessPhone,
        representativeName,
        representativePhone,
        businessOperatingProvince,
        businessOperatingWard,
        businessOperatingAddress,
      ].every((item) => !item);

      if (isEmptyRow) continue;

      rows.push({
        rowNumber,
        businessName,
        taxCode,
        businessType,
        businessIndustry,
        licenseIssueDate: licenseIssueDate || undefined,
        licenseRegistrationProvince,
        licenseRegistrationWard,
        licenseRegistrationAddress: licenseRegistrationAddress || undefined,
        foreignBusinessName: foreignBusinessName || undefined,
        email,
        businessPhone: businessPhone || undefined,
        representativeName: representativeName || undefined,
        representativePhone: representativePhone || undefined,
        businessOperatingProvince: businessOperatingProvince || undefined,
        businessOperatingWard: businessOperatingWard || undefined,
        businessOperatingAddress: businessOperatingAddress || undefined,
      });
    }

    if (!rows.length) {
      throw ApiResponse.errorBad('File Excel không có dữ liệu để import');
    }

    return rows;
  }

  // ── Validate toàn bộ rows, resolve các lookup id ──────────────
  private async validateImportCompanyRows(
    rows: ImportCompanyRow[],
  ): Promise<PreparedImportCompanyRow[]> {
    // ── Preload business type / industry theo tên (giảm query lặp) ──
    const businessTypeNames = [
      ...new Set(rows.map((r) => r.businessType).filter(Boolean)),
    ];
    const businessIndustryNames = [
      ...new Set(rows.map((r) => r.businessIndustry).filter(Boolean)),
    ];

    const businessTypes = businessTypeNames.length
      ? await this.businessTypeRepo.find({
          where: { name: In(businessTypeNames) },
        })
      : [];
    const businessIndustries = businessIndustryNames.length
      ? await this.businessIndustryRepo.find({
          where: { name: In(businessIndustryNames) },
        })
      : [];

    const businessTypeMap = new Map(businessTypes.map((bt) => [bt.name, bt]));
    const businessIndustryMap = new Map(
      businessIndustries.map((bi) => [bi.name, bi]),
    );

    // ── Preload tax code / email đã tồn tại trong DB ────────────────
    const taxCodes = [...new Set(rows.map((r) => r.taxCode).filter(Boolean))];
    const emails = [...new Set(rows.map((r) => r.email).filter(Boolean))];

    const existingCompanies = taxCodes.length
      ? await this.companyRepo.find({
          where: { taxCode: In(taxCodes) },
          select: { taxCode: true },
        })
      : [];
    const existingAccounts = emails.length
      ? await this.accountRepo.find({
          where: { email: In(emails) },
          select: { email: true },
        })
      : [];

    const existingTaxCodeSet = new Set(
      existingCompanies.map((c) => c.taxCode?.trim()).filter(Boolean),
    );
    const existingEmailSet = new Set(
      existingAccounts.map((a) => a.email?.trim()).filter(Boolean),
    );

    // ── Đếm trùng lặp trong cùng 1 file ──────────────────────────────
    const taxCodeCounter = new Map<string, number>();
    const emailCounter = new Map<string, number>();

    for (const row of rows) {
      if (row.taxCode) {
        taxCodeCounter.set(
          row.taxCode,
          (taxCodeCounter.get(row.taxCode) ?? 0) + 1,
        );
      }
      if (row.email) {
        emailCounter.set(row.email, (emailCounter.get(row.email) ?? 0) + 1);
      }
    }

    const preparedRows: PreparedImportCompanyRow[] = [];

    for (const row of rows) {
      const errors: string[] = [];

      if (!row.businessName) {
        errors.push('Tên doanh nghiệp không được để trống');
      } else if (!/^[\p{L}\p{N}\s]+$/u.test(row.businessName)) {
        errors.push('Tên doanh nghiệp không được chứa ký tự đặc biệt');
      }

      if (!row.taxCode) {
        errors.push('Mã số thuế không được để trống');
      } else if (!this.isValidTaxCode(row.taxCode)) {
        errors.push(
          'Mã số thuế không hợp lệ, phải đủ 10 chữ số hoặc 13 chữ số (VD: 1234567890 hoặc 1234567890-123)',
        );
      }

      if (!row.businessType) {
        errors.push('Loại hình kinh doanh không được để trống');
      }

      if (!row.businessIndustry) {
        errors.push('Ngành nghề kinh doanh không được để trống');
      }

      if (!row.licenseRegistrationProvince) {
        errors.push('Tỉnh/thành phố đăng ký kinh doanh không được để trống');
      }

      if (!row.licenseRegistrationWard) {
        errors.push('Phường/xã đăng ký kinh doanh không được để trống');
      }

      if (!row.email) {
        errors.push('Email không được để trống');
      } else if (!this.isValidEmail(row.email)) {
        errors.push('Email không đúng định dạng');
      }

      if (row.licenseIssueDate) {
        if (!this.isValidImportDate(row.licenseIssueDate)) {
          errors.push('Ngày cấp GPKD không đúng định dạng DD-MM-YYYY');
        } else if (this.isFutureImportDate(row.licenseIssueDate)) {
          errors.push('Ngày cấp GPKD không được lớn hơn ngày hiện tại');
        }
      }

      if (row.businessOperatingWard && !row.businessOperatingProvince) {
        errors.push(
          'Có phường/xã hoạt động kinh doanh thì bắt buộc phải có tỉnh/thành phố',
        );
      }

      if (row.taxCode && (taxCodeCounter.get(row.taxCode) ?? 0) > 1) {
        errors.push('Mã số thuế bị trùng trong file import');
      }

      if (row.email && (emailCounter.get(row.email) ?? 0) > 1) {
        errors.push('Email bị trùng trong file import');
      }

      if (row.taxCode && existingTaxCodeSet.has(row.taxCode)) {
        errors.push('Mã số thuế đã tồn tại trong hệ thống');
      }

      if (row.email && existingEmailSet.has(row.email)) {
        errors.push('Email đã tồn tại trong hệ thống');
      }

      const businessType = row.businessType
        ? businessTypeMap.get(row.businessType)
        : null;
      if (row.businessType && !businessType) {
        errors.push('Loại hình kinh doanh không tồn tại');
      }

      const businessIndustry = row.businessIndustry
        ? businessIndustryMap.get(row.businessIndustry)
        : null;
      if (row.businessIndustry && !businessIndustry) {
        errors.push('Ngành nghề kinh doanh không tồn tại');
      }
      // ── Resolve địa chỉ ĐKKD (bắt buộc) ──────────────────────────
      let provinceDkkdId: number | null = null;
      let wardDkkdId: number | null = null;

      if (row.licenseRegistrationProvince) {
        const province = await this.locationService.getProvinceByName(
          row.licenseRegistrationProvince,
        );
        if (!province) {
          errors.push('Không tìm thấy tỉnh/thành phố đăng ký kinh doanh');
        } else {
          provinceDkkdId = province.id;
        }
      }

      if (row.licenseRegistrationWard) {
        if (!provinceDkkdId) {
          errors.push(
            'Vui lòng cung cấp tỉnh/thành phố đăng ký kinh doanh hợp lệ trước khi chọn phường/xã',
          );
        } else {
          const ward = await this.locationService.getWardByNameAndProvince(
            row.licenseRegistrationWard,
            provinceDkkdId,
          );
          if (!ward) {
            errors.push(
              'Phường/xã đăng ký kinh doanh không thuộc tỉnh/thành phố đã chọn',
            );
          } else {
            wardDkkdId = ward.id;
          }
        }
      }

      // ── Resolve địa chỉ HĐKD (optional) ──────────────────────────
      let provinceHdkdId: number | null = null;
      let wardHdkdId: number | null = null;

      if (row.businessOperatingProvince) {
        const province = await this.locationService.getProvinceByName(
          row.businessOperatingProvince,
        );
        if (!province) {
          errors.push('Không tìm thấy tỉnh/thành phố hoạt động kinh doanh');
        } else {
          provinceHdkdId = province.id;
        }
      }

      if (row.businessOperatingWard) {
        if (!provinceHdkdId) {
          errors.push(
            'Vui lòng cung cấp tỉnh/thành phố hoạt động kinh doanh hợp lệ trước khi chọn phường/xã',
          );
        } else {
          const ward = await this.locationService.getWardByNameAndProvince(
            row.businessOperatingWard,
            provinceHdkdId,
          );
          if (!ward) {
            errors.push(
              'Phường/xã hoạt động kinh doanh không thuộc tỉnh/thành phố đã chọn',
            );
          } else {
            wardHdkdId = ward.id;
          }
        }
      }

      preparedRows.push({
        ...row,
        businessTypeId: businessType?.id ?? 0,
        businessIndustryId: businessIndustry?.id ?? 0,
        provinceDkkdId: provinceDkkdId ?? 0,
        wardDkkdId: wardDkkdId ?? 0,
        provinceHdkdId,
        wardHdkdId,
        errors,
      });
    }

    return preparedRows;
  }
}
