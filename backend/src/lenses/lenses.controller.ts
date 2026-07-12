import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { LensesService } from './lenses.service';
import { CreateLensDto } from './dto/create-lens.dto';
import { UpdateLensDto } from './dto/update-lens.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

interface AuthUser {
  id: number;
}

@Controller('lenses')
@UseGuards(JwtAuthGuard)
export class LensesController {
  constructor(private readonly lensesService: LensesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLensDto) {
    return this.lensesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.lensesService.findAll(user.id);
  }

  @Get('factories')
  listFactories(@CurrentUser() user: AuthUser) {
    return this.lensesService.listFactories(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.lensesService.findOne(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLensDto) {
    return this.lensesService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.lensesService.remove(user.id, id);
  }
}
