import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FramesController } from './frames.controller';
import { FramesService } from './frames.service';
import { Frame } from './entities/frame.entity';
import { Branch } from '../auth/entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Frame, Branch])],
  controllers: [FramesController],
  providers: [FramesService],
})
export class FramesModule {}
