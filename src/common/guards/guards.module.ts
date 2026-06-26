import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/modules/auth/entities/account.entity';
import { JwtAuthGuard } from './jwt.auth.guard';
import { JwtStrategy } from './jwt.strategy';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([Account]),
  ],
  providers: [
    JwtAuthGuard,
    JwtStrategy, // ← Đăng ký để Passport biết đến strategy 'jwt'
  ],
  exports: [JwtAuthGuard],
})
export class GuardsModule {}
