import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Branch } from './branch.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => User, (user) => user.organizations)
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @Column({ type: 'int' })
  ownerId!: number;

  @OneToMany(() => Branch, (branch) => branch.organization)
  branches!: Branch[];

  @CreateDateColumn()
  createdAt!: Date;
}
