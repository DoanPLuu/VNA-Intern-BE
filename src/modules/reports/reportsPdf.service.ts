import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Report } from './entities/report.entity';
import {
  ReportCategory,
  ReportStatistic,
} from './entities/report-statistic.entity';
import { ReportAccidentDetail } from './entities/report-accident-detail.entity';
import { CategoryService } from '../category/category.service';
import {
  AccidentCause,
  AccidentCauseGroup,
} from '../category/entities/account-cause.entity';

@Injectable()
export class ReportPdfService {
  constructor(private readonly categoryService: CategoryService) {}

  async generatePdf(report: Report): Promise<Buffer> {
    const allCauses = await this.categoryService.getAllAccidentCause();
    const html = this.buildHtml(report, allCauses);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private buildHtml(report: Report, allCauses: AccidentCause[]): string {
    const general = report.statistics?.find(
      (s) => s.reportCategory === ReportCategory.GENERAL,
    );
    const subsidized = report.statistics?.find(
      (s) => s.reportCategory === ReportCategory.SUBSIDIZED,
    );

    const period = report.reportPeriod;
    const periodLabel = period?.quarter != null ? '6 tháng đầu năm' : 'Cả năm';
    const total = this.sumStatistics(general, subsidized);
    const generalDetails = general?.accidentDetails ?? [];

    const causeStatMap = this.buildCauseStatMap(generalDetails);
    const injuryRows = this.groupByCategory(generalDetails, 'injuryFactor');
    const professionRows = this.groupByCategory(generalDetails, 'profession');

    const employerCauses = allCauses.filter(
      (c) => c.causeGroup === AccidentCauseGroup.EMPLOYER,
    );
    const employeeCauses = allCauses.filter(
      (c) => c.causeGroup === AccidentCauseGroup.EMPLOYEE,
    );

    const reportDate = report.submittedAt
      ? new Date(report.submittedAt).toLocaleDateString('vi-VN')
      : '...........';

    const totalDaysOff =
      this.toNum(general?.totalDaysOff) + this.toNum(subsidized?.totalDaysOff);
    const totalCosts =
      this.toNum(general?.totalCosts) + this.toNum(subsidized?.totalCosts);
    const totalMedical =
      this.toNum(general?.medicalCosts) + this.toNum(subsidized?.medicalCosts);
    const totalTreatment =
      this.toNum(general?.treatmentSalaryCosts) +
      this.toNum(subsidized?.treatmentSalaryCosts);
    const totalCompensation =
      this.toNum(general?.compensationCosts) +
      this.toNum(subsidized?.compensationCosts);
    const totalProperty =
      this.toNum(general?.propertyDamage) +
      this.toNum(subsidized?.propertyDamage);

    // Tổng số cột = 2 (label + maso) + 13 data = 15 cột
    const COLS = 13;

    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Times New Roman", serif; font-size: 8pt; color: #000; }

  .page-title { text-align: center; margin-bottom: 3px; }
  .page-title h2 { font-size: 9pt; font-weight: bold; text-transform: uppercase; }
  .page-title p { font-size: 8pt; font-style: italic; }

  .info-block { margin: 5px 0; font-size: 8pt; line-height: 1.5; }
  .report-title { text-align: center; font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 4px 0 2px; }
  .report-sub { text-align: center; font-size: 8pt; }

  table { width: 100%; border-collapse: collapse; font-size: 7pt; table-layout: fixed; }
  th, td {
    border: 1px solid #000;
    padding: 2px 3px;
    vertical-align: middle;
    text-align: center;
    word-wrap: break-word;
    overflow: hidden;
  }
  td.left { text-align: left; }
  thead th { background: #d9d9d9; font-weight: bold; }
  tr.section-header td {
    background: #e8e8e8;
    font-weight: bold;
    text-align: left;
    padding-left: 4px;
  }
  tr.sub-section td {
    font-weight: bold;
    text-align: left;
    padding-left: 10px;
    background: #f5f5f5;
  }
  tr.total-row td { font-weight: bold; background: #f0f0f0; }
  .mt { margin-top: 6px; }
</style>
</head>
<body>

<div class="page-title">
  <h2>PHỤ LỤC XII</h2>
  <h2>MẪU BÁO CÁO TỔNG HỢP TÌNH HÌNH TAI NẠN LAO ĐỘNG CẤP CƠ SỞ (6 THÁNG HOẶC CẢ NĂM)</h2>
  <p>(Kèm theo Nghị định số 39/2016/NĐ-CP ngày 15 tháng 5 năm 2016 của Chính phủ)</p>
</div>

<div class="info-block">
  <div>Đơn vị báo cáo: ${report.company?.companyName ?? ''}</div>
  <div>Địa chỉ: ${[report.company?.addressDkkd, report.company?.provinceDkkd?.name, report.company?.wardDkkd?.name].filter(Boolean).join(', ')}&nbsp;&nbsp;&nbsp;&nbsp;Mã huyện, quận: ${report.company?.wardDkkd?.code ?? ''}</div>
  <div class="report-title">BÁO CÁO TỔNG HỢP TÌNH HÌNH TAI NẠN LAO ĐỘNG</div>
  <div class="report-sub">Kỳ báo cáo (${periodLabel}) năm ${period?.year ?? ''}</div>
  <div class="report-sub">Ngày báo cáo: ${reportDate}</div>
  <div style="margin-top:4px">Thuộc loại hình cơ sở (doanh nghiệp): ${report.company?.businessType?.name ?? ''}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Mã loại hình: ${report.company?.businessType?.code ?? ''}</div>
  <div>Đơn vị nhận báo cáo: Sở Lao động - Thương binh và Xã hội.</div>
  <div>Lĩnh vực sản xuất chính của cơ sở: ${report.company?.businessIndustry?.name ?? ''}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Mã lĩnh vực: ${report.company?.businessIndustry?.code ?? ''}</div>
  <div>Tổng số lao động của cơ sở: <b>${report.totalEmployees ?? 0}</b> người, trong đó nữ: <b>${report.totalFemaleEmployees ?? 0}</b> người</div>
  <div>Tổng quỹ lương: <b>${this.num(this.toNum(report.totalSalaryFund))}</b> triệu đồng</div>
</div>

<!-- PHẦN I: 13 cột = label(24%) + maso(4%) + 11 cột data -->
<table>
  <colgroup>
    <col style="width:32.5%"/>
    <col style="width:4%"/>
    <col style="width:4.5%"/>
    <col style="width:4.5%"/>
    <col style="width:4.5%"/>
    <col style="width:6.25%"/>
    <col style="width:6.25%"/>
    <col style="width:6.25%"/>
    <col style="width:6.25%"/>
    <col style="width:6.25%"/>
    <col style="width:6.25%"/>
    <col style="width:6.25%"/>
    <col style="width:6.25%"/>
  </colgroup>
  <thead>
    <tr>
      <th rowspan="4">Tên chỉ tiêu thống kê</th>
      <th rowspan="4">Mã số</th>
      <th colspan="13">Phân loại TNLĐ theo mức độ thương tật</th>
    </tr>
    <tr>
      <th colspan="3">Số vụ (Vụ)</th>
      <th colspan="10">Số người bị nạn (Người)</th>
    </tr>
    <tr>
      <th rowspan="2">Tổng số</th>
      <th rowspan="2">Số vụ có người chết</th>
      <th rowspan="2">Số vụ có từ 2 người bị nạn trở lên</th>
      <th colspan="2">Tổng số</th>
      <th colspan="2">Số LĐ nữ</th>
      <th colspan="2">Số người bị chết</th>
      <th colspan="2">Số người bị thương nặng</th>
    </tr>
    <tr>
      <th>Tổng số</th><th>NN không thuộc quyền quản lý</th>
      <th>Tổng số</th><th>NN không thuộc quyền quản lý</th>
      <th>Tổng số</th><th>NN không thuộc quyền quản lý</th>
      <th>Tổng số</th><th>NN không thuộc quyền quản lý</th>
    </tr>
    <tr>
      ${Array.from({ length: COLS }, (_, i) => `<th>${i + 1}</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    <tr class="section-header"><td colspan="${COLS}">I. Tình hình chung tai nạn lao động</td></tr>
    <tr class="section-header"><td colspan="${COLS}">1. Tai nạn lao động</td></tr>
    ${this.dataRow('Tai nạn lao động', '1', general)}

    <tr class="section-header"><td colspan="${COLS}">1.1. Phân theo nguyên nhân xảy ra TNLĐ</td></tr>
    <tr class="sub-section"><td colspan="${COLS}">a. Do người sử dụng lao động</td></tr>
    ${employerCauses.map((c) => this.dataRow(c.name, c.code, causeStatMap.get(c.id))).join('')}

    <tr class="sub-section"><td colspan="${COLS}">b. Do người lao động</td></tr>
    ${employeeCauses.map((c) => this.dataRow(c.name, c.code, causeStatMap.get(c.id))).join('')}

    <tr class="section-header"><td colspan="${COLS}">1.2. Phân theo yếu tố gây chấn thương</td></tr>
    ${injuryRows.map((r) => this.dataRow(r.name, r.code, r.stat)).join('')}

    <tr class="section-header"><td colspan="${COLS}">1.3. Phân theo nghề nghiệp</td></tr>
    ${professionRows.map((r) => this.dataRow(r.name, r.code, r.stat)).join('')}

    <tr class="section-header"><td colspan="${COLS}">2. Tai nạn được hưởng trợ cấp theo quy định tại Khoản 2 Điều 39 Luật ATVSLĐ</td></tr>
    ${this.dataRow('', '10', subsidized)}

    <tr class="section-header"><td colspan="${COLS}">3. Tổng số (3=1+2)</td></tr>
    ${this.dataRow('Tổng số (3=1+2)', '', total, true)}
  </tbody>
</table>

<!-- PHẦN II: 6 cột cố định -->
<table class="mt">
  <colgroup>
    <col style="width:20%"/>
    <col style="width:16%"/>
    <col style="width:16%"/>
    <col style="width:16%"/>
    <col style="width:16%"/>
    <col style="width:16%"/>
  </colgroup>
  <thead>
    <tr>
      <th colspan="6" style="text-align:left; padding-left:4px; background:#e8e8e8; font-weight:bold">II. Thiệt hại do tai nạn lao động</th>
    </tr>
    <tr>
      <th rowspan="3">Tổng số ngày nghỉ vì tai nạn lao động<br>(kể cả ngày nghỉ chế độ)</th>
      <th colspan="4">Chi phí tính bằng tiền (1.000 đ)</th>
      <th rowspan="3">Thiệt hại tài sản (1.000 đ)</th>
    </tr>
    <tr>
      <th rowspan="2">Tổng số</th>
      <th colspan="3">Khoản chi cụ thể của cơ sở</th>
    </tr>
    <tr>
      <th>Y tế</th>
      <th>Trả lương trong thời gian Điều trị</th>
      <th>Bồi thường / Trợ cấp</th>
    </tr>
    <tr><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>${this.num(totalDaysOff)}</td>
      <td>${this.num(totalCosts)}</td>
      <td>${this.num(totalMedical)}</td>
      <td>${this.num(totalTreatment)}</td>
      <td>${this.num(totalCompensation)}</td>
      <td>${this.num(totalProperty)}</td>
    </tr>
  </tbody>
</table>


<!-- Ký tên -->
<div class="mt" style="width:100%; overflow:hidden;">
  <div style="width:100%; text-align:center; font-weight:bold; font-size:9pt; padding: 8px 0 4px;">
    ĐẠI DIỆN NGƯỜI SỬ DỤNG LAO ĐỘNG<br>
    <span style="font-weight:normal; font-style:italic; font-size:8pt;">(Ký, ghi rõ họ tên, chức vụ, đóng dấu)</span>
  </div>
  <div style="clear:both; height:60px;"></div>
</div>

<hr style="border:none; border-top:1px solid #000; margin:4px 0;"/>

<!-- Footnotes -->
<div style="font-size:7pt; line-height:1.6; margin-top:4px;">
  <div><sup>1</sup> Ghi mã số theo Danh Mục đơn vị hành chính do Thủ tướng Chính phủ ban hành theo quy định của Luật Thống kê.</div>
  <div><sup>2</sup> Ghi tên, mã số theo danh Mục và mã số các đơn vị kinh tế, hành chính sự nghiệp theo quy định pháp luật hiện hành trong báo cáo thống kê.</div>
  <div><sup>3</sup> Ghi tên ngành, mã ngành theo Hệ thống ngành kinh tế do Thủ tướng Chính phủ ban hành theo quy định của Luật Thống kê.</div>
  <div><sup>4</sup> Ghi 01 nguyên nhân chính gây tai nạn lao động.</div>
  <div><sup>5</sup> Ghi tên và mã số theo danh Mục yếu tố gây chấn thương.</div>
  <div><sup>6</sup> Ghi tên và mã số nghề nghiệp theo danh Mục nghề nghiệp do Thủ tướng Chính phủ ban hành theo quy định của Luật Thống kê.</div>
</div>

</body>
</html>`;
  }

  // ─── Helper: convert decimal string từ TypeORM về number ───────────────
  private toNum(val: number | string | null | undefined): number {
    if (val === null || val === undefined) return 0;
    const n = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(n) ? 0 : n;
  }

  // ─── Helper: format số dấu chấm phân cách nghìn ────────────────────────
  private num(val: number | null | undefined): string {
    const n = this.toNum(val);
    if (n === 0) return '0';
    return n.toLocaleString('de-DE');
  }

  // ─── Helper: render một dòng data (13 cột data) ────────────────────────
  private dataRow(
    label: string,
    maso: string,
    stat: Partial<ReportStatistic> | null | undefined,
    isTotalRow = false,
  ): string {
    const s = stat ?? {};
    const cls = isTotalRow ? 'total-row' : '';
    return `<tr class="${cls}">
      <td class="left">${label}</td>
      <td>${maso}</td>
      <td>${this.num(s.totalIncidents)}</td>
      <td>${this.num(s.incidentsWithFatalities)}</td>
      <td>${this.num(s.incidentsWithMultipleVictims)}</td>
      <td>${this.num(s.totalVictims)}</td>
      <td>${this.num(s.unmanagedVictims)}</td>
      <td>${this.num(s.totalFemaleVictims)}</td>
      <td>${this.num(s.unmanagedFemaleVictims)}</td>
      <td>${this.num(s.totalFatalities)}</td>
      <td>${this.num(s.unmanagedFatalities)}</td>
      <td>${this.num(s.totalSevereInjuries)}</td>
      <td>${this.num(s.unmanagedSevereInjuries)}</td>
    </tr>`;
  }

  // ─── Helper: build map causeId -> stat ─────────────────────────────────
  private buildCauseStatMap(
    details: ReportAccidentDetail[],
  ): Map<number, Partial<ReportStatistic>> {
    const map = new Map<number, Partial<ReportStatistic>>();

    for (const d of details) {
      if (!d.accidentCause) continue;
      const id = d.accidentCause.id;

      if (!map.has(id)) {
        map.set(id, {
          totalIncidents: 0,
          incidentsWithFatalities: 0,
          incidentsWithMultipleVictims: 0,
          totalVictims: 0,
          unmanagedVictims: 0,
          totalFemaleVictims: 0,
          unmanagedFemaleVictims: 0,
          totalFatalities: 0,
          unmanagedFatalities: 0,
          totalSevereInjuries: 0,
          unmanagedSevereInjuries: 0,
          propertyDamage: 0,
          totalDaysOff: 0,
        });
      }

      const s = map.get(id)!;
      s.totalIncidents! += d.totalIncidents ?? 0;
      s.incidentsWithFatalities! += d.incidentsWithFatalities ?? 0;
      s.incidentsWithMultipleVictims! += d.incidentsWithMultipleVictims ?? 0;
      s.totalVictims! += d.totalVictims ?? 0;
      s.unmanagedVictims! += d.unmanagedVictims ?? 0;
      s.totalFemaleVictims! += d.totalFemaleVictims ?? 0;
      s.unmanagedFemaleVictims! += d.unmanagedFemaleVictims ?? 0;
      s.totalFatalities! += d.totalFatalities ?? 0;
      s.unmanagedFatalities! += d.unmanagedFatalities ?? 0;
      s.totalSevereInjuries! += d.totalSevereInjuries ?? 0;
      s.unmanagedSevereInjuries! += d.unmanagedSevereInjuries ?? 0;
      s.propertyDamage! += this.toNum(d.propertyDamage);
      s.totalDaysOff! += d.totalDaysOff ?? 0;
    }

    return map;
  }

  // ─── Helper: tổng general + subsidized ─────────────────────────────────
  private sumStatistics(
    a: ReportStatistic | undefined,
    b: ReportStatistic | undefined,
  ): Partial<ReportStatistic> {
    return {
      totalIncidents: (a?.totalIncidents ?? 0) + (b?.totalIncidents ?? 0),
      incidentsWithFatalities:
        (a?.incidentsWithFatalities ?? 0) + (b?.incidentsWithFatalities ?? 0),
      incidentsWithMultipleVictims:
        (a?.incidentsWithMultipleVictims ?? 0) +
        (b?.incidentsWithMultipleVictims ?? 0),
      totalVictims: (a?.totalVictims ?? 0) + (b?.totalVictims ?? 0),
      unmanagedVictims: (a?.unmanagedVictims ?? 0) + (b?.unmanagedVictims ?? 0),
      totalFemaleVictims:
        (a?.totalFemaleVictims ?? 0) + (b?.totalFemaleVictims ?? 0),
      unmanagedFemaleVictims:
        (a?.unmanagedFemaleVictims ?? 0) + (b?.unmanagedFemaleVictims ?? 0),
      totalFatalities: (a?.totalFatalities ?? 0) + (b?.totalFatalities ?? 0),
      unmanagedFatalities:
        (a?.unmanagedFatalities ?? 0) + (b?.unmanagedFatalities ?? 0),
      totalSevereInjuries:
        (a?.totalSevereInjuries ?? 0) + (b?.totalSevereInjuries ?? 0),
      unmanagedSevereInjuries:
        (a?.unmanagedSevereInjuries ?? 0) + (b?.unmanagedSevereInjuries ?? 0),
      propertyDamage:
        this.toNum(a?.propertyDamage) + this.toNum(b?.propertyDamage),
      totalDaysOff: (a?.totalDaysOff ?? 0) + (b?.totalDaysOff ?? 0),
    };
  }

  // ─── Helper: group injury/profession details ────────────────────────────
  private groupByCategory(
    details: ReportAccidentDetail[],
    field: 'injuryFactor' | 'profession',
  ): Array<{ code: string; name: string; stat: Partial<ReportStatistic> }> {
    const map = new Map<
      string,
      { code: string; name: string; stat: Partial<ReportStatistic> }
    >();

    for (const d of details) {
      const cat = d[field] as unknown as {
        id: number;
        code: string;
        name: string;
      } | null;
      if (!cat) continue;
      const key = String(cat.id);

      if (!map.has(key)) {
        map.set(key, {
          code: cat.code,
          name: cat.name,
          stat: {
            totalIncidents: 0,
            incidentsWithFatalities: 0,
            incidentsWithMultipleVictims: 0,
            totalVictims: 0,
            unmanagedVictims: 0,
            totalFemaleVictims: 0,
            unmanagedFemaleVictims: 0,
            totalFatalities: 0,
            unmanagedFatalities: 0,
            totalSevereInjuries: 0,
            unmanagedSevereInjuries: 0,
            propertyDamage: 0,
            totalDaysOff: 0,
          },
        });
      }

      const entry = map.get(key)!;
      const s = entry.stat;
      s.totalIncidents! += d.totalIncidents ?? 0;
      s.incidentsWithFatalities! += d.incidentsWithFatalities ?? 0;
      s.incidentsWithMultipleVictims! += d.incidentsWithMultipleVictims ?? 0;
      s.totalVictims! += d.totalVictims ?? 0;
      s.unmanagedVictims! += d.unmanagedVictims ?? 0;
      s.totalFemaleVictims! += d.totalFemaleVictims ?? 0;
      s.unmanagedFemaleVictims! += d.unmanagedFemaleVictims ?? 0;
      s.totalFatalities! += d.totalFatalities ?? 0;
      s.unmanagedFatalities! += d.unmanagedFatalities ?? 0;
      s.totalSevereInjuries! += d.totalSevereInjuries ?? 0;
      s.unmanagedSevereInjuries! += d.unmanagedSevereInjuries ?? 0;
      s.propertyDamage! += this.toNum(d.propertyDamage);
      s.totalDaysOff! += d.totalDaysOff ?? 0;
    }

    return Array.from(map.values()).sort((a, b) =>
      a.code.localeCompare(b.code),
    );
  }
}
