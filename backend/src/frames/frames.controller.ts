import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { FramesService } from './frames.service';
import { CreateFrameDto } from './dto/create-frame.dto';
import { UpdateFrameDto } from './dto/update-frame.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

interface AuthUser {
  id: number;
}

@Controller('frames')
@UseGuards(JwtAuthGuard)
export class FramesController {
  constructor(private readonly framesService: FramesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFrameDto) {
    return this.framesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.framesService.findAll(user.id);
  }

  @Get('brands')
  listBrands(@CurrentUser() user: AuthUser) {
    return this.framesService.listBrands(user.id);
  }

  @Get('models')
  listModels(@CurrentUser() user: AuthUser, @Query('brand') brand?: string) {
    return this.framesService.listModels(user.id, brand);
  }

  @Get('colors')
  listColors(@CurrentUser() user: AuthUser) {
    return this.framesService.listColors(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.framesService.findOne(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFrameDto) {
    return this.framesService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.framesService.remove(user.id, id);
  }
}
