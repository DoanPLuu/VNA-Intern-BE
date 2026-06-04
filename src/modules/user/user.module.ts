import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../auth/entities/account.entity';
import { OtpCode } from './entities/otp-code.entity';
import { EmailChangeRequest } from './entities/email-change-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, OtpCode, EmailChangeRequest]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
