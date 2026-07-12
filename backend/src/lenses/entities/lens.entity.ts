import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from '../../auth/entities/organization.entity';
import { Factory } from './factory.entity';

@Entity('lenses')
export class Lens {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ nullable: true })
  coating?: string;

  @ManyToOne(() => Factory, { nullable: true })
  @JoinColumn({ name: 'factoryId' })
  factory?: Factory;

  @Column({ type: 'int', nullable: true })
  factoryId?: number;

  @Column({ type: 'int', default: 0 })
  price!: number;

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
