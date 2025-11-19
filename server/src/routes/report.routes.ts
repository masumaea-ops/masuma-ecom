
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Sale } from '../entities/Sale';
import { ProductStock } from '../entities/ProductStock';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Helper to escape CSV fields
const escapeCsv = (field: any) => {
  if (field === null || field === undefined) return '';
  const stringValue = String(field);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

// GET /api/reports/sales
router.get('/sales', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(0); // Epoch if no start
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
        
        // Adjust end date to end of day
        endDate.setHours(23, 59, 59, 999);

        const salesRepo = AppDataSource.getRepository(Sale);
        
        // Stream headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sales_report_${Date.now()}.csv"`);
        
        res.write('Receipt Number,Date,Customer,Payment Method,Items Count,Total Amount (KES),Cashier,KRA Status\n');

        // Create a stream
        const stream = await salesRepo.createQueryBuilder('sale')
            .leftJoinAndSelect('sale.customer', 'customer')
            .leftJoinAndSelect('sale.cashier', 'cashier')
            .where('sale.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
            .orderBy('sale.createdAt', 'DESC')
            .stream();

        for await (const sale of stream) {
            const row = [
                sale.sale_receiptNumber,
                new Date(sale.sale_createdAt).toLocaleString(),
                sale.customer_name || 'Walk-in',
                sale.sale_paymentMethod,
                sale.sale_itemsSnapshot ? JSON.parse(sale.sale_itemsSnapshot).length : 0,
                sale.sale_totalAmount,
                sale.cashier_fullName || 'System',
                sale.sale_kraControlCode ? 'Signed' : 'Pending'
            ].map(escapeCsv).join(',');

            res.write(row + '\n');
        }

        res.end();
    } catch (error) {
        console.error(error);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to generate report' });
    }
});

// GET /api/reports/inventory
router.get('/inventory', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="inventory_valuation_${Date.now()}.csv"`);
        
        res.write('Product Name,SKU,Category,Branch,Quantity,Unit Price,Total Value,Status\n');

        const stockStream = await AppDataSource.getRepository(ProductStock)
            .createQueryBuilder('stock')
            .leftJoinAndSelect('stock.product', 'product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('stock.branch', 'branch')
            .stream();

        for await (const item of stockStream) {
            const qty = item.stock_quantity;
            const price = item.product_price;
            const value = qty * price;
            const status = qty <= item.stock_lowStockThreshold ? 'LOW STOCK' : 'OK';

            const row = [
                item.product_name,
                item.product_sku,
                item.category_name,
                item.branch_name,
                qty,
                price,
                value,
                status
            ].map(escapeCsv).join(',');

            res.write(row + '\n');
        }

        res.end();
    } catch (error) {
        console.error(error);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to generate report' });
    }
});

export default router;
