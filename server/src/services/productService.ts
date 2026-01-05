
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { OemNumber } from '../entities/OemNumber';
import { ProductStock } from '../entities/ProductStock';
import { Branch } from '../entities/Branch';
import { Vehicle } from '../entities/Vehicle'; 
import { CacheService } from '../lib/cache';

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

          // Split by one or more spaces to handle accidental double spaces
          const parts = cleanItem.split(/\s+/);
          
          let make = 'Generic';
          let model = cleanItem;

          if (parts.length > 1) {
              make = parts[0]; // First word is Make
              model = parts.slice(1).join(' '); // Rest is Model
          }

          // Case insensitive check
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
        // FIX: Hide "Generic" make from display
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

    // Transform to DTO structure matching frontend expectation
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
      // FIX: Hide "Generic" make from display
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

    // Auto-create inventory record for the user's branch if provided
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

    // --- ACTIVE SYNC: Update Stock Quantity ---
    if (data.quantity !== undefined && data.branchId) {
        let stock = await this.stockRepo.findOne({
            where: { product: { id: product.id } as any, branch: { id: data.branchId } as any }
        });

        if (!stock) {
            // Create if missing
            stock = new ProductStock();
            stock.product = product;
            stock.branch = { id: data.branchId } as Branch;
            stock.quantity = data.quantity;
            stock.lowStockThreshold = 5;
        } else {
            // Update existing
            stock.quantity = data.quantity;
        }
        await this.stockRepo.save(stock);
    }

    await CacheService.invalidate('products:*');
    await CacheService.invalidate(`product:detail:${id}`);
    return saved;
  }

  static async deleteProduct(id: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, { where: { id } });
      if (!product) throw new Error('Product not found');

      // 1. Manually delete dependencies that restrict deletion
      // Delete Stock entries first (Fixes Foreign Key Constraint Error)
      await queryRunner.manager.delete(ProductStock, { product: { id: id } } as any);
      
      // Delete OemNumbers (Good practice to clean up explicitly)
      await queryRunner.manager.delete(OemNumber, { product: { id: id } } as any);

      // 2. Delete the Product
      await queryRunner.manager.remove(product);

      await queryRunner.commitTransaction();

      await CacheService.invalidate('products:*');
      await CacheService.invalidate(`product:detail:${id}`);
      return true;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('Delete Product Error:', error);
      
      // Check for other constraints (like OrderItems) that indicate sales history
      if (error.message?.includes('foreign key constraint fails')) {
          throw new Error('Cannot delete this product because it is part of existing Orders or Sales. Please edit or archive it instead.');
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
