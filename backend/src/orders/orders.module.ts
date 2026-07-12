import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Customer } from '../customers/entities/customer.entity';
import { VisionTest } from '../vision-tests/entities/vision-test.entity';
import { Stock } from '../frames/entities/stock.entity';
import { Lens } from '../lenses/entities/lens.entity';
import { Branch } from '../auth/entities/branch.entity';
import { Organization } from '../auth/entities/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Customer, VisionTest, Stock, Lens, Branch, Organization])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
