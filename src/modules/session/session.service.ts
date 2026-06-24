import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../auth/entities/account.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async invalidateAccountSessions(accountId: number): Promise<void> {
    await this.accountRepo.increment({ id: accountId }, 'tokenVersion', 1);
    await this.refreshTokenRepo.update(
      { accountId, isRevoked: false },
      { isRevoked: true },
    );
  }
}
