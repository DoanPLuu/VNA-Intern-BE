import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';
import { Account } from '../auth/entities/account.entity';
import { Response } from 'src/common';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  async getAllRoles() {
    const roles = await this.roleRepo.find({
      relations: { permissions: true },
      order: { createdAt: 'ASC' },
    });
    return Response.success(roles, 'Lấy danh sách vai trò thành công');
  }
}
