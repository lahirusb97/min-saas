import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { SourceType, LensSide } from './order.enums';
import { Stock } from '../../frames/entities/stock.entity';
import { Lens } from '../../lenses/entities/lens.entity';

export enum OrderItemType {
  FRAME = 'frame',
  LENS = 'lens',
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column({ type: 'int' })
  orderId!: number;

  @Column({ type: 'enum', enum: OrderItemType })
  itemType!: OrderItemType;

  @Column({ type: 'enum', enum: SourceType })
  sourceType!: SourceType;

  @ManyToOne(() => Stock, { nullable: true })
  @JoinColumn({ name: 'frameStockId' })
  frameStock?: Stock;

  @Column({ type: 'int', nullable: true })
  frameStockId?: number;

  @ManyToOne(() => Lens, { nullable: true })
  @JoinColumn({ name: 'lensId' })
  lens?: Lens;

  @Column({ type: 'int', nullable: true })
  lensId?: number;

  // Lens-only: which side(s) this line covers
  @Column({ type: 'enum', enum: LensSide, nullable: true })
  side?: LensSide;

  // Snapshot fields: frame brand/model/color, or lens factory/type/coating
  @Column({ nullable: true })
  brand?: string;

  @Column({ nullable: true })
  code?: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ type: 'int' })
  price!: number;

  @Column({ type: 'int', default: 1 })
  qty!: number;

  @Column({ type: 'int' })
  lineTotal!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
