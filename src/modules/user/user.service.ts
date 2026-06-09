import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserProfileDto } from './dto/userProfile.dto';
import { Account, AccountType } from '../auth/entities/account.entity';
import { LocationService } from '../location/location.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly locationService: LocationService,
  ) {}

  async findAccountByUsername(username: string): Promise<Account | null> {
    return await this.accountRepository.findOne({ where: { username } });
  }

  async findAccountById(id: number): Promise<Account | null> {
    return this.accountRepository.findOne({ where: { id } });
  }
  async createUserAccount(
    username: string,
    password: string,
  ): Promise<Account | null> {
    const existing = await this.findAccountByUsername(username);
    if (existing) return null;

    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Tạo Account
    const account = this.accountRepository.create({
      username,
      password: passwordHash,
      accountType: AccountType.SO,
    });
    const savedAccount = await this.accountRepository.save(account);
    return savedAccount;
  }

  // ── Cập nhật thông tin cá nhân (SO profile) ─────────────
  async updateUserProfile(dto: UserProfileDto): Promise<Account | null> {
    const account = await this.findAccountByUsername(dto.username);

    if (!account) return null;
    if (dto.email && dto.email !== account.email && account.email !== null) {
      return null;
    }
    if (dto.email) account.email = dto.email;
    if (dto.fullName) account.fullName = dto.fullName;
    if (dto.dateOfBirth) account.dateOfBirth = dto.dateOfBirth;
    if (dto.gender) account.gender = dto.gender;
    if (dto.position) account.position = dto.position;
    if (dto.address) account.address = dto.address;
    if (dto.avatarUrl) account.avatar = dto.avatarUrl;
    // Tìm province và ward theo tên
    if (dto.province) {
      const province = await this.locationService.getProvinceByName(
        dto.province,
      );
      account.provinceId = province?.id ?? null;
    }
    if (dto.ward) {
      const ward = await this.locationService.getWardByName(dto.ward);
      account.wardId = ward?.id ?? null;
    }

    return this.accountRepository.save(account);
  }

  async getUserProfileDetail(username: string): Promise<Account | null> {
    return await this.accountRepository.findOne({
      where: { username },
      relations: { province: true, ward: true, role: true },
    });
  }
}
