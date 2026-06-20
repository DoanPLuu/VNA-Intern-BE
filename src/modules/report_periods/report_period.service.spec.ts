import { Test, TestingModule } from '@nestjs/testing';
import { ReportPeriodService } from './report_period.service';

describe('LocationService', () => {
  let service: ReportPeriodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportPeriodService],
    }).compile();

    service = module.get<ReportPeriodService>(ReportPeriodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
