
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { OrderItem } from './OrderItem';
import { MpesaTransaction } from './MpesaTransaction';
import { Payment } from './Payment';
import { Quote } from './Quote';

export enum OrderStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  FAILED = 'FAILED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  orderNumber!: string; // Added explicit column for Order Ref

  @Column()
  customerName!: string;

  @Column()
  customerEmail!: string;

  @Column()
  customerPhone!: string;
  
  @Column({ nullable: true })
  shippingAddress?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount!: number;

  // New Fields for Installments
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  amountPaid!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balance!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status!: OrderStatus;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @OneToMany(() => MpesaTransaction, (tx) => tx.order)
  mpesaTransactions!: MpesaTransaction[];

  @OneToMany(() => Payment, (payment) => payment.order, { cascade: true })
  payments!: Payment[];

  @ManyToOne(() => Quote, { nullable: true })
  sourceQuote?: Quote;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
