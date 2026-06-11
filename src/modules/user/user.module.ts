import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../auth/entities/account.entity';
import { User } from './entities/user.entity';
import { OtpCode } from './entities/otp-code.entity';
import { LocationModule } from '../location/location.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, User, RefreshToken, OtpCode]),
    LocationModule,
    JwtModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
