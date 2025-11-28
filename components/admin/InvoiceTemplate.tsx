
import React, { forwardRef, useState, useEffect } from 'react';
import { Sale, Order, Quote } from '../../types';
import { QrCode, Phone, Mail, MapPin } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

interface InvoiceTemplateProps {
  data: Sale | Order | Quote;
  type: 'TAX_INVOICE' | 'RECEIPT' | 'WAYBILL' | 'QUOTE';
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ data, type }, ref) => {
  // Dynamic Settings State
  const [settings, setSettings] = useState({
      companyName: 'MASUMA AUTOPARTS EAST AFRICA LTD',
      address: 'Ruby Mall, Shop FF25 First Floor Behind NCBA Bank Accra Road',
      phone: '+254 792 506 590',
      email: 'sales@masuma.africa',
      pin: 'P051234567Z'
  });

  useEffect(() => {
      const loadSettings = async () => {
          const cached = localStorage.getItem('masuma_settings_cache');
          if (cached) {
              updateState(JSON.parse(cached));
          }
          try {
              const res = await apiClient.get('/settings');
              localStorage.setItem('masuma_settings_cache', JSON.stringify(res.data));
              updateState(res.data);
          } catch (e) {
              // Fail silently to defaults
          }
      };
      loadSettings();
  }, []);

  const updateState = (data: any) => {
      setSettings({
          companyName: data.COMPANY_NAME || 'MASUMA AUTOPARTS EAST AFRICA LTD',
          address: data.BRANCH_ADDRESS || data.CMS_CONTACT_ADDRESS || 'Ruby Mall, Shop FF25 First Floor Behind NCBA Bank Accra Road',
          phone: data.BRANCH_PHONE || data.CMS_CONTACT_PHONE || '+254 792 506 590',
          email: data.SUPPORT_EMAIL || data.CMS_CONTACT_EMAIL || 'sales@masuma.africa',
          pin: data.KRA_PIN || 'P051234567Z'
      });
  };

  const isSale = (d: any): d is Sale => 'receiptNumber' in d;
  const isQuote = (d: any): d is Quote => 'quoteNumber' in d;
  
  let docNumber, date, customer, items, total;

  if (isSale(data)) {
      docNumber = data.receiptNumber;
      date = data.createdAt || data.date;
      customer = data.customerName || 'Walk-in';
      items = (data as any).itemsSnapshot || [];
      total = data.totalAmount;
  } else if (isQuote(data)) {
      docNumber = data.quoteNumber;
      date = data.date || (data as any).createdAt;
      customer = data.customerName;
      items = data.items || [];
      total = data.total;
  } else {
      docNumber = data.orderNumber;
      date = data.date || (data as any).createdAt;
      customer = data.customerName;
      items = data.items || [];
      total = data.total || (data as any).totalAmount;
  }

  const tax = Number(total) * 0.16;
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

  // --- 80mm THERMAL RECEIPT LAYOUT ---
  if (type === 'RECEIPT') {
      return (
        <div ref={ref} className="bg-white text-black font-mono text-[12px] w-[79mm] p-2 mx-auto leading-tight shadow-none print:w-full print:shadow-none">
            <div className="text-center mb-2">
                <h1 className="font-bold text-sm uppercase mb-1">{settings.companyName}</h1>
                <p className="text-[10px]">{settings.address}</p>
                <p className="text-[10px]">Tel: {settings.phone}</p>
                <p className="text-[10px]">PIN: {settings.pin}</p>
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            <div className="flex justify-between text-[10px] mb-1">
                <span>Receipt:</span>
                <span className="font-bold">{docNumber}</span>
            </div>
            <div className="flex justify-between text-[10px] mb-1">
                <span>Date:</span>
                <span>{new Date(date).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] mb-1">
                <span>Customer:</span>
                <span className="font-bold max-w-[120px] truncate text-right">{customer}</span>
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            <div className="mb-2">
                <div className="flex font-bold text-[10px] mb-1">
                    <span className="flex-1">Item</span>
                    <span className="w-8 text-center">Qty</span>
                    <span className="w-14 text-right">Total</span>
                </div>
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="text-[10px] mb-2">
                        <div className="flex">
                            <span className="flex-1 font-bold">{item.name}</span>
                            <span className="w-8 text-center">{item.qty || item.quantity}</span>
                            <span className="w-14 text-right">{(Number(item.price || item.unitPrice) * Number(item.qty || item.quantity)).toLocaleString()}</span>
                        </div>
                        {(item.sku || item.oem) && (
                            <div className="text-[9px] text-gray-500 pl-1">
                                {item.sku ? `SKU: ${item.sku}` : ''} {item.oem ? `| OEM: ${item.oem}` : ''}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                    <span>Net Amount:</span>
                    <span>{net.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between">
                    <span>VAT (16%):</span>
                    <span>{tax.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between font-bold text-sm mt-1">
                    <span>TOTAL:</span>
                    <span>KES {Number(total).toLocaleString()}</span>
                </div>
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            <div className="text-center text-[10px] space-y-1">
                {isSale(data) && data.kraControlCode && (
                    <>
                        <p className="font-bold">KRA Control: {data.kraControlCode}</p>
                        <div className="flex justify-center my-2">
                            <QrCode size={64} className="text-black" />
                        </div>
                    </>
                )}
                <p className="uppercase font-bold">Thank You For Shopping!</p>
                <p>Goods once sold are not returnable after 7 days.</p>
                <p className="mt-2 text-[8px] text-gray-500">System: masuma.africa</p>
            </div>
        </div>
      );
  }

  // --- A4 STANDARD LAYOUT ---
  return (
    <div ref={ref} className="bg-white text-black font-sans w-full max-w-[210mm] mx-auto p-10 min-h-[297mm] relative shadow-lg print:shadow-none print:w-[210mm] print:h-[297mm]">
      <div className="flex justify-between items-start border-b-4 border-masuma-orange pb-6 mb-8">
        <div className="max-w-[60%]">
            <h1 className="text-3xl font-bold text-masuma-dark tracking-tighter mb-1 font-display uppercase">{settings.companyName}</h1>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4">Official Distributor</p>
            <div className="text-xs space-y-1 text-gray-600">
                <p className="flex items-start gap-2"><MapPin size={10} className="text-masuma-orange mt-0.5 shrink-0"/> <span className="whitespace-pre-line">{settings.address}</span></p>
                <p className="flex items-center gap-2"><Mail size={10} className="text-masuma-orange shrink-0"/> {settings.email}</p>
                <p className="flex items-center gap-2"><Phone size={10} className="text-masuma-orange shrink-0"/> {settings.phone}</p>
                <p className="mt-2 font-bold">PIN: {settings.pin} | VAT: 0123456V</p>
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

      <div className="flex justify-between mb-10 bg-gray-50 p-6 rounded-sm border border-gray-100">
        <div>
            <h3 className="text-xs font-bold text-masuma-orange uppercase mb-2">Billed To</h3>
            <p className="font-bold text-lg text-gray-800">{customer}</p>
        </div>
        {type === 'WAYBILL' && (
            <div className="text-right">
                <h3 className="text-xs font-bold text-masuma-orange uppercase mb-2">Ship To / Destination</h3>
                <p className="font-bold text-lg text-gray-800">{customer}</p>
            </div>
        )}
      </div>

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
                            <span className="text-xs font-mono text-gray-500">
                                {item.sku ? `SKU: ${item.sku}` : ''} {item.oem ? `| OEM: ${item.oem}` : ''}
                            </span>
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
              </div>
              <div className="text-right">
                  <h4 className="font-bold text-xs uppercase text-masuma-dark mb-4">Authorized Signature</h4>
                  <div className="h-16 border-b border-black mb-2"></div>
                  <p className="text-xs text-gray-500">For {settings.companyName}</p>
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
