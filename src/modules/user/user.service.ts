import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Account, AccountType } from '../auth/entities/account.entity';
import { User } from './entities/user.entity';
import { LocationService } from '../location/location.service';
import { UserProfileDto } from './dto/userProfile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly locationService: LocationService,
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
}
