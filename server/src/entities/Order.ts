
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { OrderItem } from './OrderItem';
import { MpesaTransaction } from './MpesaTransaction';
import { Payment } from './Payment';
import { Quote } from './Quote';
import { ColumnNumericTransformer } from '../utils/transformer';

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
  orderNumber!: string;

  @Column()
  customerName!: string;

  @Column({ nullable: true })
  customerEmail?: string;

  @Column()
  customerPhone!: string;
  
  @Column({ nullable: true })
  shippingAddress?: string;

  @Column('decimal', { precision: 10, scale: 2, transformer: new ColumnNumericTransformer() })
  totalAmount!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  amountPaid!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  balance!: number;

  @Column({ default: 'MANUAL' })
  paymentMethod!: string;

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
