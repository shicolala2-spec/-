/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Item, Customer } from '../types';
import { 
  Plus, Trash2, Printer, Check, Scale, DollarSign, 
  UserPlus, ShoppingBag, AlertTriangle 
} from 'lucide-react';

export default function SalesPage() {
  const { 
    items, customers, addCustomer, addSaleInvoice, 
    getLatestPrice, getStockStatus, saleInvoices, user 
  } = useApp();

  const isSales = user?.role === 'admin' || user?.role === 'sales';

  // Master form states
  const [customerId, setCustomerId] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('credit');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Line states
  const [itemId, setItemId] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [pricePerTon, setPricePerTon] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'ton'>('ton');

  // Active Draft lines
  const [lines, setLines] = useState<Array<{
    itemId: string;
    itemName: string;
    weightKg: number;
    pricePerTon: number;
    totalAmount: number;
  }>>([]);

  // Inline Customer Addition
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Settle, Errors & Alerts
  const [printedInvoiceId, setPrintedInvoiceId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [stockWarning, setStockWarning] = useState('');

  // Fetch stocks list dynamically
  const stockList = getStockStatus();

  // Helper function to fetch item stock
  const getItemStockKg = (tid: string) => {
    const matched = stockList.find(s => s.itemId === tid);
    return matched ? matched.totalWeightKg : 0;
  };

  const handleItemAndUnitChange = (newItemId: string) => {
    setItemId(newItemId);
    setStockWarning('');
    setErrorMsg('');
    const selectedItem = items.find(i => i.id === newItemId);
    if (selectedItem) {
      setWeightUnit(selectedItem.baseUnit);
      const price = getLatestPrice(newItemId, invoiceDate);
      if (price) {
        setPricePerTon(String(price.sell));
      }
    }
  };

  const handleAddLine = () => {
    if (!itemId) return;
    const selectedItem = items.find(i => i.id === itemId);
    if (!selectedItem) return;

    const parsedWeight = parseFloat(weightKg);
    const parsedPrice = parseFloat(pricePerTon);

    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setErrorMsg('الوزن المسجل يجب أن يكون قيمة موجبة صحيحة.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('سعر بيع الطن يجب أن يكون قيمة موجبة صحيحة.');
      return;
    }

    const weightInKg = weightUnit === 'ton' ? parsedWeight * 1000 : parsedWeight;

    // Core stock validation
    const availableStockKg = getItemStockKg(itemId);
    const currentLinesDemandKg = lines
      .filter(l => l.itemId === itemId)
      .reduce((sum, l) => sum + l.weightKg, 0);

    const totalProposedDemandKg = currentLinesDemandKg + weightInKg;

    if (totalProposedDemandKg > availableStockKg) {
      setStockWarning(`تنبيه عاجل: الكمية المطلوبة بالطن (${(totalProposedDemandKg / 1000).toFixed(2)}) تفوق رصيد المخزن الفعلي الحالي المتاح بالهضبة (${(availableStockKg / 1000).toFixed(2)} طن) لهذا الصنف!`);
    } else {
      setStockWarning('');
    }

    const totalAmount = (weightInKg / 1000) * parsedPrice;

    setLines(prev => {
      const existing = prev.findIndex(l => l.itemId === itemId);
      if (existing >= 0) {
        const u = [...prev];
        u[existing].weightKg += weightInKg;
        u[existing].totalAmount += totalAmount;
        return u;
      }
      return [...prev, {
        itemId,
        itemName: selectedItem.name,
        weightKg: weightInKg,
        pricePerTon: parsedPrice,
        totalAmount
      }];
    });

    setWeightKg('');
    setErrorMsg('');
  };

  const handleRemoveLine = (idx: number) => {
    setLines(prev => prev.filter((_, i) => i !== idx));
    setStockWarning('');
    setErrorMsg('');
  };

  const handleInlineCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const newId = `cust-${Date.now()}`;
    addCustomer(newCustName, newCustPhone, newCustAddress, 0);
    setCustomerId(newId);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setShowAddCustomer(false);
  };

  const draftTotalWeightKg = lines.reduce((sum, l) => sum + l.weightKg, 0);
  const draftTotalAmount = lines.reduce((sum, l) => sum + l.totalAmount, 0);

  const handleSaveInvoice = () => {
    if (!customerId) {
      setErrorMsg('الرجاء اختيار أو تسجيل البيانات المحاسبية للمصنع أو العميل المستهدف أولاً.');
      return;
    }
    if (lines.length === 0) {
      setErrorMsg('الرجاء إدخال صنف وزن صادر واحد على الأقل لتسجيل مبيعات الفاتورة.');
      return;
    }

    const finalPaid = paymentType === 'cash' ? draftTotalAmount : (parseFloat(paidAmount) || 0);

    const detailParams = lines.map(l => ({
      itemId: l.itemId,
      weightKg: l.weightKg,
      pricePerTon: l.pricePerTon
    }));

    const newInvoiceId = addSaleInvoice(
      customerId,
      paymentType,
      finalPaid,
      detailParams,
      notes,
      invoiceDate
    );

    setPrintedInvoiceId(newInvoiceId);
    setSuccessMsg('تم تعميد وتحديث موازين الصادر وحساب رصيد العميل المحدث.');
    setErrorMsg('');
    
    // Clear draft
    setLines([]);
    setCustomerId('');
    setPaidAmount('');
    setNotes('');

    setTimeout(() => {
      setSuccessMsg('');
    }, 5000);
  };

  const activePrintInvoice = saleInvoices.find(inv => inv.id === printedInvoiceId);
  const printCustomer = customers.find(c => c.id === activePrintInvoice?.customerId);

  return (
    <div id="sales-root" className="space-y-6 text-[#f5f5f7] font-sans" dir="rtl">
      
      {/* Header Panel */}
      <div id="sales-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161617] p-6 rounded-3xl border border-[#333336]">
        <div id="sales-title-block">
          <h1 id="sales-title" className="text-xl font-semibold text-white tracking-tight">سندات المبيعات وصادر الساحة</h1>
          <p id="sales-subtitle" className="text-[#86868b] text-xs">تسجيل ومتابعة شحنات الحديد الصادرة خلايا الدرفلة والمصانع ومسح أرصدتها المحاسبية</p>
        </div>
      </div>

      {!isSales && (
        <div id="sales-error-auth" className="bg-rose-500/10 border border-rose-555/20 p-4 rounded-2xl text-xs text-rose-455 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>غير مصرح لحسابك بتسجيل مبيعات خردة جديدة. يرجى מراجعة المسؤول ومسؤول الفحص لساحة الهضبة.</span>
        </div>
      )}

      {successMsg && (
        <div id="save-success-alert" className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-medium flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-[#86868b] hover:text-white cursor-pointer text-[10px]">إغلاق</button>
        </div>
      )}

      {errorMsg && (
        <div id="save-error-alert" className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-455 text-xs font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-[#86868b] hover:text-white cursor-pointer text-[10px]">إغلاق</button>
        </div>
      )}

      <div id="sales-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-5 print:hidden">
        
        {/* Left Form: Client and Items (7 Cols) */}
        <div id="form-card" className="col-span-1 lg:col-span-7 bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6">
          
          {/* Customer Choice section */}
          <div id="client-section" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#0071e3]" />
                بيانات مصنع الصلب الشارد والمندوب
              </h3>
              
              <button
                id="inline-customer-toggle"
                onClick={() => setShowAddCustomer(!showAddCustomer)}
                className="text-[#2997ff] hover:text-[#0071e3] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>تسجيل عميل جديد</span>
              </button>
            </div>

            {/* Quick Customer Form */}
            {showAddCustomer && (
              <form onSubmit={handleInlineCustomerSubmit} id="quick-customer-form" className="bg-black p-4 rounded-2xl border border-[#333336] space-y-4">
                <h4 className="text-xs font-bold font-medium text-white">إلحاق عميل جديد وسريع بالدفاتر:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    id="new-cust-name"
                    type="text"
                    placeholder="اسم المصنع أو العميل"
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl px-3 py-2 text-xs text-white focus:border-[#0071e3] focus:outline-none"
                    required
                  />
                  <input
                    id="new-cust-phone"
                    type="text"
                    placeholder="الهاتف المحمول"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl px-3 py-2 text-xs text-white focus:border-[#0071e3] focus:outline-none"
                  />
                  <input
                    id="new-cust-addr"
                    type="text"
                    placeholder="العنوان / المدينة"
                    value={newCustAddress}
                    onChange={e => setNewCustAddress(e.target.value)}
                    className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl px-3 py-2 text-xs text-white focus:border-[#0071e3] focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomer(false)}
                    className="px-3 py-1.5 bg-[#1d1d1f] text-[#86868b] border border-[#333336] rounded-full hover:bg-zinc-850 cursor-pointer"
                  >
                    تراجع
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#0071e3] text-white font-medium rounded-full hover:bg-[#147ce5] cursor-pointer"
                  >
                    حفظ وتأكيد السجل
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">اسم العميل والمنشأة المحاسبي:</label>
                <select
                  value={customerId}
                  onChange={e => { setCustomerId(e.target.value); setErrorMsg(''); }}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:border-[#0071e3] focus:outline-none cursor-pointer"
                >
                  <option value="">-- اضغط للاختيار من الدفتر المتاح --</option>
                  {customers.map(cust => (
                    <option key={cust.id} value={cust.id}>{cust.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">تاريخ تفريغ المبيعات الفعلي:</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4.5 py-2.5 text-xs text-[#f5f5f7] focus:border-[#0071e3] focus:outline-none cursor-pointer font-mono"
                />
              </div>
            </div>
          </div>

          <hr className="border-[#333336]/60" />

          {/* Lines block with STOCK VALIDATION warning */}
          <div id="lines-section" className="space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#0071e3]" />
              تسجيل حمولات الصادر ومعاينة العجز الاقتصادي
            </h3>

            {stockWarning && (
              <div className="bg-orange-500/10 border border-orange-500/20 p-3.5 rounded-2xl text-orange-400 text-xs flex items-start gap-2.5 leading-relaxed font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{stockWarning}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-black p-4 rounded-3xl border border-[#333336]">
              
              <div className="sm:col-span-4 space-y-1">
                <span className="text-[10px] text-[#86868b] font-bold block">مادة الصنف الجاري تحميلها:</span>
                <select
                  value={itemId}
                  onChange={e => handleItemAndUnitChange(e.target.value)}
                  className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl px-3 py-2 text-[11px] text-[#f5f5f7] focus:border-[#0071e3] cursor-pointer"
                >
                  <option value="">-- حدد المادة المخرجة --</option>
                  {items.filter(i => i.active).map(i => {
                    const stockKg = getItemStockKg(i.id);
                    return (
                      <option key={i.id} value={i.id}>
                        {i.name} (رصيد: {(stockKg / 1000).toFixed(2)} طن)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="sm:col-span-4 space-y-1">
                <span className="text-[10px] text-[#86868b] font-bold block">الوزن المؤكد بالمؤشر:</span>
                <div className="flex bg-[#1d1d1f] border border-[#333336] rounded-xl overflow-hidden">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.00"
                    value={weightKg}
                    onChange={e => { setWeightKg(e.target.value); setErrorMsg(''); }}
                    className="w-full bg-transparent border-none text-center text-xs text-white p-2 focus:outline-none font-mono"
                    disabled={!itemId}
                  />
                  <select
                    value={weightUnit}
                    onChange={e => setWeightUnit(e.target.value as 'kg' | 'ton')}
                    className="bg-[#2d2d30] border-none px-2 text-[10px] text-[#f5f5f7] focus:outline-none font-bold cursor-pointer"
                    disabled={!itemId}
                  >
                    <option value="ton">طن</option>
                    <option value="kg">كجم</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <span className="text-[10px] text-[#86868b] font-bold block">سعر بيع الطن:</span>
                <input
                  type="number"
                  placeholder="2,400"
                  value={pricePerTon}
                  onChange={e => { setPricePerTon(e.target.value); setErrorMsg(''); }}
                  className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl p-2 text-center text-xs text-[#2997ff] font-bold focus:border-[#0071e3] focus:outline-none font-mono"
                  disabled={!itemId}
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleAddLine}
                  disabled={!itemId || !weightKg || !pricePerTon || !isSales}
                  className="w-full bg-[#0071e3] disabled:bg-[#1d1d1f] disabled:text-[#86868b] hover:bg-[#147ce5] text-white font-medium py-2.5 px-3 rounded-xl text-xs flex justify-center items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>إدراج</span>
                </button>
              </div>

            </div>
          </div>

          <hr className="border-[#333336]/60" />

          {/* Checkout variables */}
          <div id="checkout-section" className="space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-450" />
              تحديد تسوية التحصيل والضريبة
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">مقرر السداد والذمم:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('cash');
                      setPaidAmount('');
                    }}
                    className={`p-2.5 rounded-full border text-[11px] text-center font-semibold cursor-pointer transition-colors ${
                      paymentType === 'cash' 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                        : 'border-[#333336] bg-black text-[#86868b] hover:border-zinc-700'
                    }`}
                  >
                    نقدي فوري
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('credit')}
                    className={`p-2.5 rounded-full border text-[11px] text-center font-semibold cursor-pointer transition-colors ${
                      paymentType === 'credit' 
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400' 
                        : 'border-[#333336] bg-black text-[#86868b] hover:border-zinc-700'
                    }`}
                  >
                    آجل (تحت الحساب)
                  </button>
                </div>
              </div>

              {paymentType === 'credit' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#86868b] block">الدفعة المدفوعة مقدماً:</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-white focus:border-[#0071e3] focus:outline-none font-mono"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">رقم لوحة الشاحنة والسائق:</label>
                <input
                  type="text"
                  placeholder="مثال: لوحة د ل هـ 4902 - السائق خلف"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-white focus:border-[#0071e3] focus:outline-none"
                />
              </div>

            </div>

            <div className="flex justify-end pt-4" id="submit-wrapper">
              <button
                type="button"
                onClick={handleSaveInvoice}
                disabled={lines.length === 0 || !customerId || !isSales}
                className="w-full sm:w-auto bg-[#0071e3] disabled:bg-[#1d1d1f] disabled:text-[#86868b] hover:bg-[#147ce5] text-white font-medium py-3 px-8 rounded-full text-xs flex justify-center items-center gap-2 cursor-pointer transition-transform"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>ترحيم وحفظ مبيعات حمولة الصادر</span>
              </button>
            </div>

          </div>

        </div>

        {/* Right Pane: Basket lines and weights (5 Cols) */}
        <div id="basket-card" className="col-span-1 lg:col-span-5 flex flex-col justify-between space-y-6">
          
          <div className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#333336]/60 pb-3">
                <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#86868b]" />
                  دليل حمولات الشاحنة المصدرة
                </h3>
                <span className="bg-black border border-[#333336] px-2.5 py-0.5 rounded-full text-[10px] text-[#86868b] font-mono font-semibold">
                  {lines.length} قيد
                </span>
              </div>

              {/* Items basket */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {lines.map((l, index) => (
                  <div key={index} className="bg-black p-3.5 rounded-2xl border border-[#333336] flex items-center justify-between text-xs hover:border-[#424245] transition-colors animate-fadeIn">
                    <div>
                      <div className="font-semibold text-white text-xs">{l.itemName}</div>
                      <div className="text-[10px] text-[#86868b] font-mono pt-1">
                        الوزن المستخلص: <span className="text-emerald-450 font-bold">{weightUnit === 'ton' ? `${l.weightKg / 1000} طن` : `${l.weightKg} كجم`}</span> @ {l.pricePerTon.toLocaleString('ar-SA')} جنيه/طن
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold font-mono text-emerald-400">{Math.round(l.totalAmount).toLocaleString('ar-SA')} جنيه</span>
                      <button
                        onClick={() => handleRemoveLine(index)}
                        className="p-1 text-[#86868b] hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {lines.length === 0 && (
                  <div className="py-12 border border-dashed border-[#333336] rounded-2xl flex flex-col items-center justify-center text-[#86868b] text-xs text-center space-y-2">
                    <Scale className="w-6 h-6 text-[#333336] animate-pulse" />
                    <span>سند تصدير الشاحنة فارغ من السلع</span>
                  </div>
                )}
              </div>
            </div>

            {/* Totals panel */}
            <div className="bg-black p-4 rounded-2xl border border-[#333336] space-y-3.5">
              <div className="flex justify-between items-center text-xs text-[#86868b]">
                <span>المجموع الكلي لأوزان الصادر:</span>
                <span className="font-mono text-white font-semibold">
                  {draftTotalWeightKg >= 1000 ? `${(draftTotalWeightKg / 1000).toFixed(3)} طن` : `${draftTotalWeightKg} كجم`}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-[#86868b]">
                <span>القيمة التقديرية الحسابية:</span>
                <span className="font-mono text-white font-semibold">
                  {Math.round(draftTotalAmount).toLocaleString('ar-SA')} جنية مصري
                </span>
              </div>
              
              <div className="border-t border-[#333336]/40 my-1 pt-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">إجمالي الفاتورة الكلية:</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {Math.round(draftTotalAmount).toLocaleString('ar-SA')} ج.م
                </span>
              </div>
            </div>

          </div>

          {/* Quick PDF Print Ticket Link */}
          {printedInvoiceId && activePrintInvoice && (
            <div id="print-trigger-card" className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl flex items-center justify-between text-xs gap-3">
              <div className="space-y-1">
                <h4 className="font-semibold text-white text-[11px]">تم تعميد تذكرة ميزان الصادر:</h4>
                <p className="text-[#86868b] text-[10px]">
                  مستند مبيعات {activePrintInvoice.invoiceNumber} | {printCustomer?.name}
                </p>
              </div>
              <button
                id="ticket-print-popup-btn"
                onClick={() => window.print()}
                className="bg-[#0071e3] text-white hover:bg-[#147ce5] font-medium py-2 px-4 rounded-full flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة المعاملة للناقل</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Embedded High-Polish Printable Ticket for Sales */}
      {printedInvoiceId && activePrintInvoice && (
        <div id="printable-ticket" className="hidden print:block bg-white text-zinc-950 font-sans p-8 space-y-6 max-w-2xl mx-auto border-4 border-double border-zinc-900 rounded-lg" dir="rtl">
          
          <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4">
            <div className="text-right space-y-1">
              <h2 className="text-lg font-black tracking-wider text-black">شركة الهضبة لتجارة الخردة والمعادن</h2>
              <p className="text-[10px] text-zinc-500">تجهيز وشحن المعادن وصهر الموانئ والإنشاءات والحديد الصلب والبورصة المصرية</p>
              <p className="text-[10px] text-zinc-500">سجل تجاري رقم: 1048290 | القاهرة، جمهورية مصر العربية | هاتف: 01012345678</p>
            </div>
            <div className="text-left select-none text-right">
              <div className="border border-zinc-900 px-3 py-1 font-mono font-bold text-sm bg-zinc-50 rounded">تذكرة ميزان صادر</div>
              <p className="text-[9px] text-zinc-500 pt-1 font-mono">{invoiceDate} | {new Date().toLocaleTimeString('ar-SA')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div>المستلم والعميل: <b>{printCustomer?.name || '—'}</b></div>
              <div>الهاتف: <span className="font-mono">{printCustomer?.phone || '—'}</span></div>
              <div>مواصفات الناقل: <span className="font-bold">{activePrintInvoice.notes || '—'}</span></div>
            </div>
            <div className="space-y-1 text-left">
              <div className="font-mono">رقم تذكرة الفاتورة الصادرة: <b>{activePrintInvoice.invoiceNumber}</b></div>
              <div>طريقة السداد: <b>{activePrintInvoice.paymentType === 'cash' ? 'نقدي فوري' : 'آجل على الحساب'}</b></div>
              <div>الحالة المحاسبية: <b>{activePrintInvoice.status === 'paid' ? 'مسددة بالكامل' : (activePrintInvoice.status === 'partial' ? 'مسددة جزئياً' : 'غير مسددة')}</b></div>
            </div>
          </div>

          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-t border-zinc-900 font-bold bg-zinc-50">
                <th className="py-2 pr-2">المادة والصنف المحمل بالناقلة</th>
                <th className="py-2 text-center">الوزن الصادر الفعلي</th>
                <th className="py-2 text-center font-mono">سعر البيع المعتمد</th>
                <th className="py-2 text-left pl-2">الإجمالي المالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {activePrintInvoice.details.map((det) => {
                const item = items.find(i => i.id === det.itemId);
                return (
                  <tr key={det.id}>
                    <td className="py-2.5 pr-2 font-bold">{item?.name}</td>
                    <td className="py-2.5 text-center font-mono">
                      {(det.weightKg / 1000).toFixed(3)} طن <span className="text-[10px] text-zinc-550">({det.weightKg.toLocaleString()} كجم)</span>
                    </td>
                    <td className="py-2.5 text-center font-mono">{det.pricePerTon.toLocaleString('ar-SA')} جنيه</td>
                    <td className="py-2.5 text-left pl-2 font-mono font-bold">{Math.round(det.totalAmount).toLocaleString('ar-SA')} جنيه</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="space-y-1.5 flex flex-col items-end pt-4 border-t border-zinc-900">
            <div className="w-64 text-right text-xs space-y-1">
              <div className="flex justify-between font-mono">
                <span>إجمالي الأوزان المصدرة:</span>
                <b>{(activePrintInvoice.totalWeightKg / 1000).toFixed(3)} طن</b>
              </div>
              <div className="flex justify-between font-mono border-t border-zinc-200 pt-1">
                <span>المبلغ الكلي المقرر المبيعات:</span>
                <b>{Math.round(activePrintInvoice.totalAmount).toLocaleString('ar-SA')} جنيه</b>
              </div>
              <div className="flex justify-between font-mono text-zinc-550">
                <span>المحصل نقداً فوري بالموقع:</span>
                <b>{Math.round(activePrintInvoice.paidAmount).toLocaleString('ar-SA')} جنيه</b>
              </div>
              <div className="flex justify-between font-mono border-t-2 border-zinc-900 pt-1 text-sm font-black text-black">
                <span>رصيد الفاتورة المتبقي للذمة:</span>
                <b>{Math.round(activePrintInvoice.totalAmount - activePrintInvoice.paidAmount).toLocaleString('ar-SA')} ج.م</b>
              </div>
            </div>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-4 text-center text-[10px] text-zinc-650">
            <div className="space-y-6">
              <div>مشرف الساحة المعتمد</div>
              <div className="border-b border-zinc-400 w-32 mx-auto pt-4" />
              <div>الختم المعتمد للشركة</div>
            </div>
            <div className="space-y-6">
              <div>المستلم والناقل المفوض للمصنع المشهر</div>
              <div className="border-b border-zinc-400 w-32 mx-auto pt-4" />
              <div>توقيع المستلم والناقل وتأكيده للوزن</div>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-4 text-center text-[9px] text-zinc-550 font-mono">
            نظام إدارة وتجارة المعادن الخردة | الهضبة | المستند مصمم للمراجعة ويدخل الحسابات تلقائياً.
          </div>
        </div>
      )}

    </div>
  );
}
