import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  CreateInjuryFactorDto,
  CreateInjuryTypeDto,
  CreateProfessionDto,
} from './dto/create-category.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  // ── InjuryFactor ──────────────────────────────────────────────
  @Get('injury-factor')
  async getAllInjuryFactor() {
    return this.categoryService.getAllInjuryFactor();
  }

  @Post('injury-factor')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thêm mới yếu tố gây chấn thương' })
  createInjuryFactor(@Body() dto: CreateInjuryFactorDto) {
    return this.categoryService.createInjuryFactor(dto);
  }

  @Patch('injury-factor/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật yếu tố gây chấn thương' })
  updateInjuryFactor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateInjuryFactorDto,
  ) {
    return this.categoryService.updateInjuryFactor(id, dto);
  }

  @Patch('injury-factor/:id/toggle-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bật/tắt trạng thái yếu tố gây chấn thương' })
  toggleInjuryFactorStatus(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.toggleInjuryFactorStatus(id);
  }

  // ── InjuryType ────────────────────────────────────────────────
  @Get('injury-type')
  async getAllInjuryType() {
    return this.categoryService.getAllInjuryType();
  }

  @Post('injury-type')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thêm mới loại chấn thương (cấp 2)' })
  createInjuryType(@Body() dto: CreateInjuryTypeDto) {
    return this.categoryService.createInjuryType(dto);
  }

  @Patch('injury-type/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật loại chấn thương' })
  updateInjuryType(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateInjuryTypeDto,
  ) {
    return this.categoryService.updateInjuryType(id, dto);
  }

  @Patch('injury-type/:id/toggle-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bật/tắt trạng thái loại chấn thương' })
  toggleInjuryTypeStatus(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.toggleInjuryTypeStatus(id);
  }

  // ── Profession ────────────────────────────────────────────────
  @Get('profession')
  async getAllProfession() {
    return this.categoryService.getAllProfession();
  }
  @Get('profession-for-report')
  async getAllProfessionForReport() {
    return this.categoryService.getAllProfessionForReport();
  }

  @Post('profession')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thêm mới nghề nghiệp' })
  createProfession(@Body() dto: CreateProfessionDto) {
    return this.categoryService.createProfession(dto);
  }

  @Patch('profession/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật nghề nghiệp' })
  updateProfession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateProfessionDto,
  ) {
    return this.categoryService.updateProfession(id, dto);
  }

  @Patch('profession/:id/toggle-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bật/tắt trạng thái nghề nghiệp' })
  toggleProfessionStatus(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.toggleProfessionStatus(id);
  }

  // ── AccidentCause ─────────────────────────────────────────────
  @Get('accident-cause')
  @ApiOperation({ summary: 'Lấy danh sách nguyên nhân tai nạn' })
  getAllAccidentCause() {
    return this.categoryService.getAllAccidentCause();
  }
}
