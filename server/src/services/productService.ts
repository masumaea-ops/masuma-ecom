import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { OemNumber } from '../entities/OemNumber';
import { ProductStock } from '../entities/ProductStock';
import { Branch } from '../entities/Branch';
import { Vehicle } from '../entities/Vehicle'; 
import { CacheService } from '../lib/cache';
import { AuditService } from './auditService';
import { User } from '../entities/User';
import { In } from 'typeorm';

export class ProductService {
  private static productRepo = AppDataSource.getRepository(Product);
  private static categoryRepo = AppDataSource.getRepository(Category);
  private static stockRepo = AppDataSource.getRepository(ProductStock);
  private static branchRepo = AppDataSource.getRepository(Branch);
  private static vehicleRepo = AppDataSource.getRepository(Vehicle);
  
  private static async processVehicles(compatibility: string[]): Promise<Vehicle[]> {
      const vehicles: Vehicle[] = [];
      for (const item of compatibility) {
          const cleanItem = item.trim();
          if (!cleanItem) continue;

          const parts = cleanItem.split(/\s+/);
          
          let make = 'Generic';
          let model = cleanItem;

          if (parts.length > 1) {
              make = parts[0]; 
              model = parts.slice(1).join(' ');
          }

          let vehicle = await this.vehicleRepo.findOne({ 
              where: { make: make, model: model } 
          });
          
          if (!vehicle) {
              vehicle = this.vehicleRepo.create({ make, model });
              await this.vehicleRepo.save(vehicle);
          }
          vehicles.push(vehicle);
      }
      return vehicles;
  }

  static async getAllProducts(query: string = '', categoryName: string = 'All', page: number = 1, limit: number = 50) {
      const skip = (page - 1) * limit;
      
      const qb = this.productRepo.createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.oemNumbers', 'oem')
        .leftJoinAndSelect('product.vehicles', 'vehicle')
        .leftJoinAndSelect('product.stock', 'stock')
        .take(limit)
        .skip(skip);

      if (categoryName && categoryName !== 'All') {
        qb.andWhere('category.name = :categoryName', { categoryName });
      }

      if (query) {
        const searchTerm = `%${query}%`;
        qb.andWhere(
          '(product.name LIKE :search OR product.sku LIKE :search OR oem.code LIKE :search OR vehicle.model LIKE :search)',
          { search: searchTerm }
        );
      }

      const [products, total] = await qb.getManyAndCount();

      const data = products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || 'Uncategorized',
        price: Number(p.price),
        costPrice: Number(p.costPrice),
        wholesalePrice: Number(p.wholesalePrice || 0),
        description: p.description,
        image: p.imageUrl || '',
        images: p.images || [],
        videoUrl: p.videoUrl || '',
        quantity: p.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0,
        stock: p.stock?.some(s => s.quantity > 0) || false, 
        oemNumbers: p.oemNumbers?.map(o => o.code) || [],
        compatibility: p.vehicles?.map(v => v.make === 'Generic' ? v.model : `${v.make} ${v.model}`) || []
      }));

      return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  static async getProductById(id: string) {
    const p = await this.productRepo.findOne({
      where: { id },
      relations: ['category', 'oemNumbers', 'vehicles', 'stock']
    });

    if (!p) return null;

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name || 'Uncategorized',
      price: Number(p.price),
      costPrice: Number(p.costPrice),
      wholesalePrice: Number(p.wholesalePrice || 0),
      description: p.description,
      image: p.imageUrl || '',
      images: p.images || [],
      videoUrl: p.videoUrl || '',
      quantity: p.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0,
      stock: p.stock?.some(s => s.quantity > 0) || false,
      oemNumbers: p.oemNumbers?.map(o => o.code) || [],
      compatibility: p.vehicles?.map(v => v.make === 'Generic' ? v.model : `${v.make} ${v.model}`) || []
    };
  }

  static async createProduct(data: any) {
    const category = await this.categoryRepo.findOneBy({ name: data.category });
    if (!category) throw new Error(`Category ${data.category} not found`);

    const product = new Product();
    product.name = data.name;
    product.sku = data.sku;
    product.price = data.price;
    product.costPrice = data.costPrice || 0;
    product.wholesalePrice = data.wholesalePrice;
    product.description = data.description;
    product.imageUrl = data.imageUrl;
    product.images = data.images;
    product.videoUrl = data.videoUrl;
    product.category = category;

    if (data.oemNumbers && Array.isArray(data.oemNumbers)) {
      product.oemNumbers = data.oemNumbers.map((code: string) => {
        const oem = new OemNumber();
        oem.code = code;
        return oem;
      });
    }

    if (data.compatibility && Array.isArray(data.compatibility)) {
        product.vehicles = await this.processVehicles(data.compatibility);
    }

    const saved = await this.productRepo.save(product);

    if (data.branchId) {
        const branch = await this.branchRepo.findOneBy({ id: data.branchId });
        if (branch) {
            const stock = new ProductStock();
            stock.product = saved;
            stock.branch = branch;
            stock.quantity = data.quantity || 0; 
            stock.lowStockThreshold = 5;
            await this.stockRepo.save(stock);
        }
    }

    await CacheService.invalidate('products:*');
    return saved;
  }

  static async updateProduct(id: string, data: any) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['oemNumbers', 'vehicles']
    });

    if (!product) throw new Error('Product not found');

    if (data.category) {
       const category = await this.categoryRepo.findOneBy({ name: data.category });
       if (category) product.category = category;
    }

    product.name = data.name || product.name;
    product.sku = data.sku || product.sku;
    product.price = data.price || product.price;
    product.costPrice = (data.costPrice !== undefined) ? data.costPrice : product.costPrice;
    product.wholesalePrice = data.wholesalePrice || product.wholesalePrice;
    product.description = data.description || product.description;
    product.imageUrl = data.imageUrl || product.imageUrl;
    if (data.images) product.images = data.images;
    if (data.videoUrl !== undefined) product.videoUrl = data.videoUrl;

    if (data.oemNumbers && Array.isArray(data.oemNumbers)) {
        await AppDataSource.getRepository(OemNumber).delete({ product: { id: product.id } } as any);
        product.oemNumbers = data.oemNumbers.map((code: string) => {
          const oem = new OemNumber();
          oem.code = code;
          return oem;
        });
    }

    if (data.compatibility && Array.isArray(data.compatibility)) {
        product.vehicles = await this.processVehicles(data.compatibility);
    }

    const saved = await this.productRepo.save(product);

    if (data.quantity !== undefined && data.branchId) {
        let stock = await this.stockRepo.findOne({
            where: { product: { id: product.id } as any, branch: { id: data.branchId } as any }
        });

        if (!stock) {
            stock = new ProductStock();
            stock.product = product;
            stock.branch = { id: data.branchId } as Branch;
            stock.quantity = data.quantity;
            stock.lowStockThreshold = 5;
        } else {
            stock.quantity = data.quantity;
        }
        await this.stockRepo.save(stock);
    }

    await CacheService.invalidate('products:*');
    await CacheService.invalidate(`product:detail:${id}`);
    return saved;
  }

  static async applyGlobalPriceAdjustment(percentage: number, user: User) {
    const factor = percentage / 100;
    const isReduction = percentage < 0;
    
    await AppDataSource.query(`
        UPDATE products 
        SET 
            price = ROUND(price * (1 + ?), 0),
            wholesalePrice = CASE WHEN wholesalePrice IS NOT NULL THEN ROUND(wholesalePrice * (1 + ?), 0) ELSE NULL END
    `, [factor, factor]);

    await CacheService.invalidate('products:*');

    await AuditService.log(
        'GLOBAL_PRICE_ADJUSTMENT',
        'CATALOG',
        `Adjusted all prices by ${percentage}% (${isReduction ? 'Reduction' : 'Increase'})`,
        user
    );

    return true;
  }

  static async deleteProduct(id: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, { where: { id } });
      if (!product) throw new Error('Product not found');

      await queryRunner.manager.delete(ProductStock, { product: { id: id } } as any);
      await queryRunner.manager.delete(OemNumber, { product: { id: id } } as any);
      await queryRunner.manager.remove(product);

      await queryRunner.commitTransaction();

      await CacheService.invalidate('products:*');
      await CacheService.invalidate(`product:detail:${id}`);
      return true;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (error.message?.includes('foreign key constraint fails')) {
          throw new Error('Cannot delete this product because it is part of existing Orders or Sales.');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  static async bulkDelete(ids: string[], user: User) {
    if (!ids.length) return;
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        await queryRunner.manager.delete(ProductStock, { product: { id: In(ids) } } as any);
        await queryRunner.manager.delete(OemNumber, { product: { id: In(ids) } } as any);
        await queryRunner.manager.delete(Product, { id: In(ids) });
        
        await queryRunner.commitTransaction();
        
        await AuditService.log('BULK_DELETE_PRODUCTS', 'CATALOG', `Deleted ${ids.length} products manually.`, user);
        await CacheService.invalidate('products:*');
        return true;
    } catch (error: any) {
        await queryRunner.rollbackTransaction();
        if (error.message?.includes('foreign key constraint fails')) {
            throw new Error('One or more products cannot be deleted because they are linked to sales or orders.');
        }
        throw error;
    } finally {
        await queryRunner.release();
    }
  }
  
  static async getAllProductIdsForSitemap() {
     return this.productRepo.find({
       select: { id: true }
     });
  }
}