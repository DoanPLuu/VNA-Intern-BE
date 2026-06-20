import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  ReportCategory,
  ReportStatistic,
} from './entities/report-statistic.entity';
import { Report, ReportStatus } from './entities/report.entity';
import { ReportAccidentDetail } from './entities/report-accident-detail.entity';
import {
  ReportPeriod,
  ReportPeriodStatus,
} from 'src/modules/report_periods/entities/report_periods.entity';
import { Company } from '../company/entities/company.entity';
import { Response } from 'src/common';
import { AccidentStatisticDto } from './dto/accident-statistic.dto';
import { AccidentDetailDto } from './dto/accident-detail.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,

    @InjectRepository(ReportStatistic)
    private readonly reportStatisticRepo: Repository<ReportStatistic>,

    @InjectRepository(ReportAccidentDetail)
    private readonly reportAccidentDetailRepo: Repository<ReportAccidentDetail>,

    @InjectRepository(ReportPeriod)
    private readonly reportPeriodRepo: Repository<ReportPeriod>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,

    private readonly dataSource: DataSource,
  ) {}
  // 1. Tạo báo cáo mới (DRAFT)
  async createReport(accountId: number, dto: CreateReportDto): Promise<Report> {
    const company = await this.getCompanyByAccountId(accountId);
    const period = await this.reportPeriodRepo.findOne({
      where: { id: dto.report_period_id },
    });
    if (!period) throw Response.errorNotFound('Kỳ báo cáo không tồn tại');
    if (period.status === ReportPeriodStatus.CLOSED)
      throw Response.errorBad('Kỳ báo cáo đã đóng, không thể nộp báo cáo');
    // Kiểm tra công ty đã có báo cáo cho kỳ này chưa
    const existing = await this.reportRepo.findOne({
      where: { companyId: company.id, reportPeriodId: dto.report_period_id },
    });
    if (existing)
      throw Response.errorBad('Doanh nghiệp đã có báo cáo cho kỳ báo cáo này');
    this.validateStatisticDto(dto.general_statistic, 'TNLĐ chung');
    this.validateStatisticDto(dto.subsidized_statistic, 'TNLĐ hưởng trợ cấp');
    dto.general_details.forEach((d, i) =>
      this.validateStatisticDto(d, `Chi tiết vụ TNLĐ số ${i + 1}`),
    );
    dto.subsidized_details.forEach((d, i) =>
      this.validateStatisticDto(d, `Chi tiết vụ TNĐHTC số ${i + 1}`),
    );
    // Validate số lượng detail khớp với total_accidents
    if (dto.general_details.length !== dto.general_statistic.total_accidents)
      throw Response.errorBad(
        `Số vụ chi tiết TNLĐ (${dto.general_details.length}) phải bằng tổng số vụ (${dto.general_statistic.total_accidents})`,
      );
    if (
      dto.subsidized_details.length !== dto.subsidized_statistic.total_accidents
    )
      throw Response.errorBad(
        `Số vụ chi tiết TNĐHTC (${dto.subsidized_details.length}) phải bằng tổng số vụ (${dto.subsidized_statistic.total_accidents})`,
      );
    // Dùng transaction để đảm bảo toàn vẹn dữ liệu
    return this.dataSource.transaction(async (manager) => {
      // 1. Tạo Report
      const report = manager.create(Report, {
        companyId: company.id,
        reportPeriodId: dto.report_period_id,
        status: ReportStatus.DRAFT,
        totalEmployees: dto.company_info.total_employees,
        totalFemaleEmployees: dto.company_info.total_female_employees,
        totalSalaryFund: dto.company_info.total_salary_fund,
      });
      const savedReport = await manager.save(report);

      // 2. Tạo ReportStatistic cho TNLĐ chung
      const generalStatistic = this.mapToStatistic(
        dto.general_statistic,
        savedReport.id,
        ReportCategory.GENERAL,
      );
      const savedGeneralStatistic = await manager.save(
        ReportStatistic,
        generalStatistic,
      );

      // 3. Tạo ReportStatistic cho TNĐHTC
      const subsidizedStatistic = this.mapToStatistic(
        dto.subsidized_statistic,
        savedReport.id,
        ReportCategory.SUBSIDIZED,
      );
      const savedSubsidizedStatistic = await manager.save(
        ReportStatistic,
        subsidizedStatistic,
      );

      // 4. Tạo ReportAccidentDetail cho từng vụ TNLĐ chung
      const generalDetails = dto.general_details.map((d) =>
        this.mapToDetail(d, savedGeneralStatistic.id),
      );
      await manager.save(ReportAccidentDetail, generalDetails);

      // 5. Tạo ReportAccidentDetail cho từng vụ TNĐHTC
      const subsidizedDetails = dto.subsidized_details.map((d) =>
        this.mapToDetail(d, savedSubsidizedStatistic.id),
      );
      await manager.save(ReportAccidentDetail, subsidizedDetails);

      return savedReport;
    });
  }

  // 2. Nộp Báo Cáo (DRAFT -> SUBMITTED)
  async submitReport(accountId: number, reportId: number): Promise<Report> {
    const company = await this.getCompanyByAccountId(accountId);

    const report = await this.reportRepo.findOne({
      where: { id: reportId, companyId: company.id },
    });
    if (!report) {
      throw Response.errorNotFound('Không tìm thấy báo cáo');
    }
    if (report.status !== ReportStatus.DRAFT) {
      throw Response.errorBad('Chỉ có thể nộp báo cáo đang ở trạng thái nháp');
    }

    // Kiểm tra kỳ báo cáo chưa đóng
    const period = await this.reportPeriodRepo.findOne({
      where: { id: report.reportPeriodId },
    });
    if (!period) {
      throw Response.errorNotFound('Không tìm thấy kỳ báo cáo');
    }
    if (period.status === ReportPeriodStatus.CLOSED) {
      throw Response.errorBad('Kỳ báo cáo đã đóng, không thể nộp');
    }

    report.status = ReportStatus.SUBMITTED;
    report.submittedAt = new Date();
    return this.reportRepo.save(report);
  }

  // 3. XEM LẠI BÁO CÁO (doanh nghiệp xem báo cáo của mình)
  async getReportById(accountId: number, reportId: number): Promise<Report> {
    const company = await this.getCompanyByAccountId(accountId);

    const report = await this.reportRepo.findOne({
      where: { id: reportId, companyId: company.id },
      relations: {
        reportPeriod: true,
        statistics: {
          accidentDetails: {
            accidentCause: true,
            injuryFactor: true,
            profession: true,
          },
        },
      },
    });
    if (!report) {
      throw Response.errorNotFound('Không tìm thấy báo cáo');
    }
    return report;
  }

  // 4. DANH SÁCH BÁO CÁO CỦA DOANH NGHIỆP
  async getMyReports(accountId: number): Promise<Report[]> {
    const company = await this.getCompanyByAccountId(accountId);

    return this.reportRepo.find({
      where: { companyId: company.id },
      relations: { reportPeriod: true },
      order: { createdAt: 'DESC' },
    });
  }

  // 5. CẬP NHẬT BÁO CÁO (chỉ khi còn DRAFT)
  async updateReport(
    accountId: number,
    reportId: number,
    dto: UpdateReportDto,
  ): Promise<Report> {
    const company = await this.getCompanyByAccountId(accountId);

    const report = await this.reportRepo.findOne({
      where: { id: reportId, companyId: company.id },
    });
    if (!report) {
      throw Response.errorNotFound('Không tìm thấy báo cáo');
    }
    if (report.status !== ReportStatus.DRAFT) {
      throw Response.errorBad(
        'Chỉ có thể chỉnh sửa báo cáo đang ở trạng thái nháp',
      );
    }

    // Validate
    this.validateStatisticDto(dto.general_statistic, 'TNLĐ chung');
    this.validateStatisticDto(dto.subsidized_statistic, 'TNLĐ hưởng trợ cấp');
    dto.general_details.forEach((d, i) =>
      this.validateStatisticDto(d, `Chi tiết vụ TNLĐ số ${i + 1}`),
    );
    dto.subsidized_details.forEach((d, i) =>
      this.validateStatisticDto(d, `Chi tiết vụ TNĐHTC số ${i + 1}`),
    );

    if (dto.general_details.length !== dto.general_statistic.total_accidents) {
      throw Response.errorBad(
        `Số vụ chi tiết TNLĐ (${dto.general_details.length}) phải bằng tổng số vụ (${dto.general_statistic.total_accidents})`,
      );
    }
    if (
      dto.subsidized_details.length !== dto.subsidized_statistic.total_accidents
    ) {
      throw Response.errorBad(
        `Số vụ chi tiết TNĐHTC (${dto.subsidized_details.length}) phải bằng tổng số vụ (${dto.subsidized_statistic.total_accidents})`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Cập nhật thông tin doanh nghiệp snapshot
      report.totalEmployees = dto.company_info.total_employees;
      report.totalFemaleEmployees = dto.company_info.total_female_employees;
      report.totalSalaryFund = dto.company_info.total_salary_fund;
      await manager.save(report);

      // Xóa toàn bộ statistic + detail cũ rồi tạo lại
      // (đơn giản hơn update từng dòng vì số lượng detail có thể thay đổi)
      const oldStatistics = await manager.find(ReportStatistic, {
        where: { reportId: report.id },
      });
      if (oldStatistics.length > 0) {
        const oldStatisticIds = oldStatistics.map((s) => s.id);
        await manager.delete(ReportAccidentDetail, {
          reportStatisticId: In(oldStatisticIds),
        });
        await manager.delete(ReportStatistic, { reportId: report.id });
      }

      // Tạo lại statistic + detail mới
      const generalStatistic = this.mapToStatistic(
        dto.general_statistic,
        report.id,
        ReportCategory.GENERAL,
      );
      const savedGeneral = await manager.save(
        ReportStatistic,
        generalStatistic,
      );

      const subsidizedStatistic = this.mapToStatistic(
        dto.subsidized_statistic,
        report.id,
        ReportCategory.SUBSIDIZED,
      );
      const savedSubsidized = await manager.save(
        ReportStatistic,
        subsidizedStatistic,
      );

      await manager.save(
        ReportAccidentDetail,
        dto.general_details.map((d) => this.mapToDetail(d, savedGeneral.id)),
      );
      await manager.save(
        ReportAccidentDetail,
        dto.subsidized_details.map((d) =>
          this.mapToDetail(d, savedSubsidized.id),
        ),
      );

      return report;
    });
  }

  //-------Private Helper------------
  private async getCompanyByAccountId(accountId: number): Promise<Company> {
    const company = await this.companyRepo.findOne({
      where: { account: { id: accountId } },
      relations: { account: true },
    });
    if (!company)
      throw Response.errorNotFound(
        'Không tìm thấy doanh nghiệp của tài khoản này',
      );
    return company;
  }
  private validateStatisticDto(dto: AccidentStatisticDto, label: string) {
    if (dto.total_female_victims > dto.total_victims)
      throw Response.errorBad(
        `[${label}] Số lao động nữ bị tai nạn không được lơn hơn tổng số người bị nạn`,
      );
    if (dto.total_fatalities > dto.total_victims)
      throw Response.errorBad(
        `[${label}] Số người bị thương nặng không được lớn hơn tổng số người bị nạn`,
      );
    if (dto.unmanaged_victims > dto.total_victims)
      throw Response.errorBad(
        `[${label}] Số người bị nạn không quản lý không được lớn hơn tổng số người bị nạn`,
      );
    if (dto.unmanaged_female_victims > dto.total_female_victims)
      throw Response.errorBad(
        `[${label}] ố lao động nữ không quản lý không được lớn hơn tổng số lao động nữ bị nạn`,
      );
    if (dto.unmanaged_fatalities > dto.total_fatalities)
      throw Response.errorBad(
        `[${label}] Số người chết không quản lý không được lớn hơn tổng số người chết`,
      );
    if (dto.unmanaged_seriously_injured > dto.total_seriously_injured)
      throw Response.errorBad(
        `[${label}] Số người bị thương nặng không quản lý không được lớn hơn tổng số người bị thương nặng`,
      );
    if (dto.total_fatal_accidents > dto.total_accidents)
      throw Response.errorBad(
        `[${label}] Số vụ có người chết không được lớn hơn tổng số vụ`,
      );
    if (dto.total_accidents_with_two_or_more_victims > dto.total_accidents)
      throw Response.errorBad(
        `[${label}] Số vụ có 2 người bị nạn trở lên không được lớn hơn tổng số vụ`,
      );
  }

  // Map DTO -> ReportStatistic entity
  private mapToStatistic(
    dto: AccidentStatisticDto,
    reportId: number,
    category: ReportCategory,
  ): ReportStatistic {
    const statistic = this.reportStatisticRepo.create({
      reportId,
      reportCategory: category,
      totalIncidents: dto.total_accidents,
      incidentsWithFatalities: dto.total_fatal_accidents,
      incidentsWithMultipleVictims:
        dto.total_accidents_with_two_or_more_victims,
      totalVictims: dto.total_victims,
      totalFemaleVictims: dto.total_female_victims,
      totalFatalities: dto.total_fatalities,
      totalSevereInjuries: dto.total_seriously_injured,
      unmanagedVictims: dto.unmanaged_victims,
      unmanagedFemaleVictims: dto.unmanaged_female_victims,
      unmanagedFatalities: dto.unmanaged_fatalities,
      unmanagedSevereInjuries: dto.unmanaged_seriously_injured,
      medicalCosts: dto.medical_expenses,
      treatmentSalaryCosts: dto.salary_paid_during_treatment,
      compensationCosts: dto.compensation_expenses,
      totalCosts:
        dto.medical_expenses +
        dto.salary_paid_during_treatment +
        dto.compensation_expenses,
      totalDaysOff: dto.total_leave_days,
      propertyDamage: dto.property_damage_expenses,
    });
    return statistic;
  }
  // Map DTO -> ReportAccidentDetail entity
  private mapToDetail(
    dto: AccidentDetailDto,
    statisticId: number,
  ): ReportAccidentDetail {
    return this.reportAccidentDetailRepo.create({
      reportStatisticId: statisticId,
      accidentCauseId: dto.accident_cause_id,
      injuryFactorId: dto.injury_factor_id,
      professionId: dto.profession_id,
      totalIncidents: dto.total_accidents,
      incidentsWithFatalities: dto.total_fatal_accidents,
      incidentsWithMultipleVictims:
        dto.total_accidents_with_two_or_more_victims,
      totalVictims: dto.total_victims,
      totalFemaleVictims: dto.total_female_victims,
      totalFatalities: dto.total_fatalities,
      totalSevereInjuries: dto.total_seriously_injured,
      unmanagedVictims: dto.unmanaged_victims,
      unmanagedFemaleVictims: dto.unmanaged_female_victims,
      unmanagedFatalities: dto.unmanaged_fatalities,
      unmanagedSevereInjuries: dto.unmanaged_seriously_injured,
      medicalCosts: dto.medical_expenses,
      treatmentSalaryCosts: dto.salary_paid_during_treatment,
      compensationCosts: dto.compensation_expenses,
      totalCosts:
        dto.medical_expenses +
        dto.salary_paid_during_treatment +
        dto.compensation_expenses,
      totalDaysOff: dto.total_leave_days,
      propertyDamage: dto.property_damage_expenses,
    });
  }
}
