import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from './entities/province.entity';
import { Ward } from './entities/ward.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepo: Repository<Province>,
    @InjectRepository(Ward)
    private readonly wardRepo: Repository<Ward>,
  ) {}

  // Lấy tất cả tỉnh/TP
  async getProvinces(): Promise<Province[]> {
    return this.provinceRepo.find({ order: { name: 'ASC' } });
  }

  // Lấy tất cả phường/xã theo tỉnh
  async getWardsByProvince(provinceId: number): Promise<Ward[]> {
    return this.wardRepo.find({
      where: { provinceId },
      order: { name: 'ASC' },
    });
  }

  // Tìm tỉnh theo id
  async getProvinceById(id: number): Promise<Province | null> {
    return this.provinceRepo.findOne({ where: { id } });
  }

  // Tìm phường/xã theo id
  async getWardById(id: number): Promise<Ward | null> {
    return this.wardRepo.findOne({ where: { id } });
  }

  // Tìm phường/xã theo tên
  async getWardByName(name: string): Promise<Ward | null> {
    if (!name) return null;
    return this.wardRepo
      .createQueryBuilder('w')
      .where('LOWER(w.name) LIKE LOWER(:name)', { name: `%${name.trim()}%` })
      .getOne();
  }

  // Tìm tỉnh theo tên
  async getProvinceByName(name: string): Promise<Province | null> {
    if (!name) return null;

    return this.provinceRepo
      .createQueryBuilder('p')
      .where('LOWER(p.name) LIKE LOWER(:name)', {
        name: `%${name.trim()}%`,
      })
      .getOne();
  }
  //bonus
  async getWardByNameAndProvince(
    name: string,
    provinceId: number,
  ): Promise<Ward | null> {
    if (!name || !provinceId) return null;

    return this.wardRepo
      .createQueryBuilder('w')
      .where('LOWER(w.name) LIKE LOWER(:name)', {
        name: `%${name.trim()}%`,
      })
      .andWhere('w.provinceId = :provinceId', { provinceId })
      .getOne();
  }
}
