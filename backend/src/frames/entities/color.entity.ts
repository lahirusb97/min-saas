import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../auth/entities/branch.entity';

@Entity('colors')
@Index(['branchId', 'name'], { unique: true })
export class Color {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branchId' })
  branch!: Branch;

  @Column()
  branchId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
