import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';

import { Workbook } from 'exceljs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Response } from '../../common/response';
import { Account, AccountType } from '../auth/entities/account.entity';
import { LocationService } from '../location/location.service';
import { Role } from '../role/entities/role.entity';
import { CreateUserDto } from './dto/CreateUser.dto';
import { DeleteUsersDto } from './dto/DeleteUser.dto';
import { ListUserDto } from './dto/listUser.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UserProfileDto } from './dto/userProfile.dto';
import { User } from './entities/user.entity';

type ImportUserRow = {
  rowNumber: number;
  username: string;
  password?: string;
  email: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  position?: string;
  roleCode: string;
  province?: string;
  ward?: string;
  address?: string;
  isActive: boolean;
};
type ExcelLoadInput = Parameters<Workbook['xlsx']['load']>[0];

type PreparedImportUserRow = ImportUserRow & {
  roleId: number;
  provinceId: number | null;
  wardId: number | null;
  errors: string[];
};

type ImportPreviewItem = ImportUserRow & {
  isValid: boolean;
  errors: string[];
};
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly locationService: LocationService,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  // ── Tìm kiếm ────────────────────────────────────────────────

  async findAccountByUsername(username: string): Promise<Account | null> {
    return this.accountRepo.findOne({ where: { username } });
  }

  async findAccountById(id: number): Promise<Account | null> {
    return this.accountRepo.findOne({ where: { id } });
  }

  async findUserByAccountId(accountId: number): Promise<User | null> {
    return this.userRepo.findOne({
      where: { accountId },
      relations: { province: true, ward: true },
    });
  }

  // ── Tạo tài khoản ───────────────────────────────────────────

  /**
   * Tạo Account (SO) + User profile rỗng đi kèm.
   * Trả về null nếu username đã tồn tại.
   */
  async createUserAccount(
    username: string,
    password: string,
    accountType: AccountType = AccountType.SO,
  ): Promise<Account | null> {
    const existing = await this.findAccountByUsername(username);
    if (existing) return null;

    const account = this.accountRepo.create({
      username,
      password: await bcrypt.hash(password, 10),
      accountType,
      isActive: true,
      isDeleted: false,
    });
    const savedAccount = await this.accountRepo.save(account);

    // Tạo User profile rỗng, populate sau khi nhân viên tự cập nhật
    const user = this.userRepo.create({ accountId: savedAccount.id });
    await this.userRepo.save(user);

    return savedAccount;
  }

  // ── Cập nhật profile ────────────────────────────────────────

  async updateUserProfile(
    accountId: number,
    dto: UserProfileDto,
  ): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { accountId } });
    if (dto.email !== undefined) {
      const account = await this.accountRepo.findOne({
        where: { id: accountId },
      });
      if (account) {
        if (
          dto.email &&
          dto.email !== account.email &&
          account.email !== null
        ) {
          return null;
        }
        account.email = dto.email;
        await this.accountRepo.save(account);
      }
    }
    if (!user) return null;

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.dateOfBirth !== undefined) user.dateOfBirth = dto.dateOfBirth;
    if (dto.gender !== undefined) user.gender = dto.gender;
    if (dto.position !== undefined) user.position = dto.position;
    if (dto.address !== undefined) user.address = dto.address;
    if (dto.avatarUrl !== undefined) user.avatar = dto.avatarUrl;

    if (dto.province !== undefined) {
      const province = await this.locationService.getProvinceByName(
        dto.province,
      );
      user.provinceId = province?.id ?? null;
    }

    if (dto.ward !== undefined) {
      const ward = await this.locationService.getWardByName(dto.ward);
      user.wardId = ward?.id ?? null;
    }

    return this.userRepo.save(user);
  }

  // ── Lấy profile đầy đủ ──────────────────────────────────────
  private resolveLocalPath(relativePath: string): string {
    return join(process.cwd(), ...relativePath.split('/'));
  }

  private async safeRemoveLocalFile(relativePath?: string | null) {
    if (!relativePath) return;

    try {
      await unlink(this.resolveLocalPath(relativePath));
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  async getUserProfile(
    identifier: number | string,
  ): Promise<
    (Omit<User, 'account'> & { account: Omit<Account, 'password'> }) | null
  > {
    let accountId: number;

    if (typeof identifier === 'string') {
      const account = await this.accountRepo.findOne({
        where: { username: identifier },
      });
      if (!account) return null;
      accountId = account.id;
    } else {
      accountId = identifier;
    }
    const user = await this.userRepo.findOne({
      where: { accountId },
      relations: { province: true, ward: true, account: true },
    });
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...accountWithoutPassword } = user.account;
    return {
      ...user,
      account: accountWithoutPassword,
    };
  }

  // user manager //

  private normalizeExcelValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

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

      if (typeof obj.text === 'string') {
        return obj.text.trim();
      }

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

  private normalizeBooleanValue(value: string): boolean {
    const normalized = value.trim().toLowerCase();

    return ['true', '1', 'yes', 'y', 'co', 'có'].includes(normalized);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidUsername(username: string): boolean {
    return (
      /^[a-zA-Z0-9_-]+$/.test(username) &&
      username.length >= 3 &&
      username.length <= 100
    );
  }

  private isValidDateString(dateString: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return date.toISOString().slice(0, 10) === dateString;
  }

  private isFutureDate(dateString: string): boolean {
    const inputDate = new Date(dateString);
    const today = new Date();

    inputDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return inputDate.getTime() > today.getTime();
  }

  private async parseImportFile(fileBuffer: Buffer): Promise<ImportUserRow[]> {
    const workbook = new Workbook();
    await workbook.xlsx.load(fileBuffer as unknown as ExcelLoadInput);

    const worksheet = workbook.getWorksheet('Users') ?? workbook.worksheets[0];
    if (!worksheet) {
      throw Response.errorBad('File Excel không có sheet dữ liệu');
    }

    const rows: ImportUserRow[] = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      const username = this.normalizeExcelValue(row.getCell(1).value);
      const email = this.normalizeExcelValue(row.getCell(2).value);
      const fullName = this.normalizeExcelValue(row.getCell(3).value);
      const dateOfBirth = this.normalizeExcelValue(row.getCell(4).value);
      const gender = this.normalizeExcelValue(row.getCell(5).value);
      const position = this.normalizeExcelValue(row.getCell(6).value);
      const roleCode = this.normalizeExcelValue(
        row.getCell(7).value,
      ).toUpperCase();
      const province = this.normalizeExcelValue(row.getCell(8).value);
      const ward = this.normalizeExcelValue(row.getCell(9).value);
      const address = this.normalizeExcelValue(row.getCell(10).value);
      const isActiveRaw = this.normalizeExcelValue(row.getCell(11).value);

      const isEmptyRow = [
        username,
        email,
        fullName,
        dateOfBirth,
        gender,
        position,
        roleCode,
        province,
        ward,
        address,
        isActiveRaw,
      ].every((item) => !item);

      if (isEmptyRow) {
        continue;
      }

      rows.push({
        rowNumber,
        username,

        email,
        fullName,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        position: position || undefined,
        roleCode,
        province: province || undefined,
        ward: ward || undefined,
        address: address || undefined,
        isActive: isActiveRaw ? this.normalizeBooleanValue(isActiveRaw) : true,
      });
    }

    if (!rows.length) {
      throw Response.errorBad('File Excel không có dữ liệu để import');
    }

    return rows;
  }

  private async validateImportRows(
    rows: ImportUserRow[],
  ): Promise<PreparedImportUserRow[]> {
    const roleCodes = [
      ...new Set(rows.map((row) => row.roleCode).filter(Boolean)),
    ];
    const roles = roleCodes.length
      ? await this.roleRepo.find({
          where: {
            code: In(roleCodes),
          },
        })
      : [];

    const roleMap = new Map(
      roles.map((role) => [role.code.toUpperCase(), role]),
    );

    const usernames = [
      ...new Set(rows.map((row) => row.username).filter(Boolean)),
    ];
    const emails = [...new Set(rows.map((row) => row.email).filter(Boolean))];

    const existingAccounts = await this.accountRepo.find({
      where: [
        ...(usernames.length ? [{ username: In(usernames) }] : []),
        ...(emails.length ? [{ email: In(emails) }] : []),
      ],
      select: {
        username: true,
        email: true,
      },
    });

    const existingUsernameSet = new Set(
      existingAccounts
        .map((account) => account.username?.trim())
        .filter(Boolean),
    );

    const existingEmailSet = new Set(
      existingAccounts.map((account) => account.email?.trim()).filter(Boolean),
    );

    const usernameCounter = new Map<string, number>();
    const emailCounter = new Map<string, number>();

    for (const row of rows) {
      if (row.username) {
        usernameCounter.set(
          row.username,
          (usernameCounter.get(row.username) ?? 0) + 1,
        );
      }
      if (row.email) {
        emailCounter.set(row.email, (emailCounter.get(row.email) ?? 0) + 1);
      }
    }

    const preparedRows: PreparedImportUserRow[] = [];

    for (const row of rows) {
      const errors: string[] = [];

      if (!row.username) {
        errors.push('Tên đăng nhập không được để trống');
      } else if (!this.isValidUsername(row.username)) {
        errors.push(
          'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới (_) và dấu gạch ngang (-), đồng thời phải từ 3 đến 100 ký tự',
        );
      }

      if (!row.email) {
        errors.push('Email không được để trống');
      } else if (!this.isValidEmail(row.email)) {
        errors.push('Email không đúng định dạng');
      }

      if (!row.fullName) {
        errors.push('Họ và tên không được để trống');
      }

      if (!row.roleCode) {
        errors.push('Mã vai trò không được để trống');
      }

      if (row.password && row.password.length < 8) {
        errors.push('Mật khẩu phải có ít nhất 8 ký tự');
      }

      if (row.dateOfBirth) {
        if (!this.isValidDateString(row.dateOfBirth)) {
          errors.push('Ngày sinh không đúng định dạng YYYY-MM-DD');
        } else if (this.isFutureDate(row.dateOfBirth)) {
          errors.push('Ngày sinh không được lớn hơn ngày hiện tại');
        }
      }

      if (row.ward && !row.province) {
        errors.push('Có phường/xã thì bắt buộc phải có tỉnh/thành phố');
      }

      if (row.username && (usernameCounter.get(row.username) ?? 0) > 1) {
        errors.push('Tên đăng nhập bị trùng trong file import');
      }

      if (row.email && (emailCounter.get(row.email) ?? 0) > 1) {
        errors.push('Email bị trùng trong file import');
      }

      if (row.username && existingUsernameSet.has(row.username)) {
        errors.push('Tên đăng nhập đã tồn tại trong hệ thống');
      }

      if (row.email && existingEmailSet.has(row.email)) {
        errors.push('Email đã tồn tại trong hệ thống');
      }

      const role = row.roleCode
        ? roleMap.get(row.roleCode.toUpperCase())
        : null;
      if (row.roleCode && !role) {
        errors.push('Mã vai trò không tồn tại');
      }

      let provinceId: number | null = null;
      let wardId: number | null = null;

      if (row.province) {
        const province = await this.locationService.getProvinceByName(
          row.province,
        );
        if (!province) {
          errors.push('Không tìm thấy tỉnh/thành phố');
        } else {
          provinceId = province.id;
        }
      }

      if (row.ward) {
        if (!provinceId) {
          errors.push('Vui lòng chọn tỉnh/thành phố trước khi chọn phường/xã');
        } else {
          const ward = await this.locationService.getWardByNameAndProvince(
            row.ward,
            provinceId,
          );

          if (!ward) {
            errors.push('Phường/xã không thuộc tỉnh/thành phố đã chọn');
          } else {
            wardId = ward.id;
          }
        }
      }

      preparedRows.push({
        ...row,
        roleId: role?.id ?? 0,
        provinceId,
        wardId,
        errors,
      });
    }

    return preparedRows;
  }

  async generateImportTemplate(): Promise<Buffer> {
    const workbook = new Workbook();

    const dataSheet = workbook.addWorksheet('Users');
    dataSheet.columns = [
      { header: 'username', key: 'username', width: 20 },
      { header: 'password', key: 'password', width: 20 },
      { header: 'email', key: 'email', width: 30 },
      { header: 'fullName', key: 'fullName', width: 25 },
      { header: 'dateOfBirth', key: 'dateOfBirth', width: 15 },
      { header: 'gender', key: 'gender', width: 15 },
      { header: 'position', key: 'position', width: 20 },
      { header: 'roleCode', key: 'roleCode', width: 20 },
      { header: 'province', key: 'province', width: 30 },
      { header: 'ward', key: 'ward', width: 30 },
      { header: 'address', key: 'address', width: 40 },
      { header: 'isActive', key: 'isActive', width: 12 },
    ];

    dataSheet.addRow({
      username: 'admin-vna-01',
      password: '12345678',
      email: 'admin01@gmail.com',
      fullName: 'Nguyen Van A',
      dateOfBirth: '1995-06-01',
      gender: 'Nam',
      position: 'Chuyen vien',
      roleCode: 'ADMIN',
      province: 'Thành phố Hồ Chí Minh',
      ward: 'Phường Gò Vấp',
      address: '123 Nguyen Trai',
      isActive: 'true',
    });

    const guideSheet = workbook.addWorksheet('HuongDan');
    guideSheet.columns = [
      { header: 'Cột', key: 'column', width: 20 },
      { header: 'Bắt buộc', key: 'required', width: 12 },
      { header: 'Mô tả', key: 'description', width: 60 },
      { header: 'Ví dụ', key: 'example', width: 30 },
    ];

    guideSheet.addRows([
      [
        'username',
        'Có',
        'Tên đăng nhập duy nhất, 3-100 ký tự, chỉ gồm chữ/số/_/-',
        'admin-vna-01',
      ],
      ['password', 'Không', 'Bỏ trống sẽ dùng mặc định 12345678', '12345678'],
      ['email', 'Có', 'Email duy nhất trong hệ thống', 'admin01@gmail.com'],
      ['fullName', 'Có', 'Họ và tên người dùng', 'Nguyen Van A'],
      ['dateOfBirth', 'Không', 'Định dạng YYYY-MM-DD', '1995-06-01'],
      ['gender', 'Không', 'Giới tính', 'Nam'],
      ['position', 'Không', 'Chức danh', 'Chuyen vien'],
      ['roleCode', 'Có', 'Mã vai trò đã tồn tại trong bảng roles', 'ADMIN'],
      ['province', 'Không', 'Tên tỉnh/thành phố', 'Thành phố Hồ Chí Minh'],
      [
        'ward',
        'Không',
        'Tên phường/xã, phải thuộc tỉnh đã chọn',
        'Phường Gò Vấp',
      ],
      ['address', 'Không', 'Địa chỉ chi tiết', '123 Nguyen Trai'],
      ['isActive', 'Không', 'true/false, bỏ trống mặc định true', 'true'],
    ]);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async previewImportUsers(fileBuffer: Buffer) {
    const rows = await this.parseImportFile(fileBuffer);
    const preparedRows = await this.validateImportRows(rows);

    const items: ImportPreviewItem[] = preparedRows.map((row) => ({
      rowNumber: row.rowNumber,
      username: row.username,
      email: row.email,
      fullName: row.fullName,
      dateOfBirth: row.dateOfBirth,
      gender: row.gender,
      position: row.position,
      roleCode: row.roleCode,
      province: row.province,
      ward: row.ward,
      address: row.address,
      isActive: row.isActive,
      isValid: row.errors.length === 0,
      errors: row.errors,
    }));

    const validCount = items.filter((item) => item.isValid).length;
    const invalidCount = items.length - validCount;

    return Response.success(
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

  async importUsers(fileBuffer: Buffer) {
    const rows = await this.parseImportFile(fileBuffer);
    const preparedRows = await this.validateImportRows(rows);

    const invalidRows = preparedRows
      .filter((row) => row.errors.length > 0)
      .map((row) => ({
        rowNumber: row.rowNumber,
        username: row.username,
        email: row.email,
        fullName: row.fullName,
        roleCode: row.roleCode,
        errors: row.errors,
      }));

    if (invalidRows.length > 0) {
      throw Response.errorBad('File import có dữ liệu không hợp lệ', {
        totalRows: preparedRows.length,
        invalidRows: invalidRows.length,
        items: invalidRows,
      });
    }

    const createdAccountIds = await this.accountRepo.manager.transaction(
      async (manager) => {
        const accountRepo = manager.getRepository(Account);
        const userRepo = manager.getRepository(User);

        const createdIds: number[] = [];

        for (const row of preparedRows) {
          const rawPassword = row.password ?? '12345678';

          const account = accountRepo.create({
            username: row.username.trim(),
            password: await bcrypt.hash(rawPassword, 10),
            email: row.email.trim(),
            accountType: AccountType.SO,
            roleId: row.roleId,
            isActive: row.isActive,
            isDeleted: false,
          });

          const savedAccount = await accountRepo.save(account);

          const user = userRepo.create({
            accountId: savedAccount.id,
            fullName: row.fullName.trim(),
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
            gender: row.gender ?? null,
            position: row.position ?? null,
            address: row.address ?? null,
            avatar: null,
            provinceId: row.provinceId,
            wardId: row.wardId,
          });

          await userRepo.save(user);
          createdIds.push(savedAccount.id);
        }

        return createdIds;
      },
    );

    return Response.success(
      {
        affected: createdAccountIds.length,
        accountIds: createdAccountIds,
      },
      'Import người dùng thành công',
    );
  }
  async getAllUsers(query: ListUserDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.account', 'account')
      .leftJoinAndSelect('account.role', 'role')
      .where('account.accountType = :accountType', {
        accountType: AccountType.SO,
      })
      .andWhere('account.isDeleted = :isDeleted', {
        isDeleted: false,
      });
    if (query.fullname) {
      qb.andWhere('LOWER(user.fullName) LIKE LOWER(:fullName)', {
        fullName: `%${query.fullname.trim()}%`,
      });
    }
    if (query.username) {
      qb.andWhere('LOWER(account.username) LIKE LOWER(:username)', {
        username: `%${query.username.trim()}%`,
      });
    }

    if (query.email) {
      qb.andWhere('LOWER(account.email) LIKE LOWER(:email)', {
        email: `%${query.email.trim()}%`,
      });
    }
    if (query.roleId) {
      qb.andWhere('account.roleId = :roleId', { roleId: query.roleId });
    }

    if (query.position) {
      qb.andWhere('LOWER(user.position) LIKE LOWER(:position)', {
        position: `%${query.position.trim()}%`,
      });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('account.isActive = :isActive', {
        isActive: query.isActive === 'true',
      });
    }
    qb.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((user) => ({
        id: user.id,
        accountId: user.accountId,
        fullName: user.fullName,
        username: user.account.username,
        email: user.account.email,
        role: user.account.role
          ? {
              id: user.account.role.id,
              code: user.account.role.code,
              name: user.account.role.name,
            }
          : null,
        position: user.position,
        isActive: user.account.isActive,
        isDeleted: user.account.isDeleted,
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getDeletedUsers(query: ListUserDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.account', 'account')
      .leftJoinAndSelect('account.role', 'role')
      .where('account.accountType = :accountType', {
        accountType: AccountType.SO,
      })
      .andWhere('account.isDeleted = :isDeleted', {
        isDeleted: true,
      });

    if (query.fullname) {
      qb.andWhere('LOWER(user.fullName) LIKE LOWER(:fullName)', {
        fullName: `%${query.fullname.trim()}%`,
      });
    }

    if (query.username) {
      qb.andWhere('LOWER(account.username) LIKE LOWER(:username)', {
        username: `%${query.username.trim()}%`,
      });
    }

    if (query.email) {
      qb.andWhere('LOWER(account.email) LIKE LOWER(:email)', {
        email: `%${query.email.trim()}%`,
      });
    }

    if (query.roleId) {
      qb.andWhere('account.roleId = :roleId', {
        roleId: query.roleId,
      });
    }

    if (query.position) {
      qb.andWhere('LOWER(user.position) LIKE LOWER(:position)', {
        position: `%${query.position.trim()}%`,
      });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('account.isActive = :isActive', {
        isActive: query.isActive === 'true',
      });
    }

    qb.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((user) => ({
        id: user.id,
        accountId: user.accountId,
        fullName: user.fullName,
        username: user.account.username,
        email: user.account.email,
        role: user.account.role
          ? {
              id: user.account.role.id,
              code: user.account.role.code,
              name: user.account.role.name,
            }
          : null,
        position: user.position,
        isActive: user.account.isActive,
        isDeleted: user.account.isDeleted,
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getUserById(accountId: number) {
    const user = await this.userRepo.findOne({
      where: { accountId },
      relations: {
        account: {
          role: true,
        },
        province: true,
        ward: true,
      },
    });
    if (!user) {
      throw Response.errorNotFound('Không tìm thấy người dùng');
    }
    return Response.success({
      id: user.id,
      accountId: user.accountId,
      username: user.account.username,
      email: user.account.email,
      accountType: user.account.accountType,
      isActive: user.account.isActive,
      isDeleted: user.account.isDeleted,
      role: user.account.role
        ? {
            id: user.account.role.id,
            code: user.account.role.code,
            name: user.account.role.name,
          }
        : null,
      fullName: user.fullName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      position: user.position,
      address: user.address,
      avatarUrl: user.avatar,
      province: user.province
        ? {
            id: user.province.id,
            name: user.province.name,
          }
        : null,
      ward: user.ward
        ? {
            id: user.ward.id,
            name: user.ward.name,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async deleteUser(dto: DeleteUsersDto) {
    const accountIds = [...new Set(dto.accountIds)];
    const accounts = await this.accountRepo.find({
      where: {
        id: In(accountIds),
        accountType: AccountType.SO,
      },
      select: {
        id: true,
        username: true,
        isDeleted: true,
        isActive: true,
      },
    });
    if (accounts.length !== accountIds.length) {
      throw Response.errorNotFound('Một hoặc nhiều người dùng không tồn tại');
    }
    const deleteIds = accounts
      .filter((acc) => !acc.isDeleted)
      .map((acc) => acc.id);

    if (!deleteIds.length) {
      return Response.success(
        {
          affected: 0,
          accountIds: [],
        },
        'Các người dùng này đã được xóa trước đó',
      );
    }
    await this.accountRepo.update(
      { id: In(deleteIds) },
      { isDeleted: true, isActive: false },
    );
    return Response.success(
      {
        affected: deleteIds.length,
        accountIds: deleteIds,
      },
      'Xóa người dùng thành công',
    );
  }
  async restoreUsers(dto: DeleteUsersDto) {
    const accountIds = [...new Set(dto.accountIds)];

    const accounts = await this.accountRepo.find({
      where: {
        id: In(accountIds),
        accountType: AccountType.SO,
      },
      select: {
        id: true,
        username: true,
        isDeleted: true,
        isActive: true,
      },
    });

    if (accounts.length !== accountIds.length) {
      throw Response.errorNotFound('Một hoặc nhiều người dùng không tồn tại');
    }

    const restorableIds = accounts
      .filter((account) => account.isDeleted)
      .map((account) => account.id);

    if (!restorableIds.length) {
      return Response.success(
        {
          affected: 0,
          accountIds: [],
        },
        'Các người dùng đã ở trạng thái hoạt động trước đó',
      );
    }

    await this.accountRepo.update(
      { id: In(restorableIds) },
      {
        isDeleted: false,
        isActive: true,
      },
    );

    return Response.success(
      {
        affected: restorableIds.length,
        accountIds: restorableIds,
      },
      'Khôi phục người dùng thành công',
    );
  }
  async updateUser(accountId: number, dto: UpdateUserDto, avatarPath?: string) {
    let oldAvatarPath: string | null = null;
    try {
      await this.accountRepo.manager.transaction(async (manager) => {
        const accountRepo = manager.getRepository(Account);
        const userRepo = manager.getRepository(User);
        const roleRepo = manager.getRepository(Role);
        const user = await userRepo.findOne({
          where: { accountId },
          relations: { account: true },
        });
        if (!user) {
          throw Response.errorNotFound('Không tìm thấy người dùng');
        }
        oldAvatarPath = user.avatar;

        const account = user.account;
        if (dto.roleId !== undefined) {
          const role = await roleRepo.findOne({
            where: { id: dto.roleId },
          });
          if (!role) {
            throw Response.errorNotFound('Không tìm thấy vai trò');
          }
          account.roleId = role.id;
        }
        if (dto.isActive !== undefined) {
          account.isActive = dto.isActive;
        }
        await accountRepo.save(account);
        //user
        if (dto.fullName !== undefined) {
          user.fullName = dto.fullName;
        }
        if (dto.dateOfBirth !== undefined) {
          user.dateOfBirth = new Date(dto.dateOfBirth);
        }
        if (dto.gender !== undefined) {
          user.gender = dto.gender;
        }

        if (dto.position !== undefined) {
          user.position = dto.position;
        }

        if (dto.address !== undefined) {
          user.address = dto.address;
        }

        if (avatarPath) {
          user.avatar = avatarPath;
        } else if (dto.avatarUrl !== undefined) {
          user.avatar = dto.avatarUrl;
        }
        let nextProvinceId = user.provinceId;

        if (dto.province !== undefined) {
          if (!dto.province?.trim()) {
            user.provinceId = null;
            nextProvinceId = null;
            user.wardId = null;
          } else {
            const province = await this.locationService.getProvinceByName(
              dto.province,
            );

            if (!province) {
              throw Response.errorNotFound('Không tìm thấy tỉnh/thành phố');
            }

            user.provinceId = province.id;
            nextProvinceId = province.id;
            if (dto.ward === undefined) {
              user.wardId = null;
            }
          }
        }

        if (dto.ward !== undefined) {
          if (!dto.ward?.trim()) {
            user.wardId = null;
          } else {
            if (!nextProvinceId) {
              throw Response.errorBad(
                'Vui lòng chọn tỉnh/thành phố trước khi chọn phường/xã',
              );
            }

            const ward = await this.locationService.getWardByNameAndProvince(
              dto.ward,
              nextProvinceId,
            );

            if (!ward) {
              throw Response.errorNotFound(
                'Phường/xã không thuộc tỉnh/thành phố đã chọn',
              );
            }

            user.wardId = ward.id;
          }
        }
        await userRepo.save(user);
      });
    } catch (error) {
      await this.safeRemoveLocalFile(avatarPath);
      throw error;
    }
    if (avatarPath && oldAvatarPath && oldAvatarPath !== avatarPath) {
      await this.safeRemoveLocalFile(oldAvatarPath);
    }
    return this.getUserById(accountId);
  }

  async createUser(dto: CreateUserDto, avatarPath?: string) {
    let provinceId: number | null = null;
    let wardId: number | null = null;

    if (dto.province?.trim()) {
      const province = await this.locationService.getProvinceByName(
        dto.province,
      );
      if (!province) {
        throw Response.errorNotFound('Không tìm thấy tỉnh/thành phố');
      }
      provinceId = province.id;
    }

    if (dto.ward?.trim()) {
      if (!provinceId) {
        throw Response.errorBad(
          'Vui lòng chọn tỉnh/thành phố trước khi chọn phường/xã',
        );
      }

      const ward = await this.locationService.getWardByNameAndProvince(
        dto.ward,
        provinceId,
      );
      if (!ward) {
        throw Response.errorNotFound(
          'Phường/xã không thuộc tỉnh/thành phố đã chọn',
        );
      }
      wardId = ward.id;
    }
    let createAccount: number;

    try {
      createAccount = await this.accountRepo.manager.transaction(
        async (manager) => {
          const accountRepo = manager.getRepository(Account);
          const userRepo = manager.getRepository(User);
          const roleRepo = manager.getRepository(Role);

          const existingUsername = await accountRepo.findOne({
            where: { username: dto.username },
          });

          if (existingUsername) {
            throw Response.errorDuplicated('Tên đăng nhập đã được sử dụng');
          }

          if (dto.email) {
            const existingEmail = await accountRepo.findOne({
              where: { email: dto.email },
            });
            if (existingEmail) {
              throw Response.errorDuplicated('Email đã được sử dụng');
            }
          }

          const role = await roleRepo.findOne({
            where: { id: dto.roleId },
          });
          if (!role) {
            throw Response.errorNotFound('Không tìm thấy vai trò');
          }
          const rawPassword = dto.password ?? '12345678';
          const account = accountRepo.create({
            username: dto.username.trim(),
            password: await bcrypt.hash(rawPassword, 10),
            email: dto.email,
            accountType: AccountType.SO,
            roleId: role.id,
            isActive: dto.isActive ?? true,
            isDeleted: false,
          });
          const savedAccount = await accountRepo.save(account);

          const user = userRepo.create({
            accountId: savedAccount.id,
            fullName: dto.fullName.trim(),
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
            // dateOfBirth: DateUtil.formatBirthday(user.dateOfBirth),
            gender: dto.gender ?? null,
            position: dto.position ?? null,
            address: dto.address ?? null,
            avatar: avatarPath ?? dto.avatarUrl ?? null,
            provinceId,
            wardId,
          });
          await userRepo.save(user);

          return savedAccount.id;
        },
      );
    } catch (error) {
      await this.safeRemoveLocalFile(avatarPath);
      throw error;
    }
    return this.getUserById(createAccount);
  }
}
