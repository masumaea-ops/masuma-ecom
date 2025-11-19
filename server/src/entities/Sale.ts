import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Branch } from './Branch';
import { User } from './User';
import { Customer } from './Customer';
import { OrderItem } from './OrderItem'; // reusing OrderItem or create SaleItem

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  receiptNumber!: string;

  @ManyToOne(() => Branch, (branch) => branch.sales)
  branch!: Branch;

  @ManyToOne(() => User)
  cashier!: User;

  @ManyToOne(() => Customer, { nullable: true })
  customer?: Customer;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ default: 'CASH' })
  paymentMethod!: string; // CASH, MPESA, CARD, CREDIT

  @Column({ type: 'json', nullable: true })
  paymentDetails?: any; // M-Pesa code, etc.

  @Column({ type: 'json' })
  itemsSnapshot!: any[]; // Snapshot of items at time of sale

  @CreateDateColumn()
  createdAt!: Date;
}