import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../auth/entities/account.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { SessionService } from './session.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account, RefreshToken])],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
