import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { Company } from './entities/company.entity';
import { BusinessIndustry } from './entities/business-industry.entity';
import { BusinessType } from './entities/business-type.entity';
import { Account } from '../auth/entities/account.entity';
import { LocationModule } from '../location/location.module';
import { OtpCode } from '../user/entities/otp-code.entity';
import { MailService } from 'src/common/mail/mail.service';
import { JwtModule } from '@nestjs/jwt';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      BusinessIndustry,
      BusinessType,
      Account,
      OtpCode,
    ]),
    SessionModule,
    LocationModule,
    JwtModule.register({}),
  ],
  controllers: [CompanyController],
  providers: [CompanyService, MailService],
  exports: [CompanyService],
})
export class CompanyModule {}
