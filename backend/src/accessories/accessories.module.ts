import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessoriesController } from './accessories.controller';
import { AccessoriesService } from './accessories.service';
import { Accessory } from './entities/accessory.entity';
import { Organization } from '../auth/entities/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Accessory, Organization])],
  controllers: [AccessoriesController],
  providers: [AccessoriesService],
})
export class AccessoriesModule {}
