import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisionTestsController } from './vision-tests.controller';
import { VisionTestsService } from './vision-tests.service';
import { VisionTest } from './entities/vision-test.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Branch } from '../auth/entities/branch.entity';
import { Organization } from '../auth/entities/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VisionTest, Customer, Branch, Organization])],
  controllers: [VisionTestsController],
  providers: [VisionTestsService],
  exports: [VisionTestsService],
})
export class VisionTestsModule {}
