import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from '../../auth/entities/branch.entity';
import { Brand } from './brand.entity';

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

  @Column({ nullable: true })
  color?: string;

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
