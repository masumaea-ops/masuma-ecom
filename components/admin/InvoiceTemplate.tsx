
import React, { forwardRef } from 'react';
import { Sale, Order } from '../../types';
import { QrCode } from 'lucide-react';

interface InvoiceTemplateProps {
  data: Sale | Order;
  type: 'TAX_INVOICE' | 'RECEIPT';
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ data, type }, ref) => {
  // Helper to check if it's a Sale or Order type
  const isSale = (d: any): d is Sale => 'receiptNumber' in d;
  
  const docNumber = isSale(data) ? data.receiptNumber : data.orderNumber;
  const date = isSale(data) ? data.date : data.date;
  const customer = isSale(data) ? (data.customerName || 'Walk-in Customer') : data.customerName;
  
  // normalize items
  const items = isSale(data) 
    ? (data as any).itemsSnapshot || [] // Assuming sales have snapshot
    : data.items;

  const total = isSale(data) ? data.totalAmount : data.total;
  const tax = total * 0.16; // Approx VAT included
  const net = total - tax;

  return (
    <div ref={ref} className="bg-white p-8 max-w-3xl mx-auto text-sm text-gray-900 font-mono leading-relaxed hidden print:block">
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">MASUMA AUTOPARTS E.A. LTD</h1>
        <p>Godown 4, Enterprise Road, Industrial Area</p>
        <p>P.O. Box 12345-00100, Nairobi, Kenya</p>
        <p>Tel: +254 792 506 590 | Email: sales@masuma.africa</p>
        <p className="font-bold mt-2">PIN: P051234567Z | VAT No: 0123456V</p>
      </div>

      {/* Title */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-bold uppercase underline">{type === 'TAX_INVOICE' ? 'TAX INVOICE' : 'CASH RECEIPT'}</h2>
          <p className="mt-2">To: <span className="font-bold">{customer}</span></p>
          <p>PIN: _________________</p>
        </div>
        <div className="text-right">
          <p>Invoice #: <span className="font-bold">{docNumber}</span></p>
          <p>Date: <span>{new Date(date).toLocaleString()}</span></p>
          <p>Currency: <span>KES</span></p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="border-t-2 border-b-2 border-black">
            <th className="py-2 text-left w-12">#</th>
            <th className="py-2 text-left">Description</th>
            <th className="py-2 text-center w-20">Qty</th>
            <th className="py-2 text-right w-32">Unit Price</th>
            <th className="py-2 text-right w-32">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-300 border-dashed">
              <td className="py-2">{idx + 1}</td>
              <td className="py-2">{item.name}</td>
              <td className="py-2 text-center">{item.qty || item.quantity}</td>
              <td className="py-2 text-right">{(item.price || item.unitPrice || 0).toLocaleString()}</td>
              <td className="py-2 text-right">{((item.price || item.unitPrice || 0) * (item.qty || item.quantity)).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span>Net Amount:</span>
            <span>{net.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT (16%):</span>
            <span>{tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t-2 border-black pt-2">
            <span>TOTAL:</span>
            <span>{total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>

      {/* KRA / Footer */}
      <div className="border-t-2 border-black pt-4">
        <div className="flex justify-between items-center">
           <div>
              <p className="font-bold uppercase mb-1">Fiscal Information:</p>
              <p>CU Serial: KRA-VSCU-001-992</p>
              <p>Control Code: {isSale(data) ? data.kraControlCode : 'PENDING'}</p>
              <p>Date: {new Date().toLocaleString()}</p>
           </div>
           <div className="flex flex-col items-center">
              <QrCode size={80} className="mb-1" />
              <span className="text-[10px] uppercase">Scan to Verify</span>
           </div>
        </div>
        <p className="text-center mt-8 italic text-xs">
          Goods once sold are not returnable. Warranty valid for 12 months on manufacturer defects only.
        </p>
        <p className="text-center font-bold mt-2">*** END OF RECEIPT ***</p>
      </div>
    </div>
  );
});

export default InvoiceTemplate;
