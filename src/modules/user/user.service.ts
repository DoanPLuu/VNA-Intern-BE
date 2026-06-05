import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserProfileDto } from './dto/userProfile.dto';
import { Account } from '../auth/entities/account.entity';
import { SoProfile } from '../so/entities/so-profile.entity';
import { LocationService } from '../location/location.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(SoProfile)
    private readonly soProfileRepository: Repository<SoProfile>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly locationService: LocationService,
  ) {}

  // ── Tìm account theo username (dùng cho auth) ─────────────
  async findAccountByUsername(username: string): Promise<Account | null> {
    return await this.accountRepository.findOne({ where: { username } });
  }

  // ── Tạo account + user profile cùng lúc ──────────────────
  async createUserAccount(
    username: string,
    password: string,
  ): Promise<Account | null> {
    const existing = await this.findAccountByUsername(username);
    if (existing) return null;

    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Tạo Account trước
    const account = this.accountRepository.create({
      username,
      password: passwordHash,
    });
    const savedAccount = await this.accountRepository.save(account);

    // 2. Tạo User profile liên kết với Account
    const soProfile = this.soProfileRepository.create({
      account: savedAccount,
    });
    await this.soProfileRepository.save(soProfile);

    return savedAccount;
  }

  // ── Cập nhật thông tin cá nhân (SO profile) ─────────────
  async updateUserProfile(dto: UserProfileDto): Promise<SoProfile | null> {
    // Tìm user qua account
    const account = await this.findAccountByUsername(dto.username);

    if (!account) return null;

    let soProfile = account.soProfile;

    if (!soProfile) {
      soProfile = this.soProfileRepository.create({ accountId: account.id });
    }
    // Cập nhật email trên soProfile
    if (dto.email) soProfile.email = dto.email;
    if (dto.fullName) soProfile.fullName = dto.fullName;
    if (dto.dateOfBirth) soProfile.dateOfBirth = dto.dateOfBirth;
    if (dto.gender) soProfile.gender = dto.gender;
    if (dto.title) soProfile.title = dto.title;
    if (dto.address) soProfile.address = dto.address;
    if (dto.avatarUrl) soProfile.avatarUrl = dto.avatarUrl;
    // Tìm province và ward theo tên
    if (dto.province) {
      const province = await this.locationService.getProvinceByName(
        dto.province,
      );
      soProfile.provinceId = province?.id ?? null;
    }
    if (dto.ward) {
      const ward = await this.locationService.getWardByName(dto.ward);
      soProfile.wardId = ward?.id ?? null;
    }

    return this.soProfileRepository.save(soProfile);
  }

  async getUserProfile(username: string): Promise<SoProfile | null> {
    const account = await this.findAccountByUsername(username);
    if (!account?.soProfile) return null;
    return account.soProfile;
  }
}
