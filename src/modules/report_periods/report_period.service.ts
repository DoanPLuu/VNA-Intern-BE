import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'src/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Between, ILike } from 'typeorm/browser';
import { CreateReportPeriodDto } from './dto/CreateReportPeriodDto';
import { QueryReportPeriodDto } from './dto/QueryReportPeriodDto';
import { UpdateReportPeriodDto } from './dto/UpdateReportPeriodDto';
import { UpdateStatus } from './dto/UpdateStatusDto';
import {
  ReportPeriod,
  ReportPeriodStatus,
} from './entities/report_periods.entity';
@Injectable()
export class ReportPeriodService {
  constructor(
    @InjectRepository(ReportPeriod)
    private readonly reportRepo: Repository<ReportPeriod>,
  ) {}

  async getAllReport(query: QueryReportPeriodDto) {
    const {
      page = 1,
      limit = 10,
      name,
      year,
      quarter,
      startDate,
      endDate,
      status,
    } = query;

    const where: FindOptionsWhere<ReportPeriod> = {};

    if (name) {
      where.name = ILike(`%${name}%`);
    }
    if (year) {
      where.year = year;
    }
    if (quarter) {
      where.quarter = quarter;
    }
    if (status) {
      where.status = status;
    }
    if (startDate) {
      where.startDate = startDate;
    }
    if (endDate) {
      where.endDate = endDate;
    }
    // Lọc theo khoảng thời gian nếu có cả startDate và endDate
    if (startDate && endDate) {
      where.startDate = Between(startDate, endDate);
    }

    const [data, total] = await this.reportRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return Response.success(
      {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Lấy danh sách kỳ báo cáo thành công',
    );
  }
  async getById(reportId: number) {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw Response.errorNotFound(
        `Không tìm thấy cấu hình báo cáo với id ${reportId}`,
      );
    }

    return Response.success(report, 'Lấy cấu hình báo cáo thành công');
  }

  async getYears(): Promise<number[]> {
    const rows = await this.reportRepo
      .createQueryBuilder('rp')
      .select('DISTINCT rp.year', 'year')
      .orderBy('rp.year', 'DESC')
      .getRawMany<{ year: number }>();

    return rows.map((r) => r.year);
  }
  async createReportPeriod(dto: CreateReportPeriodDto) {
    const existed = await this.reportRepo.findOne({
      where: {
        year: dto.year,
        quarter: dto.quarter,
      },
    });

    if (existed) {
      throw Response.errorDuplicated('Kỳ báo cáo này đã tồn tại');
    }
    if (dto.startDate > dto.endDate) {
      throw Response.errorBad('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }
    if (dto.dueDate < dto.endDate) {
      throw Response.errorBad(
        'Hạn nộp phải lớn hơn hoặc bằng ngày kết thúc kỳ báo cáo',
      );
    }

    const reportPeriod = this.reportRepo.create({
      name: dto.name,
      year: dto.year,
      quarter: dto.quarter,
      startDate: dto.startDate,
      endDate: dto.endDate,
      dueDate: dto.dueDate,
      status: dto.status ?? ReportPeriodStatus.OPEN,
    });
    await this.reportRepo.save(reportPeriod);
    return Response.success(reportPeriod, 'Thêm cấu hình thành công');
  }
  async updateReportPeriod(id: number, dto: UpdateReportPeriodDto) {
    const reportPeriod = await this.reportRepo.findOne({
      where: { id },
    });

    if (!reportPeriod) {
      throw Response.errorNotFound('Không tìm thấy kỳ báo cáo');
    }

    const year = dto.year ?? reportPeriod.year;
    const quarter = dto.quarter ?? reportPeriod.quarter;

    const existed = await this.reportRepo.findOne({
      where: {
        year,
        quarter,
      },
    });

    if (existed && existed.id !== id) {
      throw Response.errorDuplicated('Kỳ báo cáo này đã tồn tại');
    }

    const startDate = dto.startDate ?? reportPeriod.startDate;
    const endDate = dto.endDate ?? reportPeriod.endDate;
    const dueDate = dto.dueDate ?? reportPeriod.dueDate;

    if (startDate && endDate && startDate >= endDate) {
      throw Response.errorBad('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }

    if (dueDate && endDate && dueDate < endDate) {
      throw Response.errorBad(
        'Hạn nộp phải lớn hơn hoặc bằng ngày kết thúc kỳ báo cáo',
      );
    }

    const updated = await this.reportRepo.save(reportPeriod);

    return Response.success(updated, 'Cập nhật kỳ báo cáo thành công');
  }
  async updateStatus(id: number, dto: UpdateStatus) {
    const data = await this.reportRepo.findOne({
      where: {
        id,
      },
    });
    if (!data) throw Response.errorNotFound('Không tìm thấy kì báo cáo');
    data.status = dto.status ?? data.status;
    const update = await this.reportRepo.save(data);
    return Response.success(update, 'Cập nhật trạng thái thành công');
  }
}
