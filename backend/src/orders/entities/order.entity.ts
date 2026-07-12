import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from '../../auth/entities/organization.entity';
import { Branch } from '../../auth/entities/branch.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { VisionTest } from '../../vision-tests/entities/vision-test.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order.enums';

export { SourceType, LensSide, OrderStatus } from './order.enums';

@Entity('orders')
@Index(['branchId', 'invoiceNo'], { unique: true })
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  invoiceNo!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({ type: 'int' })
  customerId!: number;

  @ManyToOne(() => VisionTest, { nullable: true })
  @JoinColumn({ name: 'visionTestId' })
  visionTest?: VisionTest;

  @Column({ type: 'int', nullable: true })
  visionTestId?: number;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];

  @Column({ type: 'text', nullable: true })
  prescriptionNote?: string;

  // Financials
  @Column({ type: 'int', default: 0 })
  subTotal!: number;

  @Column({ type: 'int', default: 0 })
  discount!: number;

  @Column({ type: 'int', default: 0 })
  total!: number;

  @Column({ type: 'int', default: 0 })
  payment!: number;

  @Column({ type: 'int', default: 0 })
  balance!: number;

  @Column({ nullable: true })
  dueDate?: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'int' })
  organizationId!: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branchId' })
  branch!: Branch;

  @Column({ type: 'int' })
  branchId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
