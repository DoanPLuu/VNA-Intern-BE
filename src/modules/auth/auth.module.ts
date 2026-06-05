import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { RefreshToken } from '../user/entities/refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { Account } from './entities/account.entity';
import { SoProfile } from '../so/entities/so-profile.entity';
import { DoanhNghiepProfile } from '../doanh-nghiep/entities/doanh-nghiep-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RefreshToken,
      Account,
      SoProfile,
      DoanhNghiepProfile,
    ]),
    UserModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
