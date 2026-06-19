import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  @Get('injury-factor')
  async getAllInjuryFactor() {
    return this.categoryService.getAllInjuryFactor();
  }
  @Get('injury-type')
  async getAllInjuryType() {
    return this.categoryService.getAllInjuryType();
  }
  @Get('profession')
  async getAllProfession() {
    return this.categoryService.getAllProfession();
  }
}
