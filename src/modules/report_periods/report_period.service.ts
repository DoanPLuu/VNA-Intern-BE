import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'src/common';
import { Repository } from 'typeorm';
import { ReportPeriod } from './entities/report_periods.entity';
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
}
