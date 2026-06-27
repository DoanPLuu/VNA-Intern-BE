import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Docxtemplater from 'docxtemplater';
import * as fs from 'fs';
import * as path from 'path';
import PizZip from 'pizzip';
import { ReportPeriod } from 'src/modules/report_periods/entities/report_periods.entity';
import { Repository } from 'typeorm';
import { SummaryQueryDto } from './dto/summary-report.dto';
import { ReportsService } from './reports.service';

// ── Định nghĩa type cho data trả về từ getSummaryReport ──────
interface SectionOneRow {
  businessTypeId: number;
  businessTypeCode: string;
  businessTypeName: string;
  totalCompanies: number;
  totalEmployees: number;
  femaleEmployees: number;
  totalIncidents: number;
  incidentsWithFatalities: number;
  incidentsWithMultipleVictims: number;
  totalVictims: number;
  totalFemaleVictims: number;
  totalFatalities: number;
  totalSevereInjuries: number;
  totalDaysOff: number;
  medicalCosts: number;
  treatmentSalaryCosts: number;
  compensationCosts: number;
  totalCosts: number;
  propertyDamage: number;
  ktnld: number;
  kChet: number;
}

interface SectionTwoRow {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  totalIncidents: number;
  incidentsWithFatalities: number;
  incidentsWithMultipleVictims: number;
  totalVictims: number;
  totalFemaleVictims: number;
  totalFatalities: number;
  totalSevereInjuries: number;
  totalDaysOff: number;
  medicalCosts: number;
  treatmentSalaryCosts: number;
  compensationCosts: number;
  totalCosts: number;
  propertyDamage: number;
}

interface SummaryData {
  sectionOne: {
    total: SectionOneRow;
    rows: SectionOneRow[];
  };
  sectionTwo: {
    byProfession: SectionTwoRow[];
    byAccidentCause: SectionTwoRow[];
    byInjuryFactor: SectionTwoRow[];
  };
}

@Injectable()
export class ReportDocxService {
  constructor(
    private readonly reportsService: ReportsService,
    @InjectRepository(ReportPeriod)
    private readonly reportPeriodRepo: Repository<ReportPeriod>,
  ) {}

  async exportSummaryDocx(query: SummaryQueryDto): Promise<Buffer> {
    // 1. Lấy data tổng hợp — ép kiểu để tránh any
    const result = await this.reportsService.getSummaryReport(query);
    const data = (result as { data: SummaryData }).data;

    // 2. Lấy thông tin kỳ báo cáo
    const period = await this.reportPeriodRepo.findOne({
      where: { id: query.reportPeriodId },
    });

    // 3. Format số tiền
    const fmt = (value: number): string =>
      value ? value.toLocaleString('vi-VN') : '0';

    // 4. Map section two rows (dùng chung cho 3 nhóm)
    const mapSectionTwo = (rows: SectionTwoRow[]) =>
      rows.map((row, i) => ({
        stt: i + 1,
        categoryName: row.categoryName,
        totalIncidents: row.totalIncidents,
        incidentsWithFatalities: row.incidentsWithFatalities,
        incidentsWithMultiple: row.incidentsWithMultipleVictims,
        totalVictims: row.totalVictims,
        totalFemaleVictims: row.totalFemaleVictims,
        totalFatalities: row.totalFatalities,
        totalSevereInjuries: row.totalSevereInjuries,
        totalDaysOff: row.totalDaysOff,
        medicalCosts: fmt(row.medicalCosts),
        treatmentSalaryCosts: fmt(row.treatmentSalaryCosts),
        compensationCosts: fmt(row.compensationCosts),
        totalCosts: fmt(row.totalCosts),
        propertyDamage: fmt(row.propertyDamage),
      }));

    // 5. Build template data
    const { total, rows } = data.sectionOne;
    const templateData = {
      periodName: period?.name ?? '',
      year: period?.year ?? new Date().getFullYear(),
      reportDate: new Date().toLocaleDateString('vi-VN'),

      // Dòng tổng
      t_totalCompanies: total.totalCompanies,
      t_totalEmployees: total.totalEmployees,
      t_femaleEmployees: total.femaleEmployees,
      t_totalIncidents: total.totalIncidents,
      t_incidentsWithFatalities: total.incidentsWithFatalities,
      t_incidentsWithMultiple: total.incidentsWithMultipleVictims,
      t_totalVictims: total.totalVictims,
      t_totalFemaleVictims: total.totalFemaleVictims,
      t_totalFatalities: total.totalFatalities,
      t_totalSevereInjuries: total.totalSevereInjuries,
      t_totalDaysOff: total.totalDaysOff,
      t_medicalCosts: fmt(total.medicalCosts),
      t_treatmentSalaryCosts: fmt(total.treatmentSalaryCosts),
      t_compensationCosts: fmt(total.compensationCosts),
      t_totalCosts: fmt(total.totalCosts),
      t_propertyDamage: fmt(total.propertyDamage),
      t_ktnld: total.ktnld,
      t_kChet: total.kChet,

      // Phần I - Bảng theo loại hình DN
      sectionOneRows: rows.map((row, i) => ({
        stt: i + 1,
        businessTypeName: row.businessTypeName,
        totalCompanies: row.totalCompanies,
        totalEmployees: row.totalEmployees,
        femaleEmployees: row.femaleEmployees,
        totalIncidents: row.totalIncidents,
        incidentsWithFatalities: row.incidentsWithFatalities,
        incidentsWithMultiple: row.incidentsWithMultipleVictims,
        totalVictims: row.totalVictims,
        totalFemaleVictims: row.totalFemaleVictims,
        totalFatalities: row.totalFatalities,
        totalSevereInjuries: row.totalSevereInjuries,
        totalDaysOff: row.totalDaysOff,
        medicalCosts: fmt(row.medicalCosts),
        treatmentSalaryCosts: fmt(row.treatmentSalaryCosts),
        compensationCosts: fmt(row.compensationCosts),
        totalCosts: fmt(row.totalCosts),
        propertyDamage: fmt(row.propertyDamage),
        ktnld: row.ktnld,
        kChet: row.kChet,
      })),

      // Phần II
      byProfession: mapSectionTwo(data.sectionTwo.byProfession),
      byAccidentCause: mapSectionTwo(data.sectionTwo.byAccidentCause),
      byInjuryFactor: mapSectionTwo(data.sectionTwo.byInjuryFactor),
    };

    // 6. Đọc template
    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'bao-cao-tong-hop.docx',
    );
    const content: string = fs.readFileSync(templatePath, 'binary');

    // 7. Render
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(templateData);

    // 8. Xuất Buffer
    const buf: Buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buf;
  }
}
