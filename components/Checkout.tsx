import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowLeft, Smartphone, CreditCard, Loader2, CheckCircle, AlertCircle, MapPin, User, Mail, Phone, Lock, ChevronRight, Package, Truck, Ticket, Tag, X } from 'lucide-react';
import { CartItem, Product, ViewState, PromoCode } from '../types';
import { apiClient } from '../utils/apiClient';
import Price from './Price';
import SEO from './SEO';
import { trackCheckoutInitiated, trackEvent, trackCheckoutComplete } from '../utils/analytics';

interface CheckoutProps {
  cartItems: CartItem[];
  onSuccess: () => void;
  setView: (view: ViewState) => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, onSuccess, setView }) => {
  const [step, setStep] = useState<'details' | 'processing' | 'success' | 'error'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'CASH'>('MPESA');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  let discountAmount = 0;
  if (appliedPromo) {
      if (appliedPromo.type === 'PERCENTAGE') {
          discountAmount = subtotal * (appliedPromo.value / 100);
      } else {
          discountAmount = Math.min(appliedPromo.value, subtotal);
      }
  }

  const discountedSubtotal = subtotal - discountAmount;
  const vatAmount = discountedSubtotal * 0.16;
  const deliveryFee = 0; 
  const total = discountedSubtotal + vatAmount + deliveryFee;

  useEffect(() => {
    if (step === 'processing') {
      trackCheckoutInitiated(total, cartItems.length);
    }
  }, [step, cartItems, total]);

  useEffect(() => {
    let interval: any;
    if (step === 'processing' && currentOrderId && paymentMethod === 'MPESA') {
      interval = setInterval(async () => {
        try {
          const res = await apiClient.get(`/orders/${currentOrderId}/status`);
          if (res.data.status === 'PAID') {
            setStep('success');
            trackCheckoutComplete(currentOrderId, total);
            clearInterval(interval);
            setTimeout(() => {
              onSuccess();
              setView('HOME');
            }, 4000);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [step, currentOrderId, paymentMethod, onSuccess, setView]);

  const handleApplyPromo = async () => {
      if (!promoInput.trim()) return;
      setIsValidatingPromo(true);
      setPromoError('');
      try {
          // In a real app, this endpoint would verify existence, dates, and limits
          const res = await apiClient.get(`/promo/validate?code=${promoInput.toUpperCase()}`);
          if (res.data.valid) {
              setAppliedPromo(res.data.promo);
              setPromoInput('');
              trackEvent('Ecommerce', 'Apply Promo Code', promoInput.toUpperCase());
          } else {
              setPromoError(res.data.message || 'Invalid or expired code.');
              trackEvent('Ecommerce', 'Promo Code Error', promoInput.toUpperCase());
          }
      } catch (e) {
          // Fallback demo logic for common codes
          if (promoInput.toUpperCase() === 'MASUMA10') {
              setAppliedPromo({
                  id: 'demo-1',
                  code: 'MASUMA10',
                  type: 'PERCENTAGE',
                  value: 10,
                  startDate: '', endDate: '', usageLimit: 0, currentUsage: 0, isActive: true
              });
              setPromoInput('');
          } else {
              setPromoError('Promo code not recognized.');
          }
      } finally {
          setIsValidatingPromo(false);
      }
  };

  const removePromo = () => setAppliedPromo(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (cartItems.length === 0) {
        setError('Your cart is empty.');
        return;
    }

    setIsProcessing(true);
    setStep('processing');
    trackEvent('Ecommerce', 'Order Attempt', paymentMethod);

    try {
      const endpoint = paymentMethod === 'MPESA' ? '/mpesa/pay' : '/orders';
      const res = await apiClient.post(endpoint, {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: formData.address,
        paymentMethod: paymentMethod === 'CASH' ? 'CASH_ON_DELIVERY' : 'MPESA',
        promoCodeUsed: appliedPromo?.code,
        discountAmount: discountAmount,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      });

      if (paymentMethod === 'MPESA') {
          setCurrentOrderId(res.data.orderId);
          trackEvent('Ecommerce', 'M-Pesa Payment Initiated', res.data.orderId);
      } else {
          setStep('success');
          trackCheckoutComplete(res.data.id || 'CASH_ORDER', total);
          trackEvent('Ecommerce', 'Order Success', 'CASH_ON_DELIVERY');
          setTimeout(() => {
            onSuccess();
            setView('HOME');
          }, 4000);
      }

    } catch (err: any) {
      setStep('details');
      setIsProcessing(false);
      setError(err.response?.data?.error || 'Order submission failed. Please check your connection.');
    }
  };

  const handleBack = () => {
      setView('CATALOG');
      const newUrl = `/?view=CATALOG`;
      window.history.pushState({ path: newUrl }, '', newUrl);
  };

  if (cartItems.length === 0 && step !== 'success') {
      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
              <Package size={64} className="text-gray-200 mb-4" />
              <h2 className="text-2xl font-bold text-masuma-dark mb-2">Cart is empty</h2>
              <p className="text-gray-500 mb-8">Add some Japanese precision parts to your cart first.</p>
              <button onClick={handleBack} className="bg-masuma-orange text-white px-8 py-3 rounded font-bold uppercase tracking-widest text-xs">Return to Catalog</button>
          </div>
      );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO title="Secure Checkout" description="Finalize your order with Masuma Autoparts EA." />
      
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-[50] hidden md:block">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
           <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-masuma-orange font-bold text-[11px] uppercase tracking-widest transition">
               <ArrowLeft size={14} /> Return to Store
           </button>
           <div className="flex items-center gap-2">
               <Lock size={14} className="text-green-600" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Secure Regional Checkout</span>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
          
          <div className="space-y-8">
            
            {step === 'success' ? (
                <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] shadow-xl border border-green-100 text-center animate-scale-up">
                    <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle size={56} />
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-masuma-dark font-display uppercase tracking-tight mb-4">Order Confirmed!</h1>
                    <p className="text-gray-600 text-lg max-w-lg mx-auto mb-8">
                        Thank you for choosing Masuma Japanese precision. Your order is being processed and we will contact you at <strong>{formData.phone}</strong> shortly.
                    </p>
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Redirecting to Home...</span>
                    </div>
                </div>
            ) : step === 'processing' ? (
                <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] shadow-xl border border-masuma-orange text-center animate-fade-in">
                    <div className="relative w-32 h-32 mx-auto mb-8">
                        <div className="absolute inset-0 border-8 border-gray-100 rounded-full"></div>
                        <div className="absolute inset-0 border-8 border-masuma-orange rounded-full border-t-transparent animate-spin"></div>
                        <Smartphone className="absolute inset-0 m-auto text-masuma-orange" size={48} />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-masuma-dark font-display uppercase mb-4">Check your phone</h2>
                    <p className="text-gray-600 text-lg max-w-md mx-auto mb-8 leading-relaxed">
                        An M-Pesa STK Push has been sent to <strong>{formData.phone}</strong>. Please enter your PIN to finalize the transaction of <span className="font-bold text-masuma-dark"><Price amount={total} /></span>.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-masuma-orange font-bold animate-pulse">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs uppercase tracking-widest">Waiting for Safaricom Confirmation...</span>
                    </div>
                    <button 
                        onClick={() => setStep('details')}
                        className="mt-12 text-sm font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest underline transition"
                    >
                        Cancel and try again
                    </button>
                </div>
            ) : (
                <>
                <div className="flex flex-col gap-2 pt-4 md:pt-0">
                    <h1 className="text-4xl font-bold text-masuma-dark font-display uppercase tracking-tight">Checkout</h1>
                    <p className="text-gray-500">Provide your delivery and contact details to finalize the order.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10 pb-20">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3 animate-slide-up">
                            <AlertCircle size={24} />
                            <span className="text-sm font-bold">{error}</span>
                        </div>
                    )}

                    <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                            <div className="w-12 h-12 bg-masuma-dark text-white rounded-2xl flex items-center justify-center shadow-lg shadow-masuma-dark/10">
                                <User size={24} />
                            </div>
                            <div>
                                <h2 className="font-black text-masuma-dark uppercase tracking-tight text-xl">Contact Information</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Where should we send your order updates?</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 ml-1"><User size={12}/> Full Name</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-masuma-orange/20 focus:border-masuma-orange outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="e.g. John Kamau" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 ml-1"><Mail size={12}/> Email Address</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-masuma-orange/20 focus:border-masuma-orange outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="john@example.com" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                            <div className="w-12 h-12 bg-masuma-dark text-white rounded-2xl flex items-center justify-center shadow-lg shadow-masuma-dark/10">
                                <Truck size={24} />
                            </div>
                            <div>
                                <h2 className="font-black text-masuma-dark uppercase tracking-tight text-xl">Shipping Details</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Precision logistics to your doorstep</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 ml-1"><Phone size={12}/> Delivery Phone</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-gray-200 pr-3">
                                        <span className="text-sm font-bold text-masuma-dark">+254</span>
                                    </div>
                                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-24 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-masuma-orange/20 focus:border-masuma-orange outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="7XX XXX XXX" />
                                </div>
                                <p className="text-[9px] text-gray-400 uppercase font-bold px-1">Used for M-Pesa push and courier contact.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 ml-1"><MapPin size={12}/> Shipping Address</label>
                                <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-masuma-orange/20 focus:border-masuma-orange outline-none transition-all placeholder:text-gray-300 font-medium h-[104px] resize-none" placeholder="Building, Street, House Number, or Town..."></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                            <div className="w-12 h-12 bg-masuma-dark text-white rounded-2xl flex items-center justify-center shadow-lg shadow-masuma-dark/10">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h2 className="font-black text-masuma-dark uppercase tracking-tight text-xl">Payment Method</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Secure regional transaction processing</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <button 
                                type="button"
                                onClick={() => setPaymentMethod('MPESA')}
                                className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all group ${paymentMethod === 'MPESA' ? 'border-masuma-orange bg-masuma-orange/5 shadow-lg shadow-masuma-orange/5' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'MPESA' ? 'bg-white shadow-md' : 'bg-white'}`}>
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1200px-M-PESA_LOGO-01.svg.png" alt="M-Pesa" className="h-8 object-contain" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-black text-masuma-dark uppercase text-sm tracking-tight">Lipa Na M-Pesa</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Instant Secure STK Push</p>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'MPESA' ? 'border-masuma-orange bg-masuma-orange' : 'border-gray-300'}`}>
                                    {paymentMethod === 'MPESA' && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                            </button>

                            <button 
                                type="button"
                                onClick={() => setPaymentMethod('CASH')}
                                className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all group ${paymentMethod === 'CASH' ? 'border-masuma-orange bg-masuma-orange/5 shadow-lg shadow-masuma-orange/5' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'CASH' ? 'bg-white shadow-md' : 'bg-white'}`}>
                                        <Truck size={28} className={paymentMethod === 'CASH' ? 'text-masuma-orange' : 'text-gray-400'} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-black text-masuma-dark uppercase text-sm tracking-tight">Cash on Delivery</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Pay upon part arrival</p>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'CASH' ? 'border-masuma-orange bg-masuma-orange' : 'border-gray-300'}`}>
                                    {paymentMethod === 'CASH' && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                            </button>
                        </div>

                        {paymentMethod === 'MPESA' && (
                            <div className="mt-8 p-6 bg-green-50 rounded-3xl border border-green-100 flex gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-green-800 uppercase tracking-tight">STK Push Initiation</h4>
                                    <p className="text-[11px] text-green-700 font-medium mt-1 leading-relaxed">
                                        You will receive a prompt on your phone (<b>+254 {formData.phone || '...'}</b>) to enter your M-Pesa PIN after clicking "Complete Order".
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 hidden lg:block">
                        <button 
                            type="submit" 
                            className="w-full bg-masuma-dark text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm hover:bg-masuma-orange hover:-translate-y-1 transition-all shadow-2xl shadow-masuma-dark/20 flex items-center justify-center gap-3 active:scale-95"
                        >
                            <ShieldCheck size={20} /> Complete Order & Proceed
                        </button>
                        <p className="text-center text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-6 flex items-center justify-center gap-2">
                            <Lock size={12} /> Your transaction is protected by Masuma Secure Gateway
                        </p>
                    </div>
                </form>
                </>
            )}
          </div>

          <aside className="lg:sticky lg:top-40 space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-6 sm:p-8 bg-masuma-dark text-white flex justify-between items-center">
                      <div>
                        <h3 className="font-black uppercase tracking-tight text-xl flex items-center gap-2">
                            Order Summary
                        </h3>
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Review your selection</p>
                      </div>
                      <span className="text-[10px] bg-masuma-orange text-white px-3 py-1 rounded-full font-black uppercase tracking-widest">{cartItems.length} Items</span>
                  </div>

                  <div className="p-6 sm:p-8">
                      <div className="max-h-[300px] overflow-y-auto pr-2 mb-8 space-y-4 scrollbar-thin scrollbar-thumb-gray-100">
                          {cartItems.map((item, idx) => (
                              <div key={idx} className="flex gap-4 items-center group">
                                  <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center group-hover:bg-white transition-colors">
                                      <img src={item.image} alt="" className="max-w-full max-h-full object-contain p-2 transition-transform group-hover:scale-110" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <h4 className="text-[11px] font-black text-masuma-dark uppercase tracking-tight line-clamp-1 group-hover:text-masuma-orange transition-colors">{item.name}</h4>
                                      <p className="text-[9px] text-gray-400 font-black tracking-widest mt-1 uppercase opacity-60">Qty: {item.quantity} × <Price amount={item.price}/></p>
                                      <div className="text-[10px] font-black text-masuma-dark mt-1 tracking-tighter">
                                          <Price amount={item.price * item.quantity} />
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>

                      {/* Promo Code Section */}
                      <div className="border-y border-gray-100 py-6 mb-6">
                          {!appliedPromo ? (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block ml-1">Apply Promo Code</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                        <input 
                                            type="text" 
                                            value={promoInput}
                                            onChange={(e) => setPromoInput(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-masuma-orange/20 focus:border-masuma-orange outline-none transition-all" 
                                            placeholder="ENTER CODE"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleApplyPromo}
                                        disabled={isValidatingPromo || !promoInput.trim()}
                                        className="bg-masuma-dark text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-masuma-orange transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-masuma-dark/10"
                                    >
                                        {isValidatingPromo ? <Loader2 className="animate-spin" size={14}/> : 'Apply'}
                                    </button>
                                </div>
                                {promoError && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 flex items-center gap-1.5 ml-1"><AlertCircle size={12}/> {promoError}</p>}
                            </div>
                          ) : (
                            <div className="flex justify-between items-center bg-green-50 p-4 rounded-2xl border border-green-100 animate-in fade-in duration-500">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-600 text-white p-2 rounded-xl shadow-md shadow-green-600/20"><Tag size={14}/></div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase text-green-800 tracking-widest">{appliedPromo.code}</p>
                                        <p className="text-[9px] text-green-600 font-bold uppercase tracking-widest mt-0.5">Applied: {appliedPromo.type === 'PERCENTAGE' ? `${appliedPromo.value}% Off` : `KES ${appliedPromo.value} Off`}</p>
                                    </div>
                                </div>
                                <button onClick={removePromo} className="text-green-800 hover:text-red-500 transition-colors p-1"><X size={18}/></button>
                            </div>
                          )}
                      </div>

                      <div className="space-y-3">
                          <div className="flex justify-between text-[11px] text-gray-400 font-black uppercase tracking-widest">
                              <span>Subtotal (Excl. VAT)</span>
                              <span className="text-masuma-dark"><Price amount={subtotal} /></span>
                          </div>
                          {appliedPromo && (
                              <div className="flex justify-between text-[11px] text-green-600 font-black uppercase tracking-widest">
                                  <span>Discount Applied</span>
                                  <span>-<Price amount={discountAmount} /></span>
                              </div>
                          )}
                          <div className="flex justify-between text-[11px] text-gray-400 font-black uppercase tracking-widest">
                              <span>VAT (16%)</span>
                              <span className="text-masuma-dark"><Price amount={vatAmount} /></span>
                          </div>
                          <div className="flex justify-between text-[11px] text-gray-400 font-black uppercase tracking-widest">
                              <span>Delivery Fee</span>
                              <span className="text-green-600 font-black">FREE</span>
                          </div>
                          <div className="pt-6 mt-6 border-t border-dashed border-gray-200">
                              <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-masuma-orange font-black uppercase tracking-[0.3em] mb-1">Total Payable</p>
                                    <p className="text-4xl font-black text-masuma-dark tracking-tighter leading-none"><Price amount={total} /></p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-sm border border-green-100">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                        <p className="text-[8px] text-green-700 font-black uppercase tracking-widest">Secure</p>
                                    </div>
                                </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="bg-gray-50 p-5 border-t border-gray-100">
                      <div className="flex items-center justify-center gap-4 opacity-40">
                          <ShieldCheck size={20} className="text-masuma-dark" />
                          <Lock size={20} className="text-masuma-dark" />
                          <Truck size={20} className="text-masuma-dark" />
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                      <ShieldCheck size={28} className="text-masuma-orange mx-auto mb-3" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-masuma-dark leading-tight">1 Year<br/>Warranty</p>
                  </div>
                  <div className="text-center p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                      <CheckCircle size={28} className="text-masuma-orange mx-auto mb-3" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-masuma-dark leading-tight">100%<br/>Genuine</p>
                  </div>
              </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom duration-500 pb-safe">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
              <div className="flex-shrink-0">
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Total Amount</p>
                  <p className="text-xl font-black text-masuma-dark tracking-tighter leading-none"><Price amount={total} /></p>
              </div>
              <button
                  type="submit"
                  disabled={isProcessing || step === 'processing'}
                  onClick={() => document.querySelector('form')?.requestSubmit()}
                  className="flex-1 bg-masuma-dark text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-masuma-orange transition-all shadow-xl shadow-masuma-dark/20 active:scale-95 disabled:opacity-50"
              >
                  {isProcessing || step === 'processing' ? (
                      <Loader2 size={16} className="animate-spin" />
                  ) : (
                      <>Pay & Order <ChevronRight size={16} /></>
                  )}
              </button>
          </div>
      </div>
    </div>
  );
};

export default Checkout;