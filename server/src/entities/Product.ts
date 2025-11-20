
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinTable, Index } from 'typeorm';
import { Category } from './Category';
import { OemNumber } from './OemNumber';
import { Vehicle } from './Vehicle';
import { OrderItem } from './OrderItem';
import { ProductStock } from './ProductStock';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Index({ unique: true })
  @Column()
  sku!: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  costPrice!: number; // Buying Price (For COGS)

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number; // Selling Price

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  wholesalePrice?: number; // Added for B2B

  @Column('text')
  description!: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column('json', { nullable: true })
  images?: string[];

  @Column({ nullable: true })
  videoUrl?: string;

  // REMOVED: stockLevel (moved to ProductStock)

  @ManyToOne(() => Category, (category) => category.products)
  category!: Category;

  @OneToMany(() => OemNumber, (oem) => oem.product, { cascade: true })
  oemNumbers!: OemNumber[];

  @ManyToMany(() => Vehicle, (vehicle) => vehicle.products, { cascade: true })
  @JoinTable({ name: 'product_vehicles' })
  vehicles!: Vehicle[];

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems!: OrderItem[];

  @OneToMany(() => ProductStock, (stock) => stock.product)
  stock!: ProductStock[];
}
