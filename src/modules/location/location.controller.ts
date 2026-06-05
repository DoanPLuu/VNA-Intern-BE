import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LocationService } from './location.service';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // GET /location/provinces
  @Get('provinces')
  @ApiOperation({ summary: 'Lấy danh sách tỉnh/thành phố' })
  getProvinces() {
    return this.locationService.getProvinces();
  }

  // GET /location/provinces/:id/wards
  @Get('provinces/:id/wards')
  @ApiOperation({ summary: 'Lấy danh sách phường/xã theo tỉnh' })
  getWardsByProvince(@Param('id', ParseIntPipe) id: number) {
    return this.locationService.getWardsByProvince(id);
  }
}
