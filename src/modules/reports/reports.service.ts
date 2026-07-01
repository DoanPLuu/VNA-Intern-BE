import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'src/common';
import { JwtPayload } from 'src/common/guards/jwt.strategy';
import {
  ReportPeriod,
  ReportPeriodStatus,
} from 'src/modules/report_periods/entities/report_periods.entity';
import { DataSource, FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { AccountType } from '../auth/entities/account.entity';
import { Company } from '../company/entities/company.entity';
import { User } from '../user/entities/user.entity';
import { AccidentDetailDto } from './dto/accident-detail.dto';
import { AccidentStatisticDto } from './dto/accident-statistic.dto';
import { ApproveRejectDto } from './dto/approve-reject.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportDto } from './dto/QueryReportDto';
import { SummaryQueryDto } from './dto/summary-report.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportAccidentDetail } from './entities/report-accident-detail.entity';
import { ReportHistory } from './entities/report-history.entity';
import {
  ReportCategory,
  ReportStatistic,
} from './entities/report-statistic.entity';
import { Report, ReportStatus } from './entities/report.entity';

interface SectionOneRaw {
  businessTypeId: string;
  businessTypeCode: string;
  businessTypeName: string;
  totalCompanies: string;
  totalEmployees: string;
  femaleEmployees: string;
  totalIncidents: string;
  incidentsWithFatalities: string;
  incidentsWithMultipleVictims: string;
  totalVictims: string;
  totalFemaleVictims: string;
  totalFatalities: string;
  totalSevereInjuries: string;
  totalDaysOff: string;
  medicalCosts: string;
  treatmentSalaryCosts: string;
  compensationCosts: string;
  totalCosts: string;
  propertyDamage: string;
}

interface SectionTwoRaw {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  totalIncidents: string;
  incidentsWithFatalities: string;
  incidentsWithMultipleVictims: string;
  totalVictims: string;
  totalFemaleVictims: string;
  totalFatalities: string;
  totalSevereInjuries: string;
  totalDaysOff: string;
  medicalCosts: string;
  treatmentSalaryCosts: string;
  compensationCosts: string;
  totalCosts: string;
  propertyDamage: string;
}

interface CommonStatisticFields {
  total_victims: number;
  total_female_victims: number;
  total_fatalities: number;
  total_seriously_injured: number;
  unmanaged_victims: number;
  unmanaged_female_victims: number;
  unmanaged_fatalities: number;
  unmanaged_seriously_injured: number;
}

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

    @InjectRepository(ReportHistory)
    private readonly reportHistoryRepo: Repository<ReportHistory>,
  ) {}

  async getReportsByYear(year: number, payload: JwtPayload) {
    const where: FindOptionsWhere<Report> = {
      reportPeriod: { year },
    };
    if ((payload.accountType as AccountType) === AccountType.DOANH_NGHIEP) {
      const company = await this.getCompanyByAccountId(payload.sub);
      if (!company) {
        throw Response.errorNotFound('Không tìm thấy công ty');
      }
      where.companyId = company.id;
    }
    const data = await this.reportRepo.find({
      where,
      relations: { reportPeriod: true, company: true },
      order: { createdAt: 'DESC' },
    });

    // if (!data.length)
    //   throw Response.errorNotFound(`Năm ${year} không có kỳ báo cáo nào`);

    return Response.success(data, 'Lấy danh sách báo cáo theo năm thành công');
  }

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
    // // Validate số lượng detail khớp với total_accidents
    // if (dto.general_details.length !== dto.general_statistic.total_accidents)
    //   throw Response.errorBad(
    //     `Số vụ chi tiết TNLĐ (${dto.general_details.length}) phải bằng tổng số vụ (${dto.general_statistic.total_accidents})`,
    //   );
    // if (
    //   dto.subsidized_details.length !== dto.subsidized_statistic.total_accidents
    // )
    //   throw Response.errorBad(
    //     `Số vụ chi tiết TNĐHTC (${dto.subsidized_details.length}) phải bằng tổng số vụ (${dto.subsidized_statistic.total_accidents})`,
    //   );

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
      await manager.save(ReportHistory, {
        reportId: savedReport.id,
        action: 'DRAFT',
        actorName: company.companyName,
      });

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

  // 2. Đính kèm file báo cáo
  async updateAttachment(
    accountId: number,
    reportId: number,
    dto: UpdateAttachmentDto,
  ): Promise<Report> {
    const company = await this.getCompanyByAccountId(accountId);

    const report = await this.reportRepo.findOne({
      where: { id: reportId, companyId: company.id },
    });
    if (!report) {
      throw Response.errorNotFound('Không tìm thấy báo cáo');
    }
    if (report.status === ReportStatus.APPROVED) {
      throw Response.errorBad(
        'Báo cáo đã được duyệt, không thể thay đổi file đính kèm',
      );
    }

    report.attachmentUrl = dto.attachment_url;
    report.attachmentName = dto.attachment_name;
    return this.reportRepo.save(report);
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
    if (![ReportStatus.DRAFT, ReportStatus.REJECTED].includes(report.status)) {
      throw Response.errorBad(
        'Chỉ có thể nộp báo cáo đang ở trạng thái nháp hoặc bị từ chối',
      );
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
    // return this.reportRepo.save(report);
    const savedReport = await this.reportRepo.save(report);

    const history = this.reportHistoryRepo.create({
      reportId: savedReport.id,
      action: 'SUBMITTED',
      actorName: company.companyName,
    });
    await this.reportHistoryRepo.save(history);

    return savedReport;
  }

  // 3. XEM LẠI BÁO CÁO (doanh nghiệp xem báo cáo của mình)
  async getReportById(accountId: number, reportId: number) {
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
        company: {
          businessType: true,
          businessIndustry: true,
          wardDkkd: true,
          provinceDkkd: true,
        },
      },
    });
    if (!report) {
      throw Response.errorNotFound('Không tìm thấy báo cáo');
    }
    return Response.success(report, 'Lấy chi tiết báo cáo thành công');
  }

  async getReportStatus(accountId: number, reportId: number) {
    const company = await this.getCompanyByAccountId(accountId);

    const report = await this.reportRepo.findOne({
      where: { id: reportId, companyId: company.id },
    });
    if (!report) {
      throw Response.errorNotFound('Không tìm thấy báo cáo');
    }

    // Step 3
    let step3: Record<string, unknown> = {
      step: 3,
      title: 'Chờ xét duyệt',
      status: 'wait',
    };
    if (report.status === ReportStatus.APPROVED) {
      step3 = {
        step: 3,
        title: 'Đã phê duyệt',
        status: 'done',
        time: report.approvedAt,
      };
    } else if (report.status === ReportStatus.REJECTED) {
      step3 = {
        step: 3,
        title: 'Bị từ chối',
        status: 'error',
        time: report.approvedAt,
        reason: report.note,
      };
    }

    const timeline = [
      {
        step: 1,
        title: 'Tạo bản nháp',
        status: 'done',
        time: report.createdAt,
      },
      {
        step: 2,
        title: 'Nộp báo cáo',
        status: report.status === ReportStatus.DRAFT ? 'wait' : 'done',
        time: report.status === ReportStatus.DRAFT ? null : report.submittedAt,
      },
      step3,
    ];

    return Response.success(
      { reportId: report.id, currentStatus: report.status, timeline },
      'Lấy tiến trình báo cáo thành công',
    );
  }

  // Service
  async getReportHistory(accountId: number, reportId: number) {
    const company = await this.getCompanyByAccountId(accountId);

    const report = await this.reportRepo.findOne({
      where: { id: reportId, companyId: company.id },
    });
    if (!report) {
      throw Response.errorNotFound('Không tìm thấy báo cáo');
    }

    const histories = await this.reportHistoryRepo.find({
      where: { reportId },
      order: { createdAt: 'ASC' },
    });

    return Response.success(
      {
        reportId: report.id,
        currentStatus: report.status,
        history: histories.map((h) => ({
          action: h.action,
          actorName: h.actorName,
          note: h.note,
          time: h.createdAt,
        })),
      },
      'Lấy lịch sử báo cáo thành công',
    );
  }

  // Private helper dùng nội bộ (e.g. export PDF) — trả thẳng entity
  async fetchReportEntityById(
    accountId: number,
    reportId: number,
    accountType?: string,
  ): Promise<Report> {
    const whereCondition: FindOptionsWhere<Report> = { id: reportId };

    if (accountType !== 'SO') {
      const company = await this.getCompanyByAccountId(accountId);
      whereCondition.companyId = company.id;
    }

    const report = await this.reportRepo.findOne({
      where: whereCondition,
      relations: {
        reportPeriod: true,
        statistics: {
          accidentDetails: {
            accidentCause: true,
            injuryFactor: true,
            profession: true,
          },
        },
        company: {
          businessType: true,
          businessIndustry: true,
          wardDkkd: true,
          provinceDkkd: true,
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
    if (![ReportStatus.DRAFT, ReportStatus.REJECTED].includes(report.status)) {
      throw Response.errorBad(
        'Chỉ có thể chỉnh sửa báo cáo đang ở trạng thái nháp hoặc bị từ chối',
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
    if (report.status === ReportStatus.REJECTED) {
      report.status = ReportStatus.DRAFT;
    }

    // if (dto.general_details.length !== dto.general_statistic.total_accidents) {
    //   throw Response.errorBad(
    //     `Số vụ chi tiết TNLĐ (${dto.general_details.length}) phải bằng tổng số vụ (${dto.general_statistic.total_accidents})`,
    //   );
    // }
    // if (
    //   dto.subsidized_details.length !== dto.subsidized_statistic.total_accidents
    // ) {
    //   throw Response.errorBad(
    //     `Số vụ chi tiết TNĐHTC (${dto.subsidized_details.length}) phải bằng tổng số vụ (${dto.subsidized_statistic.total_accidents})`,
    //   );
    // }

    return this.dataSource.transaction(async (manager) => {
      // Cập nhật thông tin doanh nghiệp snapshot
      await manager.update(Report, report.id, {
        totalEmployees: dto.company_info.total_employees,
        totalFemaleEmployees: dto.company_info.total_female_employees,
        totalSalaryFund: dto.company_info.total_salary_fund,
        ...(report.status === ReportStatus.REJECTED && {
          status: ReportStatus.DRAFT,
        }),
      });
      // report.totalEmployees = dto.company_info.total_employees;
      // report.totalFemaleEmployees = dto.company_info.total_female_employees;
      // report.totalSalaryFund = dto.company_info.total_salary_fund;
      // await manager.save(report);

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

      return manager.findOne(Report, {
        where: { id: report.id },
      }) as Promise<Report>;
    });
  }
  // Preview lại báo cáo trước khi submitted
  async previewReport(accountId: number, reportId: number): Promise<Report> {
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

    if (!report) throw Response.errorNotFound('Không tìm thấy báo cáo');
    if (report.status !== ReportStatus.DRAFT)
      throw Response.errorBad(
        'Chỉ có thể xem trước báo cáo đang ở trạng thái nháp',
      );

    return report;
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
  private validateStatisticDto(dto: CommonStatisticFields, label: string) {
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
    // if (dto.total_fatal_accidents > dto.total_accidents)
    //   throw Response.errorBad(
    //     `[${label}] Số vụ có người chết không được lớn hơn tổng số vụ`,
    //   );
    // if (dto.total_accidents_with_two_or_more_victims > dto.total_accidents)
    //   throw Response.errorBad(
    //     `[${label}] Số vụ có 2 người bị nạn trở lên không được lớn hơn tổng số vụ`,
    //   );
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
      totalIncidents: 1, // Mỗi dòng chi tiết đại diện cho đúng 1 vụ tai nạn
      incidentsWithFatalities: dto.total_fatalities > 0 ? 1 : 0, // 1 vụ có người chết nếu số người chết > 0
      incidentsWithMultipleVictims: dto.total_victims >= 2 ? 1 : 0, // 1 vụ có từ 2 người bị nạn trở lên nếu số nạn nhân >= 2
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

  //so//

  async getAllReport(query: QueryReportDto) {
    const {
      page = 1,
      limit = 10,
      companyName,
      taxCode,
      reportPeriodId,
      year,
      status,
    } = query;

    const where: FindOptionsWhere<Report> = {};

    if (companyName) {
      where.company = { companyName: ILike(`%${companyName}%`) };
    }
    if (taxCode) {
      where.company = {
        ...(where.company as object),
        taxCode: ILike(`%${taxCode}%`),
      };
    }
    if (reportPeriodId) {
      where.reportPeriodId = reportPeriodId;
    }
    if (year) {
      where.reportPeriod = { year };
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.reportRepo.findAndCount({
      where,
      relations: {
        company: {
          businessType: true,
          businessIndustry: true,
          wardDkkd: true,
          provinceDkkd: true,
        },
        reportPeriod: true,
      },
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
      'Lấy danh sách báo cáo thành công',
    );
  }
  async getReportByIdForSo(reportId: number) {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: {
        // company: true,
        company: {
          businessType: true,
          businessIndustry: true,
          wardDkkd: true,
          provinceDkkd: true,
        },
        reportPeriod: true,
        statistics: {
          accidentDetails: {
            accidentCause: true,
            injuryFactor: true,
            profession: true,
          },
        },
        approver: true,
      },
    });
    if (!report) {
      throw Response.errorNotFound('Không tìm thấy báo cáo');
    }
    return Response.success(report, 'Lấy chi tiết báo cáo thành công');
  }

  // Sở duyệt nhiều báo cáo
  async approveReports(
    approverAccountId: number,
    dto: ApproveRejectDto,
  ): Promise<object> {
    const reports = await this.reportRepo.find({
      where: { id: In(dto.reportIds) },
    });

    // Kiểm tra tất cả ID có tồn tại không
    if (reports.length !== dto.reportIds.length) {
      throw Response.errorNotFound('Một hoặc nhiều báo cáo không tồn tại');
    }

    // Chỉ duyệt được báo cáo ở trạng thái SUBMITTED
    const invalidReports = reports.filter(
      (r) => r.status !== ReportStatus.SUBMITTED,
    );
    if (invalidReports.length > 0) {
      throw Response.errorBad(
        `Các báo cáo sau không ở trạng thái chờ duyệt: ${invalidReports.map((r) => r.id).join(', ')}`,
      );
    }

    const now = new Date();
    await this.reportRepo.update(
      { id: In(dto.reportIds) },
      {
        status: ReportStatus.APPROVED,
        approvedBy: approverAccountId,
        approvedAt: now,
        note: null,
      },
    );
    const approverUser = await this.dataSource
      .getRepository(User)
      .findOne({ where: { accountId: approverAccountId } });
    const approverName = approverUser?.fullName || 'Cán bộ Sở';
    const histories = dto.reportIds.map((id) =>
      this.reportHistoryRepo.create({
        reportId: id,
        action: 'APPROVED',
        actorName: approverName,
      }),
    );

    await this.reportHistoryRepo.save(histories);
    return Response.success(
      { approvedIds: dto.reportIds },
      `Đã duyệt ${dto.reportIds.length} báo cáo thành công`,
    );
  }

  // Sở từ chối nhiều báo cáo
  async rejectReports(
    approverAccountId: number,
    dto: ApproveRejectDto,
  ): Promise<object> {
    if (!dto.note || dto.note.trim() === '') {
      throw Response.errorBad('Lý do từ chối không được để trống');
    }

    const reports = await this.reportRepo.find({
      where: { id: In(dto.reportIds) },
    });

    if (reports.length !== dto.reportIds.length) {
      throw Response.errorNotFound('Một hoặc nhiều báo cáo không tồn tại');
    }

    const invalidReports = reports.filter(
      (r) => r.status !== ReportStatus.SUBMITTED,
    );
    if (invalidReports.length > 0) {
      throw Response.errorBad(
        `Các báo cáo sau không ở trạng thái chờ duyệt: ${invalidReports.map((r) => r.id).join(', ')}`,
      );
    }

    await this.reportRepo.update(
      { id: In(dto.reportIds) },
      {
        status: ReportStatus.REJECTED,
        approvedBy: approverAccountId,
        approvedAt: new Date(),
        note: dto.note.trim(),
      },
    );
    const approverUser = await this.dataSource
      .getRepository(User)
      .findOne({ where: { accountId: approverAccountId } });
    const rejectReason = dto.note ? dto.note.trim() : '';
    const approverName = approverUser?.fullName || 'Cán bộ Sở';
    const histories = dto.reportIds.map((id) =>
      this.reportHistoryRepo.create({
        reportId: id,
        action: 'REJECTED',
        actorName: approverName,
        note: rejectReason,
      }),
    );
    await this.reportHistoryRepo.save(histories);
    return Response.success(
      { rejectedIds: dto.reportIds },
      `Đã từ chối ${dto.reportIds.length} báo cáo`,
    );
  }
  async getReportTimeline(reportId: number) {
    const histories = await this.reportHistoryRepo.find({
      where: { reportId: reportId },
      order: { createdAt: 'DESC' },
    });

    const timeline = histories.map((history) => {
      let title = '';
      if (history.action === 'SUBMITTED')
        title = `${history.actorName} đã gửi báo cáo`;
      if (history.action === 'APPROVED')
        title = `${history.actorName} đã duyệt báo cáo`;
      if (history.action === 'REJECTED')
        title = `${history.actorName} từ chối báo cáo`;

      return {
        time: history.createdAt,
        title: title,
        reason: history.note,
        type: history.action,
      };
    });

    return Response.success({ timeline }, 'Lấy tiến độ xử lý thành công');
  }
  async getSummaryReport(query: SummaryQueryDto) {
    const { reportPeriodId, year, provinceId } = query;
    if (!reportPeriodId && !year) {
      throw Response.errorBad('Vui lòng chọn kỳ báo cáo hoặc năm báo cáo');
    }

    // if (!reportPeriodId) {
    //   throw Response.errorBad('Vui lòng chọn kỳ báo cáo');
    // }

    // ─── PHẦN I: Tổng hợp theo loại hình cơ sở ───────────────────────────
    const sectionOneQb = this.reportRepo
      .createQueryBuilder('r')
      .innerJoin('r.company', 'c')
      .innerJoin('c.businessType', 'bt')
      .innerJoin('r.statistics', 'rs', "rs.reportCategory = 'GENERAL'")
      .andWhere('r.status IN (:...statuses)', {
        statuses: ['SUBMITTED', 'APPROVED'],
      });

    // Lọc theo kỳ CỤ THỂ hoặc theo NĂM (gộp các kỳ trong năm đó)
    if (reportPeriodId) {
      sectionOneQb.andWhere('r.reportPeriodId = :reportPeriodId', {
        reportPeriodId,
      });
    } else if (year) {
      sectionOneQb
        .innerJoin('r.reportPeriod', 'rp')
        .andWhere('rp.year = :year', { year });
    }

    // Lọc theo TỈNH THÀNH (nếu có)
    if (provinceId) {
      sectionOneQb.andWhere('c."province_dkkd_id" = :provinceId', {
        provinceId,
      });
      // hoặc nếu là quan hệ: .innerJoin('c.provinceDkkd', 'pv').andWhere('pv.id = :provinceId', { provinceId })
    }
    const sectionOneRaw = await sectionOneQb

      .select([
        'bt.id                                   AS "businessTypeId"',
        'bt.code                                 AS "businessTypeCode"',
        'bt.name                                 AS "businessTypeName"',
        'COUNT(DISTINCT r.id)                    AS "totalCompanies"',
        'SUM(r."total_employees")               AS "totalEmployees"',
        'SUM(r."total_female_employees")        AS "femaleEmployees"',
        'SUM(rs."total_incidents")              AS "totalIncidents"',
        'SUM(rs."incidents_with_fatalities")    AS "incidentsWithFatalities"',
        'SUM(rs."incidents_with_multiple_victims") AS "incidentsWithMultipleVictims"',
        'SUM(rs."total_victims")                AS "totalVictims"',
        'SUM(rs."total_female_victims")         AS "totalFemaleVictims"',
        'SUM(rs."total_fatalities")             AS "totalFatalities"',
        'SUM(rs."total_severe_injuries")        AS "totalSevereInjuries"',
        'SUM(rs."total_days_off")               AS "totalDaysOff"',
        'SUM(rs."medical_costs")                AS "medicalCosts"',
        'SUM(rs."treatment_salary_costs")       AS "treatmentSalaryCosts"',
        'SUM(rs."compensation_costs")           AS "compensationCosts"',
        'SUM(rs."total_costs")                  AS "totalCosts"',
        'SUM(rs."property_damage")              AS "propertyDamage"',
      ])
      .groupBy('bt.id')
      .addGroupBy('bt.code')
      .addGroupBy('bt.name')
      .orderBy('bt.code', 'ASC')
      .getRawMany<SectionOneRaw>();

    // Map + tính thêm KTNLĐ và KChết
    const sectionOneRows = sectionOneRaw.map((row) => {
      const totalEmployees = Number(row.totalEmployees) || 0;
      const totalIncidents = Number(row.totalIncidents) || 0;
      const totalFatalities = Number(row.totalFatalities) || 0;
      return {
        businessTypeId: row.businessTypeId,
        businessTypeCode: row.businessTypeCode,
        businessTypeName: row.businessTypeName,
        totalCompanies: Number(row.totalCompanies) || 0,
        totalEmployees,
        femaleEmployees: Number(row.femaleEmployees) || 0,
        totalIncidents,
        incidentsWithFatalities: Number(row.incidentsWithFatalities) || 0,
        incidentsWithMultipleVictims:
          Number(row.incidentsWithMultipleVictims) || 0,
        totalVictims: Number(row.totalVictims) || 0,
        totalFemaleVictims: Number(row.totalFemaleVictims) || 0,
        totalFatalities,
        totalSevereInjuries: Number(row.totalSevereInjuries) || 0,
        totalDaysOff: Number(row.totalDaysOff) || 0,
        medicalCosts: Number(row.medicalCosts) || 0,
        treatmentSalaryCosts: Number(row.treatmentSalaryCosts) || 0,
        compensationCosts: Number(row.compensationCosts) || 0,
        totalCosts: Number(row.totalCosts) || 0,
        propertyDamage: Number(row.propertyDamage) || 0,
        // Tần suất tai nạn lao động
        ktnld:
          totalEmployees > 0
            ? Math.round((totalIncidents / totalEmployees) * 1000 * 100) / 100
            : 0,
        kChet:
          totalEmployees > 0
            ? Math.round((totalFatalities / totalEmployees) * 1000 * 100) / 100
            : 0,
      };
    });

    // Dòng TỔNG SỐ của Phần I
    const sectionOneTotal = sectionOneRows.reduce(
      (acc, row) => ({
        businessTypeCode: 'TOTAL',
        businessTypeName: 'Tổng số',
        totalCompanies: acc.totalCompanies + row.totalCompanies,
        totalEmployees: acc.totalEmployees + row.totalEmployees,
        femaleEmployees: acc.femaleEmployees + row.femaleEmployees,
        totalIncidents: acc.totalIncidents + row.totalIncidents,
        incidentsWithFatalities:
          acc.incidentsWithFatalities + row.incidentsWithFatalities,
        incidentsWithMultipleVictims:
          acc.incidentsWithMultipleVictims + row.incidentsWithMultipleVictims,
        totalVictims: acc.totalVictims + row.totalVictims,
        totalFemaleVictims: acc.totalFemaleVictims + row.totalFemaleVictims,
        totalFatalities: acc.totalFatalities + row.totalFatalities,
        totalSevereInjuries: acc.totalSevereInjuries + row.totalSevereInjuries,
        totalDaysOff: acc.totalDaysOff + row.totalDaysOff,
        medicalCosts: acc.medicalCosts + row.medicalCosts,
        treatmentSalaryCosts:
          acc.treatmentSalaryCosts + row.treatmentSalaryCosts,
        compensationCosts: acc.compensationCosts + row.compensationCosts,
        totalCosts: acc.totalCosts + row.totalCosts,
        propertyDamage: acc.propertyDamage + row.propertyDamage,
        ktnld: 0,
        kChet: 0,
      }),
      {
        businessTypeCode: 'TOTAL',
        businessTypeName: 'Tổng số',
        totalCompanies: 0,
        totalEmployees: 0,
        femaleEmployees: 0,
        totalIncidents: 0,
        incidentsWithFatalities: 0,
        incidentsWithMultipleVictims: 0,
        totalVictims: 0,
        totalFemaleVictims: 0,
        totalFatalities: 0,
        totalSevereInjuries: 0,
        totalDaysOff: 0,
        medicalCosts: 0,
        treatmentSalaryCosts: 0,
        compensationCosts: 0,
        totalCosts: 0,
        propertyDamage: 0,
        ktnld: 0,
        kChet: 0,
      },
    );
    // Tính lại KTNLĐ, KChết cho dòng tổng
    sectionOneTotal.ktnld =
      sectionOneTotal.totalEmployees > 0
        ? Math.round(
            (sectionOneTotal.totalIncidents / sectionOneTotal.totalEmployees) *
              1000 *
              100,
          ) / 100
        : 0;
    sectionOneTotal.kChet =
      sectionOneTotal.totalEmployees > 0
        ? Math.round(
            (sectionOneTotal.totalFatalities / sectionOneTotal.totalEmployees) *
              1000 *
              100,
          ) / 100
        : 0;

    // ─── PHẦN II: Hàm helper tổng hợp theo danh mục ─────────────────────
    const buildSectionTwoByField = async (
      groupField: 'accidentCauseId' | 'injuryFactorId' | 'professionId',
      joinTable: string,
      joinAlias: string,
    ) => {
      const columnMap: Record<string, string> = {
        professionId: 'profession_id',
        accidentCauseId: 'accident_cause_id',
        injuryFactorId: 'injury_factor_id',
      };
      // const raw = await this.reportAccidentDetailRepo
      //   .createQueryBuilder('d')
      //   .innerJoin('d.reportStatistic', 'rs')
      //   .innerJoin('rs.report', 'r')
      //   .leftJoin(`d.${joinAlias}`, 'cat')
      //   .where('r.reportPeriodId = :reportPeriodId', { reportPeriodId })
      //   .andWhere('r.status IN (:...statuses)', {
      //     statuses: ['SUBMITTED', 'APPROVED'],
      //   })
      //   .andWhere(`d."${columnMap[groupField]}" IS NOT NULL`)
      //   .andWhere('cat.status = true')
      const qb = this.reportAccidentDetailRepo
        .createQueryBuilder('d')
        .innerJoin('d.reportStatistic', 'rs')
        .innerJoin('rs.report', 'r')
        .innerJoin('r.company', 'c')
        .leftJoin(`d.${joinAlias}`, 'cat')
        .andWhere('r.status IN (:...statuses)', {
          statuses: ['SUBMITTED', 'APPROVED'],
        })
        .andWhere(`d."${columnMap[groupField]}" IS NOT NULL`)
        .andWhere('cat.status = true');
      if (reportPeriodId) {
        qb.andWhere('r.reportPeriodId = :reportPeriodId', { reportPeriodId });
      } else if (year) {
        qb.innerJoin('r.reportPeriod', 'rp').andWhere('rp.year = :year', {
          year,
        });
      }

      // Lọc theo TỈNH THÀNH
      if (provinceId) {
        qb.andWhere('c."province_dkkd_id" = :provinceId', { provinceId });
      }
      const raw = await qb

        .select([
          'cat.id                                       AS "categoryId"',
          'cat.code                                     AS "categoryCode"',
          'cat.name                                     AS "categoryName"',
          'SUM(d."total_incidents")                    AS "totalIncidents"',
          'SUM(d."incidents_with_fatalities")          AS "incidentsWithFatalities"',
          'SUM(d."incidents_with_multiple_victims")    AS "incidentsWithMultipleVictims"',
          'SUM(d."total_victims")                      AS "totalVictims"',
          'SUM(d."total_female_victims")               AS "totalFemaleVictims"',
          'SUM(d."total_fatalities")                   AS "totalFatalities"',
          'SUM(d."total_severe_injuries")              AS "totalSevereInjuries"',
          'SUM(d."total_days_off")                     AS "totalDaysOff"',
          'SUM(d."medical_costs")                      AS "medicalCosts"',
          'SUM(d."treatment_salary_costs")             AS "treatmentSalaryCosts"',
          'SUM(d."compensation_costs")                 AS "compensationCosts"',
          'SUM(d."total_costs")                        AS "totalCosts"',
          'SUM(d."property_damage")                    AS "propertyDamage"',
        ])
        .groupBy('cat.id')
        .addGroupBy('cat.code')
        .addGroupBy('cat.name')
        .orderBy('cat.code', 'ASC')
        .getRawMany<SectionTwoRaw>();

      return raw.map((row) => ({
        categoryId: row.categoryId,
        categoryCode: row.categoryCode,
        categoryName: row.categoryName,
        totalIncidents: Number(row.totalIncidents) || 0,
        incidentsWithFatalities: Number(row.incidentsWithFatalities) || 0,
        incidentsWithMultipleVictims:
          Number(row.incidentsWithMultipleVictims) || 0,
        totalVictims: Number(row.totalVictims) || 0,
        totalFemaleVictims: Number(row.totalFemaleVictims) || 0,
        totalFatalities: Number(row.totalFatalities) || 0,
        totalSevereInjuries: Number(row.totalSevereInjuries) || 0,
        totalDaysOff: Number(row.totalDaysOff) || 0,
        medicalCosts: Number(row.medicalCosts) || 0,
        treatmentSalaryCosts: Number(row.treatmentSalaryCosts) || 0,
        compensationCosts: Number(row.compensationCosts) || 0,
        totalCosts: Number(row.totalCosts) || 0,
        propertyDamage: Number(row.propertyDamage) || 0,
      }));
    };

    // Chạy song song 3 nhóm của Phần II
    const [byProfession, byAccidentCause, byInjuryFactor] = await Promise.all([
      buildSectionTwoByField('professionId', 'professions', 'profession'),
      buildSectionTwoByField(
        'accidentCauseId',
        'accident_causes',
        'accidentCause',
      ),
      buildSectionTwoByField(
        'injuryFactorId',
        'injury_factors',
        'injuryFactor',
      ),
    ]);

    return Response.success(
      {
        sectionOne: {
          total: sectionOneTotal,
          rows: sectionOneRows,
        },
        sectionTwo: {
          byProfession,
          byAccidentCause,
          byInjuryFactor,
        },
      },
      'Lấy báo cáo tổng hợp thành công',
    );
  }
}
