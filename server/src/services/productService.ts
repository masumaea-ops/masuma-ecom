import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { CacheService } from '../lib/cache';

export class ProductService {
  private static productRepo = AppDataSource.getRepository(Product);
  
  static async getAllProducts(query: string = '', categoryName: string = 'All') {
    const cacheKey = `products:list:${query}:${categoryName}`;

    return CacheService.getOrSet(cacheKey, async () => {
      const qb = this.productRepo.createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.oemNumbers', 'oem')
        .leftJoinAndSelect('product.vehicles', 'vehicle')
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
        description: p.description,
        image: p.imageUrl || '',
        stock: p.stockLevel > 0,
        oemNumbers: p.oemNumbers?.map(o => o.code) || [],
        compatibility: p.vehicles?.map(v => `${v.make} ${v.model}`) || []
      }));
    }, 300);
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
  
  static async getAllProductIdsForSitemap() {
     return this.productRepo.find({
       select: { id: true }
       // Note: TypeORM doesn't automatically select updateAt unless specified if it's not in the select object, 
       // but find() without relations is fast.
     });
  }
}
