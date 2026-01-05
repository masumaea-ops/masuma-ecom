import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Branch } from './Branch';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  B2B_USER = 'B2B_USER'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  fullName!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CASHIER
  })
  role!: UserRole;

  @ManyToOne(() => Branch, (branch) => branch.users, { nullable: true })
  branch?: Branch;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true, select: false })
  resetPasswordToken?: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  resetPasswordExpires?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}