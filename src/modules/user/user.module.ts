import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../auth/entities/account.entity';
import { OtpCode } from './entities/otp-code.entity';
import { LocationModule } from '../location/location.module';
import { RefreshToken } from './entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, RefreshToken, OtpCode]),
    LocationModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
