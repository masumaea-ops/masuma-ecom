import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('crsp_data')
export class CrspData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  make!: string;

  @Column()
  model!: string;

  @Column('int')
  year!: number;

  @Column('decimal', { precision: 16, scale: 2 })
  crspValue!: number; // Current Retail Selling Price from KRA

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  engineSize!: number;

  @Column({ nullable: true })
  fuelType!: string;

  @Column({ nullable: true })
  category!: string; // e.g. Saloon, Station Wagon, SUV

  @Column({ nullable: true })
  transmission!: string;

  @Column({ nullable: true })
  modelNumber!: string;

  @Column({ nullable: true })
  driveConfiguration!: string;

  @Column({ nullable: true })
  gvw!: string;

  @Column({ nullable: true })
  seating!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
