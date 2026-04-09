import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

export enum ImportRequestStatus {
  PENDING = 'PENDING',
  SOURCING = 'SOURCING',
  QUOTED = 'QUOTED',
  DEPOSIT_PAID = 'DEPOSIT_PAID',
  SHIPPED = 'SHIPPED',
  CLEARING = 'CLEARING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

@Entity('import_requests')
export class ImportRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar' })
  make!: string;

  @Column({ type: 'varchar' })
  model!: string;

  @Column({ type: 'int' })
  minYear!: number;

  @Column({ type: 'varchar', nullable: true })
  colorPreference!: string;

  @Column({ type: 'int', nullable: true })
  maxMileage!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  budgetKes!: number;

  @Column({ type: 'varchar', default: 'Japan' })
  sourceCountry!: string;

  @Column({ type: 'text', nullable: true })
  additionalNotes!: string;

  @Column({
    type: 'enum',
    enum: ImportRequestStatus,
    default: ImportRequestStatus.PENDING
  })
  status!: ImportRequestStatus;

  @Column({ type: 'jsonb', nullable: true })
  adminResponse!: any; // For storing quotes, ship details, etc.

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
