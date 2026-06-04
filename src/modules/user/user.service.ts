import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserProfileDto } from './dto/userProfile.dto';
import { Account } from '../auth/entities/account.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
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
    const user = this.userRepository.create({
      account: savedAccount,
    });
    await this.userRepository.save(user);

    return savedAccount;
  }

  // ── Cập nhật thông tin cá nhân (User profile) ─────────────
  async updateUserProfile(
    userProfileDto: UserProfileDto,
  ): Promise<User | null> {
    // Tìm user qua account
    const account = await this.accountRepository.findOne({
      where: { username: userProfileDto.username },
      relations: { user: true },
    });

    if (!account?.user) return null;

    const user = account.user;
    user.fullName = userProfileDto.fullName;
    user.dateOfBirth = userProfileDto.dateOfBirth;
    user.gender = userProfileDto.gender;
    user.title = userProfileDto.title;
    user.provinceId = userProfileDto.provinceId;
    user.districtId = userProfileDto.districtId;
    user.address = userProfileDto.address;
    user.avatarUrl = userProfileDto.avatarUrl;
    const newUser = this.userRepository.create(user);
    return await this.userRepository.save(newUser);
  }

  async getUserProfile(username: string) {
    const account = await this.accountRepository.findOne({
      where: { username },
      relations: { user: true },
    });
    console.log('account=', account);
    if (!account?.user) return null;
    const user = account.user;
    return { ...user };
  }
}
