import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjuryFactor } from './entities/injury-factor.entity';
import { Repository } from 'typeorm';
import { InjuryType } from './entities/injury-type.entity';
import { Profession } from './entities/profession.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(InjuryFactor)
    private readonly InjuryFactorRepo: Repository<InjuryFactor>,
    @InjectRepository(InjuryType)
    private readonly InjuryTypeRepo: Repository<InjuryType>,
    @InjectRepository(Profession)
    private readonly ProfessionRepo: Repository<Profession>,
  ) {}
  async getAllInjuryFactor() {
    return await this.InjuryFactorRepo.find({
      where: { status: true },
      select: {
        code: true,
        name: true,
        status: true,
      },
      order: {
        code: 'ASC',
      },
    });
  }
  async getInjuryFactorIdByName(name: string) {
    return await this.InjuryFactorRepo.findOne({ where: { name } });
  }
  async getAllInjuryType() {
    return await this.InjuryTypeRepo.find({
      where: { status: true },
      select: {
        code: true,
        name: true,
        status: true,
      },
      order: {
        code: 'ASC',
      },
    });
  }
  async getInjuryTypeIdByName(name: string) {
    return await this.InjuryTypeRepo.findOne({ where: { name } });
  }
  async getAllProfession() {
    return await this.ProfessionRepo.find({
      where: { status: true },
      select: {
        code: true,
        name: true,
        level: true,
      },
      order: {
        code: 'ASC',
      },
    });
  }
  async getProfessionIdByName(name: string) {
    return await this.ProfessionRepo.findOne({ where: { name } });
  }
}
