import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinTable, Index } from 'typeorm';
import { Category } from './Category';
import { OemNumber } from './OemNumber';
import { Vehicle } from './Vehicle';
import { OrderItem } from './OrderItem';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Index({ unique: true })
  @Column()
  sku!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column('text')
  description!: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ default: 0 })
  stockLevel!: number;

  @ManyToOne(() => Category, (category) => category.products)
  category!: Category;

  @OneToMany(() => OemNumber, (oem) => oem.product, { cascade: true })
  oemNumbers!: OemNumber[];

  @ManyToMany(() => Vehicle, (vehicle) => vehicle.products, { cascade: true })
  @JoinTable({ name: 'product_vehicles' })
  vehicles!: Vehicle[];

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems!: OrderItem[];
}
