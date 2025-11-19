
import { AppDataSource } from '../config/database';
import { Sale } from '../entities/Sale';
import { ProductStock } from '../entities/ProductStock';
import { User } from '../entities/User';
import { Branch } from '../entities/Branch';
import { EtimsService } from './etimsService';

interface SaleItemDto {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface CreateSaleDto {
  items: SaleItemDto[];
  totalAmount: number;
  paymentMethod: string;
  branchId: string;
  cashierId: string;
  customerId?: string;
  paymentDetails?: any;
}

export class SaleService {
  static async createSale(data: CreateSaleDto) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Calculate Tax (Assumes inclusive VAT 16% for all items for simplicity)
      // In a complex system, tax is per-product based on HS Code
      const taxRate = 0.16;
      const netAmount = data.totalAmount / (1 + taxRate);
      const taxAmount = data.totalAmount - netAmount;

      // 1. Create Sale Record
      const sale = new Sale();
      sale.receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      sale.branch = { id: data.branchId } as Branch;
      sale.cashier = { id: data.cashierId } as User;
      if (data.customerId) sale.customer = { id: data.customerId } as any;
      
      sale.itemsSnapshot = data.items;
      sale.totalAmount = data.totalAmount;
      sale.netAmount = parseFloat(netAmount.toFixed(2));
      sale.taxAmount = parseFloat(taxAmount.toFixed(2));
      
      sale.paymentMethod = data.paymentMethod;
      sale.paymentDetails = data.paymentDetails;

      // 2. Call KRA eTIMS (Non-blocking or Blocking based on strictness)
      // We assume strict compliance: Invoice must be signed before saving
      const fiscalData = await EtimsService.signInvoice(
        sale.receiptNumber, 
        data.items.map(i => ({
            hsCode: '8708.99.00', // Generic Auto Parts HS Code
            name: i.name,
            qty: i.quantity,
            unitPrice: i.price,
            taxRate: 16
        })),
        data.totalAmount
      );

      if (fiscalData) {
          sale.kraControlCode = fiscalData.controlCode;
          sale.kraQrCodeUrl = fiscalData.qrCode;
          sale.kraSignature = fiscalData.signature;
          sale.kraDate = fiscalData.fiscalDate;
      }

      await queryRunner.manager.save(sale);

      // 3. Deduct Inventory
      for (const item of data.items) {
        const stockRepo = queryRunner.manager.getRepository(ProductStock);
        
        const stockEntry = await stockRepo.findOne({
            where: { product: { id: item.productId }, branch: { id: data.branchId } },
            lock: { mode: 'pessimistic_write' }
        });

        if (stockEntry) {
            stockEntry.quantity = Math.max(0, stockEntry.quantity - item.quantity);
            await stockRepo.save(stockEntry);
        } else {
            const newStock = new ProductStock();
            newStock.product = { id: item.productId } as any;
            newStock.branch = { id: data.branchId } as any;
            newStock.quantity = -item.quantity; // Allow oversell with warning
            await stockRepo.save(newStock);
        }
      }

      await queryRunner.commitTransaction();
      return sale;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
