import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from '../../auth/entities/organization.entity';
import { Branch } from '../../auth/entities/branch.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('vision_tests')
export class VisionTest {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({ type: 'int' })
  customerId!: number;

  @Column({ default: true })
  hasVisionDetails!: boolean;

  // Right eye (OD)
  @Column({ nullable: true })
  rSph?: string;

  @Column({ nullable: true })
  rCyl?: string;

  @Column({ nullable: true })
  rAxis?: string;

  @Column({ nullable: true })
  rAdd?: string;

  @Column({ nullable: true })
  rVa?: string;

  // Left eye (OS)
  @Column({ nullable: true })
  lSph?: string;

  @Column({ nullable: true })
  lCyl?: string;

  @Column({ nullable: true })
  lAxis?: string;

  @Column({ nullable: true })
  lAdd?: string;

  @Column({ nullable: true })
  lVa?: string;

  // Shared / per-eye PD & segment height
  @Column({ nullable: true })
  pd?: string;

  @Column({ nullable: true })
  height?: string;

  @Column({ nullable: true })
  rightPd?: string;

  @Column({ nullable: true })
  leftPd?: string;

  @Column({ nullable: true })
  rightHeight?: string;

  @Column({ nullable: true })
  leftHeight?: string;

  // Clinical remarks
  @Column({ type: 'text', nullable: true })
  refractionRemark?: string;

  @Column({ default: false })
  sugar!: boolean;

  @Column({ default: false })
  cataract!: boolean;

  @Column({ type: 'text', nullable: true })
  abnormalities?: string;

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
}
