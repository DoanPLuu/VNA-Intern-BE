import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../auth/entities/account.entity';
import { OtpCode } from './entities/otp-code.entity';
import { SoProfile } from '../so/entities/so-profile.entity';
import { LocationModule } from '../location/location.module';
import { DoanhNghiepProfile } from '../doanh-nghiep/entities/doanh-nghiep-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SoProfile, DoanhNghiepProfile, Account, OtpCode]),
    LocationModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
