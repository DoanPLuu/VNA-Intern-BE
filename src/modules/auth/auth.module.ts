import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MailService } from 'src/common/mail/mail.service';
import { OtpCode } from '../user/entities/otp-code.entity';
import { RefreshToken } from '../user/entities/refresh-token.entity';

import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Account } from './entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, Account, OtpCode]),
    UserModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService],
})
export class AuthModule {}
