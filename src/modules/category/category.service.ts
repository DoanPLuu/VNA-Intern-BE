import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjuryFactor } from './entities/injury-factor.entity';
import { Repository } from 'typeorm';
import { InjuryType } from './entities/injury-type.entity';
import { Profession } from './entities/profession.entity';
import { AccidentCause } from './entities/account-cause.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(InjuryFactor)
    private readonly InjuryFactorRepo: Repository<InjuryFactor>,
    @InjectRepository(InjuryType)
    private readonly InjuryTypeRepo: Repository<InjuryType>,
    @InjectRepository(Profession)
    private readonly ProfessionRepo: Repository<Profession>,
    @InjectRepository(AccidentCause)
    private readonly AccidentCauseRepo: Repository<AccidentCause>,
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
  async getInjuryFactorById(id: number) {
    return this.InjuryFactorRepo.findOne({ where: { id } });
  }
  async getAllInjuryType() {
    return await this.InjuryTypeRepo.find({
      where: { status: true, level: 'Cấp 1' },
      select: {
        id: true,
        code: true,
        name: true,
        level: true,
      },
      relations: { children: true },
      order: {
        code: 'ASC',
      },
    });
  }
  async getInjuryTypeIdByName(name: string) {
    return await this.InjuryTypeRepo.findOne({ where: { name } });
  }
  async getInjuryTypeById(id: number) {
    return this.InjuryTypeRepo.findOne({ where: { id } });
  }
  async getAllProfession() {
    return await this.ProfessionRepo.find({
      where: { status: true, level: 'Cấp 4' },
      select: {
        id: true,
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
  async getProfessionById(id: number) {
    return this.ProfessionRepo.findOne({ where: { id } });
  }
  async getAllAccidentCause() {
    return this.AccidentCauseRepo.find({
      where: { status: true },
      select: { id: true, code: true, name: true, causeGroup: true },
      order: { code: 'ASC' },
    });
  }

  async getAccidentCauseByName(name: string) {
    return this.AccidentCauseRepo.findOne({ where: { name } });
  }
  async getAccidentCauseById(id: number) {
    return this.AccidentCauseRepo.findOne({ where: { id } });
  }
}
