
import React, { forwardRef } from 'react';
import { Sale, Order, Quote } from '../../types';
import { QrCode, Phone, Mail, MapPin } from 'lucide-react';

interface InvoiceTemplateProps {
  data: Sale | Order | Quote;
  type: 'TAX_INVOICE' | 'RECEIPT' | 'WAYBILL' | 'QUOTE';
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ data, type }, ref) => {
  // Helpers
  const isSale = (d: any): d is Sale => 'receiptNumber' in d;
  const isQuote = (d: any): d is Quote => 'quoteNumber' in d;
  
  let docNumber, date, customer, address, phone, items, total, status;

  if (isSale(data)) {
      docNumber = data.receiptNumber;
      date = data.createdAt || data.date;
      customer = data.customerName || 'Walk-in';
      address = 'N/A';
      phone = 'N/A'; // Sales typically don't store deep customer info unless linked
      items = (data as any).itemsSnapshot || [];
      total = data.totalAmount;
      status = 'PAID';
  } else if (isQuote(data)) {
      docNumber = data.quoteNumber;
      date = data.date || (data as any).createdAt;
      customer = data.customerName;
      address = 'N/A';
      phone = data.customerPhone || 'N/A';
      items = data.items || [];
      total = data.total;
      status = data.status;
  } else {
      // Order
      docNumber = data.orderNumber;
      date = data.date || (data as any).createdAt;
      customer = data.customerName;
      address = data.shippingAddress || 'N/A';
      phone = data.customerPhone || 'N/A';
      items = data.items || [];
      total = data.total || (data as any).totalAmount;
      status = data.status;
  }

  const tax = Number(total) * 0.16; // Approx VAT included
  const net = Number(total) - tax;

  const getTitle = () => {
      switch(type) {
          case 'TAX_INVOICE': return 'TAX INVOICE';
          case 'RECEIPT': return 'OFFICIAL RECEIPT';
          case 'WAYBILL': return 'WAYBILL / DELIVERY NOTE';
          case 'QUOTE': return 'PROFORMA QUOTATION';
          default: return 'DOCUMENT';
      }
  };

  return (
    <div ref={ref} className="bg-white text-black font-sans w-full max-w-[210mm] mx-auto p-10 min-h-[297mm] relative">
      
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-masuma-orange pb-6 mb-8">
        <div>
            <h1 className="text-4xl font-bold text-masuma-dark tracking-tighter mb-1 font-display">MASUMA</h1>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4">Autoparts East Africa Ltd</p>
            
            <div className="text-xs space-y-1 text-gray-600">
                <p className="flex items-center gap-2"><MapPin size={10} className="text-masuma-orange"/> Godown 4, Enterprise Road, Ind. Area</p>
                <p className="flex items-center gap-2"><Mail size={10} className="text-masuma-orange"/> sales@masuma.africa</p>
                <p className="flex items-center gap-2"><Phone size={10} className="text-masuma-orange"/> +254 792 506 590</p>
                <p className="mt-2 font-bold">PIN: P051234567Z | VAT: 0123456V</p>
            </div>
        </div>
        <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-200 uppercase">{getTitle()}</h2>
            <div className="mt-4">
                <p className="text-sm text-gray-500 uppercase font-bold">Document No.</p>
                <p className="text-xl font-bold text-masuma-dark font-mono">{docNumber}</p>
            </div>
            <div className="mt-2">
                <p className="text-sm text-gray-500 uppercase font-bold">Date Issued</p>
                <p className="text-md font-bold text-masuma-dark">{new Date(date).toLocaleDateString()}</p>
            </div>
        </div>
      </div>

      {/* Bill To / Ship To */}
      <div className="flex justify-between mb-10 bg-gray-50 p-6 rounded-sm border border-gray-100">
        <div>
            <h3 className="text-xs font-bold text-masuma-orange uppercase mb-2">Billed To</h3>
            <p className="font-bold text-lg text-gray-800">{customer}</p>
            <p className="text-sm text-gray-600">{phone}</p>
            <p className="text-sm text-gray-600">{address !== 'N/A' ? address : ''}</p>
        </div>
        {type === 'WAYBILL' && (
            <div className="text-right">
                <h3 className="text-xs font-bold text-masuma-orange uppercase mb-2">Ship To / Destination</h3>
                <p className="font-bold text-lg text-gray-800">{address}</p>
                <p className="text-sm text-gray-600">Attn: {customer}</p>
            </div>
        )}
      </div>

      {/* Line Items */}
      <div className="mb-8">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-masuma-dark text-white text-xs uppercase tracking-wider">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Description / Part No</th>
                    <th className="p-3 text-center w-24">Qty</th>
                    {type !== 'WAYBILL' && (
                        <>
                            <th className="p-3 text-right w-32">Unit Price</th>
                            <th className="p-3 text-right w-32">Amount</th>
                        </>
                    )}
                </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
                {items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-200">
                        <td className="p-3 text-center font-mono text-gray-400">{idx + 1}</td>
                        <td className="p-3">
                            <span className="font-bold block">{item.name}</span>
                            {item.sku && <span className="text-xs font-mono text-gray-500">SKU: {item.sku}</span>}
                        </td>
                        <td className="p-3 text-center font-bold">{item.qty || item.quantity}</td>
                        {type !== 'WAYBILL' && (
                            <>
                                <td className="p-3 text-right font-mono">{Number(item.price || item.unitPrice).toLocaleString()}</td>
                                <td className="p-3 text-right font-mono font-bold">{(Number(item.price || item.unitPrice) * Number(item.qty || item.quantity)).toLocaleString()}</td>
                            </>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Totals Section */}
      {type !== 'WAYBILL' && (
          <div className="flex justify-end mb-12">
              <div className="w-1/2 md:w-1/3 space-y-3">
                  <div className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-2">
                      <span>Subtotal (Excl. VAT)</span>
                      <span className="font-mono">{net.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-2">
                      <span>VAT (16%)</span>
                      <span className="font-mono">{tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-masuma-dark pt-2 bg-gray-50 p-2 rounded">
                      <span>Total (KES)</span>
                      <span>{Number(total).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
              </div>
          </div>
      )}

      {/* Footer / Terms */}
      <div className="absolute bottom-10 left-10 right-10">
          <div className="grid grid-cols-2 gap-8 mb-8 border-t-2 border-gray-100 pt-6">
              <div>
                  {type !== 'QUOTE' && (
                    <>
                        <h4 className="font-bold text-xs uppercase text-masuma-dark mb-2">Fiscal Details</h4>
                        <div className="flex items-center gap-4">
                            <QrCode size={64} className="text-black" />
                            <div className="text-[10px] text-gray-500 space-y-1">
                                <p>Control Code: {isSale(data) ? (data.kraControlCode || 'PENDING') : 'N/A'}</p>
                                <p>Device: KRA-VSCU-001</p>
                                <p>Time: {new Date().toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </>
                  )}
                  {type === 'QUOTE' && (
                      <p className="text-xs text-gray-500 italic">
                          This quotation is valid for 7 days. Prices subject to change without notice.
                          <br/>Payment Terms: 100% Advance.
                      </p>
                  )}
                  {type === 'WAYBILL' && (
                      <div className="mt-4">
                          <p className="font-bold text-xs uppercase border-b border-black w-2/3 mb-8">Received By (Sign & Stamp)</p>
                          <p className="font-bold text-xs uppercase border-b border-black w-2/3">Date</p>
                      </div>
                  )}
              </div>
              <div className="text-right">
                  <h4 className="font-bold text-xs uppercase text-masuma-dark mb-4">Authorized Signature</h4>
                  <div className="h-16 border-b border-black mb-2"></div>
                  <p className="text-xs text-gray-500">For Masuma Autoparts East Africa Ltd</p>
              </div>
          </div>
          <div className="text-center text-[9px] text-gray-400 uppercase tracking-widest">
              Generated by Masuma ERP System • {new Date().toISOString()}
          </div>
      </div>
    </div>
  );
});

export default InvoiceTemplate;
