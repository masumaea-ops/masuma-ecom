
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { OemNumber } from '../entities/OemNumber';
import { CacheService } from '../lib/cache';

export class ProductService {
  private static productRepo = AppDataSource.getRepository(Product);
  private static categoryRepo = AppDataSource.getRepository(Category);
  
  static async getAllProducts(query: string = '', categoryName: string = 'All') {
    const cacheKey = `products:list:${query}:${categoryName}`;

    return CacheService.getOrSet(cacheKey, async () => {
      const qb = this.productRepo.createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.oemNumbers', 'oem')
        .leftJoinAndSelect('product.vehicles', 'vehicle')
        .leftJoinAndSelect('product.stock', 'stock')
        .take(50);

      // Category Filter
      if (categoryName && categoryName !== 'All') {
        qb.andWhere('category.name = :categoryName', { categoryName });
      }

      // Advanced Search Logic
      if (query) {
        const searchTerm = `%${query}%`;
        qb.andWhere(
          '(product.name LIKE :search OR product.sku LIKE :search OR oem.code LIKE :search OR vehicle.model LIKE :search)',
          { search: searchTerm }
        );
      }

      const products = await qb.getMany();

      // Transform for frontend (DTO Pattern)
      return products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || 'Uncategorized',
        price: Number(p.price),
        wholesalePrice: Number(p.wholesalePrice || 0),
        description: p.description,
        image: p.imageUrl || '',
        // Simple stock check: if any branch has stock > 0
        stock: p.stock?.some(s => s.quantity > 0) || false, 
        oemNumbers: p.oemNumbers?.map(o => o.code) || [],
        compatibility: p.vehicles?.map(v => `${v.make} ${v.model}`) || []
      }));
    }, 30); // Short cache for active edits
  }

  static async getProductById(id: string) {
    const cacheKey = `product:detail:${id}`;
    return CacheService.getOrSet(cacheKey, async () => {
      return this.productRepo.findOne({
        where: { id },
        relations: ['category', 'oemNumbers', 'vehicles']
      });
    }, 3600);
  }

  static async createProduct(data: any) {
    const category = await this.categoryRepo.findOneBy({ name: data.category });
    if (!category) throw new Error(`Category ${data.category} not found`);

    const product = new Product();
    product.name = data.name;
    product.sku = data.sku;
    product.price = data.price;
    product.wholesalePrice = data.wholesalePrice;
    product.description = data.description;
    product.imageUrl = data.imageUrl;
    product.category = category;

    // Handle OEM Numbers
    if (data.oemNumbers && Array.isArray(data.oemNumbers)) {
      product.oemNumbers = data.oemNumbers.map((code: string) => {
        const oem = new OemNumber();
        oem.code = code;
        return oem;
      });
    }

    const saved = await this.productRepo.save(product);
    await CacheService.invalidate('products:*'); // Clear cache
    return saved;
  }

  static async updateProduct(id: string, data: any) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['oemNumbers']
    });

    if (!product) throw new Error('Product not found');

    if (data.category) {
       const category = await this.categoryRepo.findOneBy({ name: data.category });
       if (category) product.category = category;
    }

    product.name = data.name || product.name;
    product.sku = data.sku || product.sku;
    product.price = data.price || product.price;
    product.wholesalePrice = data.wholesalePrice || product.wholesalePrice;
    product.description = data.description || product.description;
    product.imageUrl = data.imageUrl || product.imageUrl;

    // Update OEMs if provided (Replaces all)
    if (data.oemNumbers && Array.isArray(data.oemNumbers)) {
        // Clear existing (TypeORM cascade usually handles this but careful)
        await AppDataSource.getRepository(OemNumber).delete({ product: { id: product.id } });
        
        product.oemNumbers = data.oemNumbers.map((code: string) => {
          const oem = new OemNumber();
          oem.code = code;
          return oem;
        });
    }

    const saved = await this.productRepo.save(product);
    await CacheService.invalidate('products:*');
    await CacheService.invalidate(`product:detail:${id}`);
    return saved;
  }

  static async deleteProduct(id: string) {
    const product = await this.productRepo.findOneBy({ id });
    if (!product) throw new Error('Product not found');

    await this.productRepo.remove(product);
    await CacheService.invalidate('products:*');
    await CacheService.invalidate(`product:detail:${id}`);
    return true;
  }
  
  static async getAllProductIdsForSitemap() {
     return this.productRepo.find({
       select: { id: true }
     });
  }
}
