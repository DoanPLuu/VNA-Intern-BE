import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MailService } from 'src/common/mail/mail.service';
import { OtpCode } from '../user/entities/otp-code.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

import { CompanyModule } from '../company/company.module';
import { Role } from '../role/entities/role.entity';
import { EmailChangeSession } from '../user/entities/email-change-session.entity';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Account } from './entities/account.entity';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RefreshToken,
      Account,
      OtpCode,
      User,
      EmailChangeSession,
      Role,
    ]),
    UserModule,
    CompanyModule,
    SessionModule,

    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService],
})
export class AuthModule {}
