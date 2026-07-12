import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from '../../auth/entities/organization.entity';
import { Brand } from './brand.entity';

@Entity('frame_models')
@Index(['organizationId', 'brandId', 'name'], { unique: true })
export class FrameModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => Brand)
  @JoinColumn({ name: 'brandId' })
  brand!: Brand;

  @Column({ type: 'int' })
  brandId!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'int' })
  organizationId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
