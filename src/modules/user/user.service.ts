import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';

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
  async updateUser(accountId: number, dto: UpdateUserDto) {
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

      if (dto.avatarUrl !== undefined) {
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
    return this.getUserById(accountId);
  }

  async createUser(dto: CreateUserDto) {
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
      const ward = await this.locationService.getWardByName(dto.ward);
      if (!ward) {
        throw Response.errorNotFound('Không tìm thấy phường/xã');
      }
      wardId = ward.id;
    }

    const createAccount = await this.accountRepo.manager.transaction(
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
          avatar: dto.avatarUrl ?? null,
          provinceId,
          wardId,
        });
        await userRepo.save(user);

        return savedAccount.id;
      },
    );
    return this.getUserById(createAccount);
  }
}
