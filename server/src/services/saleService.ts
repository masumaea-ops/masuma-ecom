
import { AppDataSource } from '../config/database';
import { Sale } from '../entities/Sale';
import { ProductStock } from '../entities/ProductStock';
import { User } from '../entities/User';
import { Branch } from '../entities/Branch';
import { Customer } from '../entities/Customer';
import { Order } from '../entities/Order';
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
  customerName?: string; // Added fallback name
  paymentDetails?: any;
}

export class SaleService {
  static async createSale(data: CreateSaleDto) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Calculate Tax (Assumes inclusive VAT 16% for all items for simplicity)
      const taxRate = 0.16;
      const netAmount = data.totalAmount / (1 + taxRate);
      const taxAmount = data.totalAmount - netAmount;

      // 1. Create Sale Record
      const sale = new Sale();
      sale.receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      sale.branch = { id: data.branchId } as Branch;
      sale.cashier = { id: data.cashierId } as User;
      
      // Handle Customer Linking & Snapshot
      if (data.customerId) {
          const customer = await queryRunner.manager.findOneBy(Customer, { id: data.customerId });
          if (customer) {
              sale.customer = customer;
              sale.customerName = customer.name; // Snapshot name for historical accuracy
          }
      } else if (data.customerName) {
          // Fallback if no Customer ID is found (e.g. Guest Order)
          sale.customerName = data.customerName;
      } else {
          sale.customerName = "Walk-in Customer";
      }
      
      sale.itemsSnapshot = data.items;
      sale.itemsCount = data.items.length;
      sale.totalAmount = data.totalAmount;
      sale.netAmount = parseFloat(netAmount.toFixed(2));
      sale.taxAmount = parseFloat(taxAmount.toFixed(2));
      
      sale.paymentMethod = data.paymentMethod;
      sale.paymentDetails = data.paymentDetails;

      // 2. Call KRA eTIMS
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

  // NEW METHOD: Converts an existing Order to a Sale (updating stats and inventory)
  static async createSaleFromOrder(order: Order, cashierUser?: User) {
    // Check if this order has already been processed into a sale (via paymentDetails reference check)
    // This is a basic idempotency check.
    const existingSale = await AppDataSource.getRepository(Sale).createQueryBuilder("sale")
        .where("JSON_EXTRACT(sale.paymentDetails, '$.orderReference') = :orderRef", { orderRef: order.orderNumber })
        .getOne();

    if (existingSale) {
        console.log(`Order ${order.orderNumber} already converted to Sale ${existingSale.receiptNumber}. Skipping.`);
        return existingSale;
    }

    // Use the order's existing items to map to SaleItemDto
    const defaultBranchId = (cashierUser?.branch?.id) || (await AppDataSource.getRepository(Branch).findOne({where: {code: 'NBI-HQ'}}))?.id;
    
    // Fallback system user if no cashier provided (e.g. M-Pesa auto-confirmation)
    const systemUserId = cashierUser?.id || (await AppDataSource.getRepository(User).findOne({where: {role: 'ADMIN' as any}}))?.id;

    if (!defaultBranchId || !systemUserId) {
        throw new Error("Configuration Error: Cannot determine fulfillment branch or system user.");
    }

    // Map Order Items to Sale Items
    // Note: order.items must be loaded with relations to Product
    const saleItems: SaleItemDto[] = order.items.map(item => ({
        productId: item.product.id,
        name: item.product.name || 'Order Item',
        quantity: item.quantity,
        price: Number(item.price)
    }));

    // Look up customer
    let customerId = undefined;
    if (order.customerEmail || order.customerPhone) {
        const customerRepo = AppDataSource.getRepository(Customer);
        const existingCustomer = await customerRepo.findOne({
            where: [
                { email: order.customerEmail },
                { phone: order.customerPhone }
            ]
        });
        if (existingCustomer) customerId = existingCustomer.id;
    }

    return this.createSale({
        items: saleItems,
        totalAmount: Number(order.totalAmount), // Explicit Number cast
        paymentMethod: 'ORDER_PAYMENT', // Differentiates from POS Cash
        paymentDetails: { orderReference: order.orderNumber },
        branchId: defaultBranchId,
        cashierId: systemUserId,
        customerId: customerId,
        customerName: order.customerName // Explicitly pass order name as fallback
    });
  }
}
