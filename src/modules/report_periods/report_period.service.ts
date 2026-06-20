import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'src/common';
import { Repository } from 'typeorm';
import { CreateReportPeriodDto } from './dto/CreateReportPeriodDto';
import { UpdateReportPeriodDto } from './dto/UpdateReportPeriodDto';
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

  async getAllReport() {
    const report = await this.reportRepo.find({
      order: { createdAt: 'ASC' },
    });
    return Response.success(
      report,
      'Lấy danh sách cấu hình báo cáo thành công',
    );
  }
  async getById(reportId: number) {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw Response.errorDuplicated(
        `Không tìm thấy cấu hình báo cáo với id ${reportId}`,
      );
    }

    return Response.success(report, 'Lấy cấu hình báo cáo thành công');
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
}
