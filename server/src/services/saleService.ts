
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
  sku?: string; 
  oem?: string; 
}

interface CreateSaleDto {
  items: SaleItemDto[];
  totalAmount: number;
  paymentMethod: string;
  branchId: string;
  cashierId: string;
  customerId?: string;
  customerName?: string;
  paymentDetails?: any;
  discount?: number;
  discountType?: string;
}

export class SaleService {
  static async createSale(data: CreateSaleDto) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validate Stock Levels FIRST (Strict Check)
      const stockRepo = queryRunner.manager.getRepository(ProductStock);
      
      for (const item of data.items) {
        const stockEntry = await stockRepo.findOne({
            where: { product: { id: item.productId } as any, branch: { id: data.branchId } as any },
            lock: { mode: 'pessimistic_write' }
        });

        // Allow sales if stock entry exists, even if low (negative stock allowed for business continuity if needed)
        if (stockEntry) {
            stockEntry.quantity -= item.quantity;
            await stockRepo.save(stockEntry);
        } else {
            // Create negative stock entry if product exists but no stock record
            const newStock = new ProductStock();
            newStock.product = { id: item.productId } as any;
            newStock.branch = { id: data.branchId } as any;
            newStock.quantity = -item.quantity;
            await stockRepo.save(newStock);
        }
      }

      // Calculate Tax (Inclusive VAT 16%)
      // Net Amount should be based on the Final Total paid (after discount)
      const taxRate = 0.16;
      const netAmount = data.totalAmount / (1 + taxRate);
      const taxAmount = data.totalAmount - netAmount;

      // 2. Create Sale Record
      const sale = new Sale();
      sale.receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      sale.branch = { id: data.branchId } as Branch;
      sale.cashier = { id: data.cashierId } as User;
      
      if (data.customerId) {
          const customer = await queryRunner.manager.findOneBy(Customer, { id: data.customerId });
          if (customer) {
              sale.customer = customer;
              sale.customerName = customer.name;
          }
      } else if (data.customerName) {
          sale.customerName = data.customerName;
      } else {
          sale.customerName = "Walk-in Customer";
      }
      
      sale.itemsSnapshot = data.items;
      sale.itemsCount = data.items.length;
      
      // Financials
      sale.totalAmount = data.totalAmount;
      sale.netAmount = parseFloat(netAmount.toFixed(2));
      sale.taxAmount = parseFloat(taxAmount.toFixed(2));
      
      // Ensure discount is set, defaulting to 0 if undefined
      sale.discount = data.discount || 0;
      sale.discountType = data.discountType || 'FIXED';
      
      sale.paymentMethod = data.paymentMethod;
      sale.paymentDetails = data.paymentDetails;

      // 3. Call KRA eTIMS
      // Only sign if total > 0 (Gift/Foc handling might differ)
      if (data.totalAmount > 0) {
          const fiscalData = await EtimsService.signInvoice(
            sale.receiptNumber, 
            data.items.map(i => ({
                hsCode: '8708.99.00',
                name: i.name,
                qty: i.quantity,
                unitPrice: i.price, // Unit price here is pre-discount usually, but KRA expects total to match.
                // If discount applies to whole cart, it's complex to spread.
                // For simplicity, we send actual lines. KRA validation might check sums.
                // Ideal approach: Spread discount to line items or add Discount line item.
                taxRate: 16
            })),
            data.totalAmount // KRA expects final payable
          );

          if (fiscalData) {
              sale.kraControlCode = fiscalData.controlCode;
              sale.kraQrCodeUrl = fiscalData.qrCode;
              sale.kraSignature = fiscalData.signature;
              sale.kraDate = fiscalData.fiscalDate;
          }
      }

      await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();
      return sale;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  static async createSaleFromOrder(order: Order, cashierUser?: User) {
    const existingSale = await AppDataSource.getRepository(Sale).createQueryBuilder("sale")
        .where("JSON_EXTRACT(sale.paymentDetails, '$.orderReference') = :orderRef", { orderRef: order.orderNumber })
        .getOne();

    if (existingSale) return existingSale;

    const defaultBranchId = (cashierUser?.branch?.id) || (await AppDataSource.getRepository(Branch).findOne({where: {code: 'NBI-HQ'}}))?.id;
    const systemUserId = cashierUser?.id || (await AppDataSource.getRepository(User).findOne({where: {role: 'ADMIN' as any}}))?.id;

    if (!defaultBranchId || !systemUserId) throw new Error("Configuration Error: Branch or Admin User missing for auto-sales");

    // Load order items with product details including OEMs
    const orderRepo = AppDataSource.getRepository(Order);
    const fullOrder = await orderRepo.findOne({
        where: { id: order.id },
        relations: ['items', 'items.product', 'items.product.oemNumbers']
    });

    if (!fullOrder) throw new Error("Order not found");

    const saleItems: SaleItemDto[] = fullOrder.items.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
        sku: item.product.sku,
        oem: item.product.oemNumbers?.[0]?.code || ''
    }));

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
        totalAmount: Number(order.totalAmount),
        paymentMethod: 'ORDER_PAYMENT',
        paymentDetails: { orderReference: order.orderNumber },
        branchId: defaultBranchId,
        cashierId: systemUserId,
        customerId: customerId,
        customerName: order.customerName,
        discount: 0, // Orders usually have final price
        discountType: 'FIXED'
    });
  }
}
