import { Test, TestingModule } from '@nestjs/testing';
import { ReportPeriodController } from './report_period.controller';
import { ReportPeriodService } from './report_period.service';

describe('ReportPeriodController', () => {
  let controller: ReportPeriodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportPeriodController],
      providers: [ReportPeriodService],
    }).compile();

    controller = module.get<ReportPeriodController>(ReportPeriodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
