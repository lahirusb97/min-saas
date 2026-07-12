import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FramesController } from './frames.controller';
import { FramesService } from './frames.service';
import { Frame } from './entities/frame.entity';
import { Brand } from './entities/brand.entity';
import { Color } from './entities/color.entity';
import { Stock } from './entities/stock.entity';
import { Branch } from '../auth/entities/branch.entity';
import { Organization } from '../auth/entities/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Frame, Brand, Color, Stock, Branch, Organization])],
  controllers: [FramesController],
  providers: [FramesService],
})
export class FramesModule {}
