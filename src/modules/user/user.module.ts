import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../auth/entities/account.entity';
import { LocationModule } from '../location/location.module';
import { Role } from '../role/entities/role.entity';
import { RoleModule } from '../role/role.module';
import { EmailChangeSession } from '../user/entities/email-change-session.entity';
import { OtpCode } from './entities/otp-code.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SessionModule } from '../session/session.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      User,
      RefreshToken,
      OtpCode,
      Role,
      EmailChangeSession,
    ]),
    LocationModule,
    RoleModule,
    SessionModule,
    JwtModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
