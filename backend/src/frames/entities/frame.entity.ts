import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from '../../auth/entities/organization.entity';
import { Brand } from './brand.entity';
import { FrameModel } from './frame-model.entity';
import { Color } from './color.entity';

@Entity('frames')
export class Frame {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Brand)
  @JoinColumn({ name: 'brandId' })
  brand!: Brand;

  @Column({ type: 'int' })
  brandId!: number;

  @ManyToOne(() => FrameModel)
  @JoinColumn({ name: 'modelId' })
  model!: FrameModel;

  @Column({ type: 'int' })
  modelId!: number;

  @ManyToOne(() => Color, { nullable: true })
  @JoinColumn({ name: 'colorId' })
  color?: Color;

  @Column({ type: 'int', nullable: true })
  colorId?: number;

  @Column({ nullable: true })
  frameType?: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'int' })
  organizationId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
