/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Item, Supplier } from '../types';
import { 
  Plus, Trash2, Printer, Check, Scale, DollarSign, 
  UserPlus, ShoppingCart, AlertTriangle 
} from 'lucide-react';

export default function PurchasesPage() {
  const { 
    items, suppliers, addSupplier, addPurchaseInvoice, 
    getLatestPrice, purchaseInvoices, user 
  } = useApp();

  const isProcurement = user?.role === 'admin' || user?.role === 'procurement';

  // Master invoice form states
  const [supplierId, setSupplierId] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('credit');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Line item states
  const [itemId, setItemId] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [pricePerTon, setPricePerTon] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'ton'>('ton');

  // List of active lines inside the current draft invoice
  const [lines, setLines] = useState<Array<{
    itemId: string;
    itemName: string;
    weightKg: number;
    pricePerTon: number;
    totalAmount: number;
  }>>([]);

  // Inline supplier additions
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');

  // PDF / Print container
  const [printedInvoiceId, setPrintedInvoiceId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle unit conversions
  const handleItemAndUnitChange = (newItemId: string) => {
    setItemId(newItemId);
    setErrorMsg('');
    const selectedItem = items.find(i => i.id === newItemId);
    if (selectedItem) {
      setWeightUnit(selectedItem.baseUnit);
      const price = getLatestPrice(newItemId, invoiceDate);
      if (price) {
        setPricePerTon(String(price.buy));
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
      setErrorMsg('سعر شراء الطن يجب أن يكون قيمة موجبة صحيحة.');
      return;
    }

    const weightInKg = weightUnit === 'ton' ? parsedWeight * 1000 : parsedWeight;
    const totalAmount = (weightInKg / 1000) * parsedPrice;

    setLines(prev => {
      const existingIndex = prev.findIndex(l => l.itemId === itemId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].weightKg += weightInKg;
        updated[existingIndex].totalAmount += totalAmount;
        return updated;
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

  const handleRemoveLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index));
    setErrorMsg('');
  };

  const handleInlineSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    const newId = `sup-${Date.now()}`;
    addSupplier(newSupName, newSupPhone, newSupAddress, 0);
    setSupplierId(newId);
    setNewSupName('');
    setNewSupPhone('');
    setNewSupAddress('');
    setShowAddSupplier(false);
  };

  const draftTotalWeightKg = lines.reduce((sum, l) => sum + l.weightKg, 0);
  const draftTotalAmount = lines.reduce((sum, l) => sum + l.totalAmount, 0);

  const handleSaveInvoice = () => {
    if (!supplierId) {
      setErrorMsg('الرجاء اختيار أو تسجيل مورد لتوثيق تذكرة الوزن قبل المتابعة في الحفظ.');
      return;
    }
    if (lines.length === 0) {
      setErrorMsg('الرجاء إضافة صنف واحد على الأقل داخل فاتورة الشحن الحالية.');
      return;
    }

    const finalPaid = paymentType === 'cash' ? draftTotalAmount : (parseFloat(paidAmount) || 0);

    const detailParams = lines.map(l => ({
      itemId: l.itemId,
      weightKg: l.weightKg,
      pricePerTon: l.pricePerTon
    }));

    const newInvoiceId = addPurchaseInvoice(
      supplierId,
      paymentType,
      finalPaid,
      detailParams,
      notes,
      invoiceDate
    );

    setPrintedInvoiceId(newInvoiceId);
    setSuccessMsg('تم إصدار الفاتورة وتحديث المخزون بنجاح!');
    setErrorMsg('');

    // Reset draft
    setLines([]);
    setSupplierId('');
    setPaidAmount('');
    setNotes('');
    
    setTimeout(() => {
      setSuccessMsg('');
    }, 5000);
  };

  const activePrintInvoice = purchaseInvoices.find(inv => inv.id === printedInvoiceId);
  const printSupplier = suppliers.find(s => s.id === activePrintInvoice?.supplierId);

  const printTicket = () => {
    window.print();
  };

  return (
    <div id="purchases-root" className="space-y-6 text-[#f5f5f7] font-sans" dir="rtl">
      
      {/* Header Panel */}
      <div id="purchases-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161617] p-6 rounded-3xl border border-[#333336]">
        <div id="purchases-title-block">
          <h1 id="purchases-title" className="text-xl font-semibold text-white tracking-tight">سندات المشتريات ووارد الساحة</h1>
          <p id="purchases-subtitle" className="text-[#86868b] text-xs">توثيق ميزان البسكول وتسجيل الأوزان الواردة من عملاء التوريد وتثبيت ذممهم المالية</p>
        </div>
      </div>

      {!isProcurement && (
        <div id="purchases-error-auth" className="bg-rose-500/10 border border-rose-555/20 p-4 rounded-2xl text-xs text-rose-450 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>غير مصرح لحسابك بتسجيل مشتريات خردة جديدة. يرجى مراجعة إدارة المعايرة في ساحة الهضبة أو الدخول كمدير.</span>
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

      <div id="purchases-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-5 print:hidden">
        
        {/* Left Side: Creation Form (7 Cols) */}
        <div id="form-card" className="col-span-1 lg:col-span-7 bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6">
          
          <div id="supplier-section" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#0071e3]" />
                بيانات التوريد وجهات استلام المعادن
              </h3>
              
              <button
                id="inline-supplier-toggle"
                onClick={() => setShowAddSupplier(!showAddSupplier)}
                className="text-[#2997ff] hover:text-[#0071e3] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>مورد جديد؟ تسجيل سريع</span>
              </button>
            </div>

            {/* Quick Supplier Register Form */}
            {showAddSupplier && (
              <form onSubmit={handleInlineSupplierSubmit} id="quick-supplier-form" className="bg-black p-4 rounded-2xl border border-[#333336] space-y-4">
                <h4 className="text-xs font-bold font-medium text-white">تسجيل مورد سريع بنظام الساحة:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    id="new-sup-name"
                    type="text"
                    placeholder="اسم المورد بالكامل"
                    value={newSupName}
                    onChange={e => setNewSupName(e.target.value)}
                    className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl px-3 py-2 text-xs text-white focus:border-[#0071e3] focus:outline-none"
                    required
                  />
                  <input
                    id="new-sup-phone"
                    type="text"
                    placeholder="الهاتف المحمول"
                    value={newSupPhone}
                    onChange={e => setNewSupPhone(e.target.value)}
                    className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl px-3 py-2 text-xs text-white focus:border-[#0071e3] focus:outline-none"
                  />
                  <input
                    id="new-sup-addr"
                    type="text"
                    placeholder="الموقع / المحافظة"
                    value={newSupAddress}
                    onChange={e => setNewSupAddress(e.target.value)}
                    className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl px-3 py-2 text-xs text-white focus:border-[#0071e3] focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 text-[10px]">
                  <button
                    id="cancel-inline-sup"
                    type="button"
                    onClick={() => setShowAddSupplier(false)}
                    className="px-3 py-1.5 bg-[#1d1d1f] text-[#86868b] border border-[#333336] rounded-full hover:bg-zinc-850 cursor-pointer"
                  >
                    تراجع
                  </button>
                  <button
                    id="save-inline-sup"
                    type="submit"
                    className="px-4 py-1.5 bg-[#0071e3] text-white font-medium rounded-full hover:bg-[#147ce5] cursor-pointer"
                  >
                    حفظ وتعريف فوراً
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">اسم جهة التوريد المحاسبي:</label>
                <select
                  id="supplier-select"
                  value={supplierId}
                  onChange={e => { setSupplierId(e.target.value); setErrorMsg(''); }}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:border-[#0071e3] focus:outline-none cursor-pointer"
                >
                  <option value="">-- اضغط لتحديد جهة المورد من السجلات --</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">تاريخ تفريغ الميزان بالبسكول:</label>
                <input
                  id="invoice-date-input"
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4.5 py-2.5 text-xs text-[#f5f5f7] focus:border-[#0071e3] focus:outline-none cursor-pointer font-mono"
                />
              </div>
            </div>
          </div>

          <hr className="border-[#333336]/60" />

          {/* Add Item section */}
          <div id="add-lines-section" className="space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#0071e3]" />
              تسجيل وزن الصنف والتحويل التلقائي
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-black p-4 rounded-3xl border border-[#333336]">
              
              <div className="sm:col-span-4 space-y-1">
                <span className="text-[10px] text-[#86868b] font-bold block">مادة المعادن المستلمة:</span>
                <select
                  id="line-item-select"
                  value={itemId}
                  onChange={e => handleItemAndUnitChange(e.target.value)}
                  className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl px-3 py-2 text-[11px] text-[#f5f5f7] focus:border-[#0071e3] cursor-pointer"
                >
                  <option value="">-- حدد الصنف المفرغ --</option>
                  {items.filter(i => i.active).map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4 space-y-1">
                <span className="text-[10px] text-[#86868b] font-bold block">الوزن المؤكد بالمؤشر:</span>
                <div className="flex bg-[#1d1d1f] border border-[#333336] rounded-xl overflow-hidden">
                  <input
                    id="line-weight-input"
                    type="number"
                    step="0.001"
                    placeholder="0.00"
                    value={weightKg}
                    onChange={e => { setWeightKg(e.target.value); setErrorMsg(''); }}
                    className="w-full bg-transparent border-none text-center text-xs text-white p-2 focus:outline-none font-mono"
                    disabled={!itemId}
                  />
                  <select
                    id="line-weight-unit"
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
                <span className="text-[10px] text-[#86868b] font-bold block">سعر شراء الطن:</span>
                <input
                  id="line-price-input"
                  type="number"
                  placeholder="2,000"
                  value={pricePerTon}
                  onChange={e => { setPricePerTon(e.target.value); setErrorMsg(''); }}
                  className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl p-2 text-center text-xs text-[#2997ff] font-bold focus:border-[#0071e3] focus:outline-none font-mono"
                  disabled={!itemId}
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  id="add-line-basket-btn"
                  type="button"
                  onClick={handleAddLine}
                  disabled={!itemId || !weightKg || !pricePerTon || !isProcurement}
                  className="w-full bg-[#0071e3] disabled:bg-[#1d1d1f] disabled:text-[#86868b] hover:bg-[#147ce5] text-white font-medium py-2.5 px-3 rounded-xl text-xs flex justify-center items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>إدراج</span>
                </button>
              </div>

            </div>
          </div>

          <hr className="border-[#333336]/60" />

          {/* Form Checkout summary */}
          <div id="checkout-options" className="space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-450" />
              المحاسبة والتسوية المالية لساحة الهضبة
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">مقرر السداد المالي:</label>
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
                    نقدي (الخزينة)
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
                    على ذمة المورد
                  </button>
                </div>
              </div>

              {paymentType === 'credit' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#86868b] block">العربون / المدفوع مقدماً:</label>
                  <input
                    id="paid-amount-input"
                    type="number"
                    placeholder="0"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-white focus:border-[#0071e3] focus:outline-none font-mono"
                  />
                </div>
              )}

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[11px] font-bold text-[#86868b] block">رقم السيارة أو لوحة النقل:</label>
                <input
                  id="notes-input"
                  type="text"
                  placeholder="أرقام الشاسيهات، لوحة النقل، السائق..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-white focus:border-[#0071e3] focus:outline-none"
                />
              </div>

            </div>

            <div className="flex justify-end pt-4" id="submit-wrapper">
              <button
                id="submit-all-purchase"
                type="button"
                onClick={handleSaveInvoice}
                disabled={lines.length === 0 || !supplierId || !isProcurement}
                className="w-full sm:w-auto bg-[#0071e3] disabled:bg-[#1d1d1f] disabled:text-[#86868b] hover:bg-[#147ce5] text-white font-medium py-3 px-8 rounded-full text-xs flex justify-center items-center gap-2 cursor-pointer transition-transform"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>ترحيم وحفظ فاتورة الشراء بالمستودع</span>
              </button>
            </div>

          </div>

        </div>

        {/* Right Side: Basket lines + Live calculation of weight & Value (5 Cols) */}
        <div id="basket-card" className="col-span-1 lg:col-span-5 flex flex-col justify-between space-y-6">
          
          <div className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#333336]/60 pb-3">
                <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#86868b]" />
                  دليل البضاعة المحسوبة حالياً
                </h3>
                <span className="bg-black border border-[#333336] px-2.5 py-0.5 rounded-full text-[10px] text-[#86868b] font-mono font-semibold">
                  {lines.length} قيد
                </span>
              </div>

              {/* Basket list */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {lines.map((l, index) => (
                  <div key={index} className="bg-black p-3.5 rounded-2xl border border-[#333336] flex items-center justify-between text-xs hover:border-[#424245] transition-colors">
                    <div>
                      <div className="font-semibold text-white text-xs">{l.itemName}</div>
                      <div className="text-[10px] text-[#86868b] font-mono pt-1">
                        الوزن المستخلص: <span className="text-white font-bold">{weightUnit === 'ton' ? `${l.weightKg / 1000} طن` : `${l.weightKg} كجم`}</span> @ {l.pricePerTon.toLocaleString('ar-SA')} جنيه/طن
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold font-mono text-emerald-400">{Math.round(l.totalAmount).toLocaleString('ar-SA')} جنيه</span>
                      <button
                        onClick={() => handleRemoveLine(index)}
                        className="p-1 text-[#86868b] hover:text-rose-500 transition-colors cursor-pointer"
                        title="إلغاء المادة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {lines.length === 0 && (
                  <div className="py-12 border border-dashed border-[#333336] rounded-2xl flex flex-col items-center justify-center text-[#86868b] text-xs text-center space-y-2">
                    <Scale className="w-6 h-6 text-[#333336] animate-pulse" />
                    <span>سند الشحنة لا يحوي أي أوزان حالياً</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subtotals Panel */}
            <div className="bg-black p-4 rounded-2xl border border-[#333336] space-y-3.5">
              <div className="flex justify-between items-center text-xs text-[#86868b]">
                <span>المجموع الكلي لأوزان الوارد:</span>
                <span className="font-mono text-white font-semibold">
                  {draftTotalWeightKg >= 1000 ? `${(draftTotalWeightKg / 1000).toFixed(3)} طن` : `${draftTotalWeightKg} كجم`}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-[#86868b]">
                <span>القيمة التقديرية الحسابية:</span>
                <span className="font-mono text-white font-semibold flex items-center">
                  {Math.round(draftTotalAmount).toLocaleString('ar-SA')} جنية مصري
                </span>
              </div>
              
              <div className="border-t border-[#333336]/40 my-1 pt-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">إجمالي تذكرة الوزن:</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {Math.round(draftTotalAmount).toLocaleString('ar-SA')} ج.م
                </span>
              </div>
            </div>

          </div>

          {/* Quick PDF Print Ticket Container */}
          {printedInvoiceId && activePrintInvoice && (
            <div id="print-trigger-card" className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl flex items-center justify-between text-xs gap-3">
              <div className="space-y-1">
                <h4 className="font-semibold text-white text-[11px]">تذكرة ميزان وارد جاهزة للطباعة:</h4>
                <p className="text-[#86868b] text-[10px]">
                  فاتورة {activePrintInvoice.invoiceNumber} | {printSupplier?.name}
                </p>
              </div>
              <button
                id="ticket-print-popup-btn"
                onClick={printTicket}
                className="bg-[#0071e3] text-white hover:bg-[#147ce5] font-medium py-2 px-4 rounded-full flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الإيصال المحاسبي</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Embedded High-Polish Printable Ticket */}
      {printedInvoiceId && activePrintInvoice && (
        <div id="printable-ticket" className="hidden print:block bg-white text-zinc-950 font-sans p-8 space-y-6 max-w-2xl mx-auto border-4 border-double border-zinc-900 rounded-lg" dir="rtl">
          
          {/* Ticket Header & Company Logo */}
          <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4">
            <div className="text-right space-y-1">
              <h2 className="text-lg font-black tracking-wider text-black">شركة الهضبة لتجارة الخردة والمعادن</h2>
              <p className="text-[10px] text-zinc-500">تسهيل وتجارة المعادن وسكراب صهر الموانئ والإنشاءات والبورصة المصرية</p>
              <p className="text-[10px] text-zinc-500">سجل تجاري رقم: 1048290 | القاهرة، جمهورية مصر العربية | هاتف: 01012345678</p>
            </div>
            <div className="text-left select-none text-right">
              <div className="border border-zinc-900 px-3 py-1 font-mono font-bold text-sm bg-zinc-50 rounded">تذكرة ميزان وارد</div>
              <p className="text-[9px] text-zinc-500 pt-1 font-mono">{invoiceDate} | {new Date().toLocaleTimeString('ar-SA')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div>المورد المستلم: <b>{printSupplier?.name || '—'}</b></div>
              <div>الهاتف: <span className="font-mono">{printSupplier?.phone || '—'}</span></div>
              <div>العنوان: <span>{printSupplier?.address || '—'}</span></div>
            </div>
            <div className="space-y-1 text-left">
              <div className="font-mono">رقم تذكرة الفاتورة: <b>{activePrintInvoice.invoiceNumber}</b></div>
              <div>طريقة السداد: <b>{activePrintInvoice.paymentType === 'cash' ? 'نقدي فوري' : 'آجل على الحساب'}</b></div>
              <div>الحالة المحاسبية: <b>{activePrintInvoice.status === 'paid' ? 'مدفوع بالكامل' : (activePrintInvoice.status === 'partial' ? 'مدفوع جزئي' : 'غير مدفوع')}</b></div>
            </div>
          </div>

          {/* Ticket Body Table */}
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-t border-zinc-900 font-bold bg-zinc-100">
                <th className="py-2 pr-2">صنف المادة وخردة الحديد</th>
                <th className="py-2 text-center">الوزن الكلي المستلم</th>
                <th className="py-2 text-center font-mono">سعر شراء الطن</th>
                <th className="py-2 text-left pl-2">القيمة الحسابية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {activePrintInvoice.details.map((det) => {
                const item = items.find(i => i.id === det.itemId);
                return (
                  <tr key={det.id}>
                    <td className="py-2.5 pr-2 font-bold">{item?.name}</td>
                    <td className="py-2.5 text-center font-mono">
                      {(det.weightKg / 1000).toFixed(3)} طن <span className="text-[10px] text-zinc-500">({det.weightKg.toLocaleString()} كجم)</span>
                    </td>
                    <td className="py-2.5 text-center font-mono">{det.pricePerTon.toLocaleString('ar-SA')} جنيه</td>
                    <td className="py-2.5 text-left pl-2 font-mono font-bold">{Math.round(det.totalAmount).toLocaleString('ar-SA')} جنيه</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Financial Totals */}
          <div className="space-y-1.5 flex flex-col items-end pt-4 border-t border-zinc-900">
            <div className="w-64 text-right text-xs space-y-1">
              <div className="flex justify-between font-mono">
                <span>الوزن الصافي الإجمالي:</span>
                <b>{(activePrintInvoice.totalWeightKg / 1000).toFixed(3)} طن</b>
              </div>
              <div className="flex justify-between font-mono border-t border-zinc-200 pt-1">
                <span>المستحق الكلي للفاتورة:</span>
                <b>{Math.round(activePrintInvoice.totalAmount).toLocaleString('ar-SA')} جنيه</b>
              </div>
              <div className="flex justify-between font-mono text-zinc-600">
                <span>المبلغ المسدد نقداً فوري:</span>
                <b>{Math.round(activePrintInvoice.paidAmount).toLocaleString('ar-SA')} جنيه</b>
              </div>
              <div className="flex justify-between font-mono border-t-2 border-zinc-900 pt-1 text-sm font-black text-black">
                <span>صافي الرصيد المضاف للذمة:</span>
                <b>{Math.round(activePrintInvoice.totalAmount - activePrintInvoice.paidAmount).toLocaleString('ar-SA')} ج.م</b>
              </div>
            </div>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-4 text-center text-[10px] text-zinc-650">
            <div className="space-y-6">
              <div>مشرف الساحة المعتمد</div>
              <div className="border-b border-zinc-400 w-32 mx-auto pt-4" />
              <div>التوقيع المحاسبي</div>
            </div>
            <div className="space-y-6">
              <div>توقيع الناقل / المورد</div>
              <div className="border-b border-zinc-400 w-32 mx-auto pt-4" />
              <div>توقيع وتفويض المستلم</div>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-4 text-center text-[9px] text-zinc-500 leading-relaxed font-mono">
            نظام إدارة وتجارة المعادن الخردة | الهضبة | المخرجات منشأة بشكل حاسوبي معتمد للمراجع.
          </div>
        </div>
      )}

    </div>
  );
}
