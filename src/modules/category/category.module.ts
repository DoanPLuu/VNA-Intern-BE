import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profession } from './entities/profession.entity';
import { InjuryFactor } from './entities/injury-factor.entity';
import { InjuryType } from './entities/injury-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profession, InjuryFactor, InjuryType])],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
