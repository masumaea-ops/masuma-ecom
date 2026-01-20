import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinTable, Index } from 'typeorm';
import { Category } from './Category';
import { OemNumber } from './OemNumber';
import { Vehicle } from './Vehicle';
import { OrderItem } from './OrderItem';
import { ProductStock } from './ProductStock';
import { ColumnNumericTransformer } from '../utils/transformer';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 500 }) 
  name!: string;

  @Index({ unique: true })
  @Column()
  sku!: string;

  @Column('decimal', { precision: 16, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  costPrice!: number;

  @Column('decimal', { precision: 16, scale: 2, transformer: new ColumnNumericTransformer() })
  price!: number;

  @Column('decimal', { precision: 16, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() })
  wholesalePrice?: number;

  @Column('text')
  description!: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column('json', { nullable: true })
  images?: string[];

  @Column({ nullable: true })
  videoUrl?: string;

  @Column({ nullable: true })
  importBatchId?: string; // Tracks bulk import groups

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