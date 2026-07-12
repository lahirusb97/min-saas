import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from '../../auth/entities/branch.entity';
import { Brand } from './brand.entity';
import { Color } from './color.entity';

@Entity('frames')
export class Frame {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Brand)
  @JoinColumn({ name: 'brandId' })
  brand!: Brand;

  @Column({ type: 'int' })
  brandId!: number;

  @Column()
  modelNumber!: string;

  @ManyToOne(() => Color, { nullable: true })
  @JoinColumn({ name: 'colorId' })
  color?: Color;

  @Column({ type: 'int', nullable: true })
  colorId?: number;

  @Column({ nullable: true })
  frameType?: string;

  @Column({ type: 'int', default: 0 })
  qty!: number;

  @Column({ type: 'int', default: 0 })
  price!: number;

  @Column({ type: 'int', default: 5 })
  threshold!: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branchId' })
  branch!: Branch;

  @Column()
  branchId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
