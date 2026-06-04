import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { RefreshToken } from '../user/entities/refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { Account } from './entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, Account]),
    UserModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
