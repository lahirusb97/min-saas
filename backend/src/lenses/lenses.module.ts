import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LensesController } from './lenses.controller';
import { LensesService } from './lenses.service';
import { Lens } from './entities/lens.entity';
import { Factory } from './entities/factory.entity';
import { Organization } from '../auth/entities/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lens, Factory, Organization])],
  controllers: [LensesController],
  providers: [LensesService],
})
export class LensesModule {}
