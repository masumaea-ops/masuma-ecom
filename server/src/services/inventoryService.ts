
import { AppDataSource } from '../config/database';
import { ProductStock } from '../entities/ProductStock';
import { Product } from '../entities/Product';
import { Branch } from '../entities/Branch';

export class InventoryService {
  private static stockRepo = AppDataSource.getRepository(ProductStock);

  static async getStockForBranch(branchId: string, lowStockOnly: boolean = false) {
    const query = this.stockRepo.createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .where('stock.branchId = :branchId', { branchId });

    if (lowStockOnly) {
      query.andWhere('stock.quantity <= stock.lowStockThreshold');
    }

    return query.getMany();
  }

  static async updateStock(productId: string, branchId: string, quantity: number, operation: 'set' | 'add' | 'subtract') {
    let stockEntry = await this.stockRepo.findOne({
      where: { product: { id: productId }, branch: { id: branchId } }
    });

    if (!stockEntry) {
      // Create new entry if it doesn't exist
      stockEntry = new ProductStock();
      stockEntry.product = { id: productId } as Product;
      stockEntry.branch = { id: branchId } as Branch;
      stockEntry.quantity = 0;
      stockEntry.lowStockThreshold = 5; // Default
    }

    if (operation === 'set') {
      stockEntry.quantity = quantity;
    } else if (operation === 'add') {
      stockEntry.quantity += quantity;
    } else if (operation === 'subtract') {
      stockEntry.quantity = Math.max(0, stockEntry.quantity - quantity);
    }

    return this.stockRepo.save(stockEntry);
  }
}
