import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { VisionTestsService } from './vision-tests.service';
import { CreateVisionTestDto } from './dto/create-vision-test.dto';
import { UpdateVisionTestDto } from './dto/update-vision-test.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

interface AuthUser {
  id: number;
}

@Controller('vision-tests')
@UseGuards(JwtAuthGuard)
export class VisionTestsController {
  constructor(private readonly visionTestsService: VisionTestsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVisionTestDto) {
    return this.visionTestsService.create(user.id, dto);
  }

  @Get('customer/:customerId')
  findByCustomer(@CurrentUser() user: AuthUser, @Param('customerId', ParseIntPipe) customerId: number) {
    return this.visionTestsService.findByCustomer(user.id, customerId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.visionTestsService.findOne(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVisionTestDto) {
    return this.visionTestsService.update(user.id, id, dto);
  }
}
