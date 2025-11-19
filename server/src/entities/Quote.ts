
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from './Customer';
import { User } from './User';

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED'
}

export enum QuoteType {
  STANDARD = 'STANDARD',
  SOURCING = 'SOURCING'
}

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  quoteNumber!: string; // e.g. QT-2023-0001

  @ManyToOne(() => Customer, (customer) => customer.quotes)
  customer!: Customer;

  @ManyToOne(() => User, { nullable: true })
  createdBy!: User;

  @Column('json')
  items!: { productId?: string; name: string; quantity: number; unitPrice: number; total: number }[];

  @Column({ nullable: true })
  vin?: string; // Chassis Number for Sourcing

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  tax!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total!: number;

  @Column({
    type: 'enum',
    enum: QuoteStatus,
    default: QuoteStatus.DRAFT
  })
  status!: QuoteStatus;

  @Column({
    type: 'enum',
    enum: QuoteType,
    default: QuoteType.STANDARD
  })
  requestType!: QuoteType;

  @Column({ type: 'date', nullable: true })
  validUntil?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
