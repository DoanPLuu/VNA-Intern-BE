import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjuryFactor } from './entities/injury-factor.entity';
import { Repository } from 'typeorm';
import { InjuryType } from './entities/injury-type.entity';
import { Profession } from './entities/profession.entity';
import { AccidentCause } from './entities/account-cause.entity';
import {
  CreateInjuryFactorDto,
  CreateInjuryTypeDto,
  CreateProfessionDto,
} from './dto/create-category.dto';
import { Response } from 'src/common';

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
      select: {
        id: true,
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
  async createInjuryFactor(dto: CreateInjuryFactorDto) {
    const existing = await this.InjuryFactorRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) throw Response.errorDuplicated(`Mã '${dto.code}' đã tồn tại`);

    const factor = this.InjuryFactorRepo.create({
      code: dto.code,
      name: dto.name,
      status: dto.status ?? true,
    });
    return this.InjuryFactorRepo.save(factor);
  }

  async updateInjuryFactor(id: number, dto: Partial<CreateInjuryFactorDto>) {
    const factor = await this.InjuryFactorRepo.findOne({ where: { id } });
    if (!factor)
      throw Response.errorNotFound('Không tìm thấy yếu tố chấn thương');
    Object.assign(factor, dto);
    return this.InjuryFactorRepo.save(factor);
  }

  async toggleInjuryFactorStatus(id: number) {
    const factor = await this.InjuryFactorRepo.findOne({ where: { id } });
    if (!factor)
      throw Response.errorNotFound('Không tìm thấy yếu tố chấn thương');
    factor.status = !factor.status;
    return this.InjuryFactorRepo.save(factor);
  }

  async getAllInjuryType() {
    return await this.InjuryTypeRepo.find({
      where: { level: 'Cấp 1' },
      select: {
        id: true,
        code: true,
        name: true,
        level: true,
        status: true,
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

  async createInjuryType(dto: CreateInjuryTypeDto) {
    const existing = await this.InjuryTypeRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) throw Response.errorDuplicated(`Mã '${dto.code}' đã tồn tại`);

    // Kiểm tra parent tồn tại
    const parent = await this.InjuryTypeRepo.findOne({
      where: { id: dto.parentId },
    });
    if (!parent)
      throw Response.errorNotFound('Không tìm thấy loại chấn thương cha');

    const injuryType = this.InjuryTypeRepo.create({
      code: dto.code,
      name: dto.name,
      level: 'Cấp 2',
      parentId: dto.parentId,
      status: true,
    });
    return this.InjuryTypeRepo.save(injuryType);
  }

  async updateInjuryType(id: number, dto: Partial<CreateInjuryTypeDto>) {
    const injuryType = await this.InjuryTypeRepo.findOne({ where: { id } });
    if (!injuryType)
      throw Response.errorNotFound('Không tìm thấy loại chấn thương');
    Object.assign(injuryType, dto);
    return this.InjuryTypeRepo.save(injuryType);
  }
  async toggleInjuryTypeStatus(id: number) {
    const injuryType = await this.InjuryTypeRepo.findOne({ where: { id } });
    if (!injuryType)
      throw Response.errorNotFound('Không tìm thấy loại chấn thương');
    injuryType.status = !injuryType.status;
    return this.InjuryTypeRepo.save(injuryType);
  }

  async getAllProfession() {
    return await this.ProfessionRepo.find({
      select: {
        id: true,
        code: true,
        name: true,
        level: true,
        status: true,
      },
      order: {
        code: 'ASC',
      },
    });
  }

  async getAllProfessionForReport() {
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

  async createProfession(dto: CreateProfessionDto) {
    const existing = await this.ProfessionRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) throw Response.errorDuplicated(`Mã '${dto.code}' đã tồn tại`);

    // Xác định level dựa vào parentId
    let level = 'Cấp 1';
    if (dto.parentId) {
      const parent = await this.ProfessionRepo.findOne({
        where: { id: dto.parentId },
      });
      if (!parent)
        throw Response.errorNotFound('Không tìm thấy nghề nghiệp cha');

      const levelMap: Record<string, string> = {
        'Cấp 1': 'Cấp 2',
        'Cấp 2': 'Cấp 3',
        'Cấp 3': 'Cấp 4',
      };
      level = levelMap[parent.level] ?? 'Cấp 4';
    }

    const profession = this.ProfessionRepo.create({
      code: dto.code,
      name: dto.name,
      level,
      parentId: dto.parentId ?? null,
      status: true,
    });
    return this.ProfessionRepo.save(profession);
  }

  async updateProfession(id: number, dto: Partial<CreateProfessionDto>) {
    const profession = await this.ProfessionRepo.findOne({ where: { id } });
    if (!profession) throw Response.errorNotFound('Không tìm thấy nghề nghiệp');
    Object.assign(profession, dto);
    return this.ProfessionRepo.save(profession);
  }

  async toggleProfessionStatus(id: number) {
    const profession = await this.ProfessionRepo.findOne({ where: { id } });
    if (!profession) throw Response.errorNotFound('Không tìm thấy nghề nghiệp');
    profession.status = !profession.status;
    return this.ProfessionRepo.save(profession);
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
