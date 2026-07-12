import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from '../../auth/entities/branch.entity';
import { Frame } from './frame.entity';

@Entity('stocks')
@Index(['frameId', 'branchId'], { unique: true })
export class Stock {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Frame)
  @JoinColumn({ name: 'frameId' })
  frame!: Frame;

  @Column({ type: 'int' })
  frameId!: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branchId' })
  branch!: Branch;

  @Column({ type: 'int' })
  branchId!: number;

  @Column({ type: 'int', default: 0 })
  qty!: number;

  @Column({ type: 'int', default: 0 })
  price!: number;

  @Column({ type: 'int', default: 5 })
  threshold!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
