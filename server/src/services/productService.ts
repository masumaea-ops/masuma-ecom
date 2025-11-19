
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../lib/cache';

const prisma = new PrismaClient();

export class ProductService {
  
  static async getAllProducts(query: string = '', category: string = 'All') {
    const cacheKey = `products:list:${query}:${category}`;

    return CacheService.getOrSet(cacheKey, async () => {
      const whereClause: any = {
        AND: [],
      };

      // Category Filter
      if (category && category !== 'All') {
        whereClause.AND.push({
          category: { name: category }
        });
      }

      // Search Logic (Name, SKU, or OEM)
      if (query) {
        whereClause.AND.push({
          OR: [
            { name: { contains: query } }, // Case insensitive in MySQL usually
            { sku: { contains: query } },
            { 
              oemNumbers: {
                some: {
                  code: { contains: query }
                }
              }
            }
          ]
        });
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
          oemNumbers: true,
          compatibility: {
            include: { vehicle: true }
          }
        },
        take: 50, // Limit for performance
      });

      // Transform for frontend
      return products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
        price: Number(p.price),
        description: p.description,
        image: p.imageUrl || '',
        stock: p.stockLevel > 0,
        oemNumbers: p.oemNumbers.map(o => o.code),
        compatibility: p.compatibility.map(c => `${c.vehicle.make} ${c.vehicle.model}`)
      }));
    }, 300); // Short TTL (5 min) for list results as stock/prices change
  }

  static async getProductById(id: string) {
    const cacheKey = `product:detail:${id}`;
    return CacheService.getOrSet(cacheKey, async () => {
      return prisma.product.findUnique({
        where: { id },
        include: {
          oemNumbers: true,
          compatibility: { include: { vehicle: true } }
        }
      });
    }, 3600); // Long TTL (1 hour) for static product details
  }
  
  // Helper to generate Sitemap data
  static async getAllProductIdsForSitemap() {
     return prisma.product.findMany({
       select: { id: true, updatedAt: true }
     });
  }
}
