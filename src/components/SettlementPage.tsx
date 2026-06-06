/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Supplier, Customer, Payment } from '../types';
import { 
  Users, DollarSign, Wallet, CreditCard, Send, 
  Printer, ArrowUpRight, ArrowDownLeft, Trash2 
} from 'lucide-react';

export default function SettlementPage() {
  const { 
    suppliers, customers, payments, addPayment, deletePayment, 
    getSupplierBalance, getCustomerBalance, purchaseInvoices, saleInvoices,
    banks
  } = useApp();

  // Partner selection states
  const [partnerType, setPartnerType] = useState<'supplier' | 'customer'>('supplier');
  const [partnerId, setPartnerId] = useState('');

  // Settle form states
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'cheque'>('cash');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [success, setSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Printable statement trigger
  const [showStatement, setShowStatement] = useState(false);

  // Active balances derived dynamically from AppContext formulas
  const activeBalance = partnerId 
    ? (partnerType === 'supplier' ? getSupplierBalance(partnerId) : getCustomerBalance(partnerId))
    : 0;

  // Selected partner object
  const activePartnerName = partnerId
    ? (partnerType === 'supplier' 
        ? suppliers.find(s => s.id === partnerId)?.name 
        : customers.find(c => c.id === partnerId)?.name)
    : '';

  const activePartnerPhone = partnerId
    ? (partnerType === 'supplier' 
        ? suppliers.find(s => s.id === partnerId)?.phone
        : customers.find(c => c.id === partnerId)?.phone)
    : '';

  const activePartnerAddress = partnerId
    ? (partnerType === 'supplier' 
        ? suppliers.find(s => s.id === partnerId)?.address
        : customers.find(c => c.id === partnerId)?.address)
    : '';

  // Filter payments related only to this active partner
  const matchingPayments = payments.filter(p => p.partyType === partnerType && p.partyId === partnerId);

  // Filter invoices for statement details
  const matchingInvoices = partnerType === 'supplier'
    ? purchaseInvoices.filter(inv => inv.supplierId === partnerId).map(i => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        date: i.date,
        type: 'شراء كلي سكراب' as const,
        amount: i.totalAmount,
        paid: i.paidAmount,
        balanceCreated: i.totalAmount - i.paidAmount
      }))
    : saleInvoices.filter(inv => inv.customerId === partnerId).map(i => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        date: i.date,
        type: 'تصدير بيع معادن' as const,
        amount: i.totalAmount,
        paid: i.paidAmount,
        balanceCreated: i.totalAmount - i.paidAmount
      }));

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!partnerId) {
      setErrorMsg('الرجاء اختيار الطرف المحاسبي المستهدف أولاً قبل تسجيل الدفعة.');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('الرجاء إدخال مبلغ دفع صحيح وموجب لتنشيط السند المالي.');
      return;
    }

    const flowType = partnerType === 'supplier' ? 'payment' : 'receipt';

    if ((paymentMethod === 'bank' || paymentMethod === 'cheque') && !selectedBankId) {
      setErrorMsg('الرجاء اختيار الحساب البنكي لتوثيق حركة الصرف أو الإيداع المزدوجة.');
      return;
    }

    addPayment(
      partnerType,
      partnerId,
      flowType,
      val,
      paymentMethod,
      notes,
      date,
      undefined,
      selectedBankId || undefined
    );

    setAmount('');
    setNotes('');
    setSelectedBankId('');
    setSuccess('تم تسجيل دفعة التسوية وتعديل رصيد الذمة للطرف الآخر بنجاح!');
    setErrorMsg('');

    setTimeout(() => {
      setSuccess('');
    }, 4500);
  };

  return (
    <div id="settlement-root" className="space-y-6 text-[#f5f5f7] font-sans" dir="rtl">
      
      {/* Header Panel */}
      <div id="settlements-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161617] p-6 rounded-3xl border border-[#333336] print:hidden">
        <div id="title-block">
          <h1 id="settlement-title" className="text-xl font-semibold text-white tracking-tight">التسويات وحركات الخزينة المتبادلة</h1>
          <p id="settlement-subtitle" className="text-[#86868b] text-[#86868b] text-xs">مراجعة وتعديل أرصدة العملاء والموردين التاريخية وإجراء سندات الصرف الفوري والتحصيل النقدي للساحة</p>
        </div>
      </div>

      {success && (
        <div id="success-bar" className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-450 text-xs font-medium flex items-center justify-between print:hidden">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-[#86868b] hover:text-white cursor-pointer text-[10px]">إغلاق</button>
        </div>
      )}

      {errorMsg && (
        <div id="error-bar" className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-455 text-xs font-medium flex items-center justify-between print:hidden">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-[#86868b] hover:text-white cursor-pointer text-[10px]">إغلاق</button>
        </div>
      )}

      {/* Main Layout containing Settle Form & Balance Overview (Grid) */}
      <div id="content-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-5 print:hidden">
        
        {/* Left Card: Select Partner & input Settlement (7 Cols) */}
        <div id="settle-form-card" className="col-span-1 lg:col-span-7 bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6">
          
          <div id="selector-wrapper" className="space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#bf5af2]" />
              تحديد الطرف والجهة المحاسبية المستهدفة بالشركة
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">تقسيم جهة الأرصدة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPartnerType('supplier');
                      setPartnerId('');
                      setShowStatement(false);
                      setErrorMsg('');
                    }}
                    className={`py-2 px-1 rounded-full border text-[11px] text-center font-semibold cursor-pointer transition-colors ${
                      partnerType === 'supplier' 
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                        : 'border-[#333336] bg-black text-[#86868b] hover:border-[#424245]'
                    }`}
                  >
                    مورد خردة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPartnerType('customer');
                      setPartnerId('');
                      setShowStatement(false);
                      setErrorMsg('');
                    }}
                    className={`py-2 px-1 rounded-full border text-[11px] text-center font-semibold cursor-pointer transition-colors ${
                      partnerType === 'customer' 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-455' 
                        : 'border-[#333336] bg-black text-[#86868b] hover:border-[#424245]'
                    }`}
                  >
                    عميل مصنع
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">ابحث أو اختر من الجدول المالي:</label>
                <select
                  value={partnerId}
                  onChange={e => {
                    setPartnerId(e.target.value);
                    setShowStatement(false);
                    setErrorMsg('');
                  }}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:border-[#0071e3] focus:outline-none cursor-pointer"
                >
                  <option value="">{partnerType === 'supplier' ? '-- اختر المورد من القائمة --' : '-- اختر العميل من القائمة --'}</option>
                  {partnerType === 'supplier' 
                    ? suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    : customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  }
                </select>
              </div>

            </div>
          </div>

          {partnerId && (
            <form onSubmit={handleAddPayment} className="space-y-4 pt-1 border-t border-[#333336]/60 animate-fadeIn">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#ff9f0a]" />
                تحرير مستند دفعة جديدة (سند قبض/صرف)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#86868b] block">قيمة الدفعة (جنيه):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="مبلغ المعاملة ج.م"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setErrorMsg(''); }}
                    className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#2997ff] font-bold focus:border-[#0071e3] focus:outline-none font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#86868b] block">المستودع ومجال الصرف:</label>
                  <select
                    value={paymentMethod}
                    onChange={e => {
                      setPaymentMethod(e.target.value as 'cash' | 'bank' | 'cheque');
                      setSelectedBankId('');
                    }}
                    className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] cursor-pointer"
                  >
                    <option value="cash">نقدي فوري (خزينة الموقع)</option>
                    <option value="bank">تحويل بنكي / حوالة سريعة</option>
                    <option value="cheque">شيك مصرفي مقبول الدفع</option>
                  </select>
                </div>

                {(paymentMethod === 'bank' || paymentMethod === 'cheque') && (
                  <div className="space-y-1.5 min-w-[200px] animate-fade-in">
                    <label className="text-[11px] font-bold text-amber-400 block">الحساب البنكي المالي المتأثر:</label>
                    <select
                      value={selectedBankId}
                      onChange={e => setSelectedBankId(e.target.value)}
                      required
                      className="w-full bg-black border border-amber-500/40 rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="">-- اختر البنك المستهدَف --</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#86868b] block">التاريخ المعين بالحسابات:</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-2.5 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] cursor-pointer font-mono"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-[11px] font-bold text-[#86868b] block">ملاحظات وشهادة السداد (رقم التحويل المالي أو اسم ممرر الدورة):</label>
                  <input
                    type="text"
                    placeholder="اكتب رقم الإثبات البنكي ليسهل مطابقة المصالحة والحسابات لساحة الهضبة..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#0071e3]"
                  />
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-[#0071e3] hover:bg-[#147ce5] text-white font-medium py-2.5 px-8 rounded-full text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span>اعتماد الدفعة وتوثيق الرصيد</span>
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Right Card: Running Balance Overview & Ledger Sheet (5 Cols) */}
        <div id="balance-panel" className="col-span-1 lg:col-span-5 flex flex-col justify-between">
          
          <div className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6 h-full flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#333336]/60 pb-3">
                <h3 className="text-xs font-semibold text-white">
                  الوضعية المالية الحالية للطرف
                </h3>
                {partnerId && (
                  <button
                    onClick={() => setShowStatement(true)}
                    className="text-[#2997ff] hover:text-[#0071e3] text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>كشف الحساب الكلي</span>
                  </button>
                )}
              </div>

              {partnerId ? (
                <div className="space-y-6">
                  
                  {/* Ledger card */}
                  <div className="bg-black p-5 rounded-2xl border border-[#333336] flex flex-col items-center justify-center space-y-1 relative overflow-hidden">
                    <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">
                      {partnerType === 'supplier' ? 'ذمتنا المادية الدائنة (له علينا)' : 'مديونية العميل الكلية (لنا عليه)'}
                    </span>
                    <h2 className={`text-2xl font-black font-mono tracking-tight ${activeBalance >= 0 ? 'text-[#ff9f0a]' : 'text-[#30d158]'}`}>
                      {Math.abs(activeBalance).toLocaleString('ar-SA')}
                      <span className="text-xs font-medium text-[#86868b] pr-1">جنيه</span>
                    </h2>
                    <span className="text-[10px] text-[#86868b] pt-1 leading-none text-center">
                      {activeBalance > 0 
                        ? (partnerType === 'supplier' ? 'يتوجب تصفية الرصيد لصالح المورد' : 'المبلغ مطلوب تسويته من العميل وبحاجة للتحصيل')
                        : 'الحساب مصفى للمستويات المقررة'}
                    </span>
                  </div>

                  {/* Micro list of match payments */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-white">سندات وتاريخ الدفعات الأخيرة:</h4>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {matchingPayments.map(p => (
                        <div key={p.id} className="bg-black p-3 rounded-2xl border border-[#333336] flex items-center justify-between text-xs hover:border-[#424245] transition-colors">
                          <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-xl border ${p.type === 'payment' ? 'text-amber-500 border-amber-9ff/30' : 'text-emerald-500 border-emerald-9ff/30'}`}>
                              {p.type === 'payment' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                            </span>
                            <div>
                              <div className="font-semibold text-white text-[11px]">دفعة {p.paymentMethod === 'cash' ? 'كاش' : 'بنكية'}</div>
                              <div className="text-[9px] text-[#86868b] leading-none pt-1 truncate w-24 sm:w-32" title={p.notes}>{p.notes || 'سداد حركي ذمة'}</div>
                            </div>
                          </div>
                          
                          <div className="text-left font-mono">
                            <span className="font-bold text-[#f5f5f7] text-[11px]">{p.amount.toLocaleString('ar-SA')} ج.م</span>
                            <div className="text-[9px] text-[#86868b] pt-0.5">{p.date}</div>
                          </div>
                        </div>
                      ))}

                      {matchingPayments.length === 0 && (
                        <div className="py-6 text-center text-[#86868b] text-xs border border-dashed border-[#333336] rounded-2xl">
                          لا توجد سندات توريد أو تحصيل مدونة لهذا الطرف.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-24 text-center text-[#86868b] text-xs space-y-2 flex flex-col items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#333336] animate-pulse" />
                  <span>قم بتحديد عميل أو مورد من الجدول لعرض المركز وأرشيف الدفعات</span>
                </div>
              )}
            </div>

            <div className="text-[10px] text-[#86868b] pt-4 border-t border-[#333336]/60 mt-4 leading-relaxed">
              * رصيد الطرفين ديناميكي ومؤتمت بالكامل: حاصل المقاصة بين مستحقات الفواتير ومدفوعات وسندات الصرف والتحصيل اللاحقة.
            </div>
          </div>

        </div>

      </div>

      {/* Account Statement Printable Preview Sheet (Optimized layout for A4 print report) */}
      {showStatement && partnerId && (
        <div id="printable-statement" className="bg-white text-zinc-950 font-sans p-8 space-y-6 max-w-3xl mx-auto border-4 border-double border-zinc-900 rounded-lg print:block" dir="rtl">
          
          <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4">
            <div className="text-right space-y-1">
              <h2 className="text-lg font-black tracking-wider text-black">شركة الهضبة لتجارة الخردة والمعادن</h2>
              <p className="text-[10px] text-zinc-500">مستودعات وساحة ميزان البسكول - كشف حساب كلي بمصر</p>
              <p className="text-[10px] text-zinc-500">القاهرة، سوق السبتية ، هاتف: 01012345678</p>
            </div>
            
            <div className="text-left select-none text-right">
              <div className="border border-zinc-900 px-3 py-1 font-mono font-bold text-sm bg-zinc-50 rounded font-bold">كشف حساب ذمة مالية</div>
              <p className="text-[9px] text-zinc-500 pt-1 font-mono">تاريخ التقرير: {date} | {new Date().toLocaleTimeString('ar-SA')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs border-b border-zinc-200 pb-4">
            <div className="space-y-1">
              <div>صاحب الحساب: <b>{activePartnerName}</b></div>
              <div>هاتف الطرف: <span className="font-mono">{activePartnerPhone || '—'}</span></div>
              <div>العنوان وموقع الفرد: <span>{activePartnerAddress || '—'}</span></div>
            </div>
            <div className="space-y-1 text-left">
              <div>نوع الجهة: <b>{partnerType === 'supplier' ? 'مورد سكراب حديد' : 'عميل مصانع الصهر'}</b></div>
              <div className="text-xs bg-zinc-100 p-2 border-r-4 border-zinc-900 inline-block font-mono font-bold text-right">
                الرصيد الختامي الحالي المطلوب للذمة: <br />
                <span className="text-sm font-black text-black">{Math.round(activeBalance).toLocaleString('ar-SA')} جنيه مصري</span>
                <span className="text-[9px] text-zinc-500 block pt-1 leading-none">
                  ({activeBalance > 0 
                    ? (partnerType === 'supplier' ? 'نحن مدينون له بالمبلغ' : 'الطرف مدين لشركتنا بالمبلغ') 
                    : 'الحساب متوازن و مصفى'})
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-900">سجل الفواتير والمعاملات الصادرة/الواردة:</h3>
            <table className="w-full text-right text-[11px] border-collapse">
              <thead>
                <tr className="border-b-2 border-t border-zinc-900 bg-zinc-50 font-bold">
                  <th className="py-2 pr-2">التاريخ</th>
                  <th className="py-2">رقم الفاتورة ونوعها</th>
                  <th className="py-2 text-center">المستحق الإجمالي</th>
                  <th className="py-2 text-center">المدفوع فوراً</th>
                  <th className="py-2 text-left pl-2">المتبقي الذمة المترتبة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {matchingInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2 pr-2 font-mono">{inv.date}</td>
                    <td className="py-2 font-bold">{inv.invoiceNumber} ({inv.type})</td>
                    <td className="py-2 text-center font-mono">{Math.round(inv.amount).toLocaleString('ar-SA')} ج.م</td>
                    <td className="py-2 text-center font-mono">{Math.round(inv.paid).toLocaleString('ar-SA')} ج.م</td>
                    <td className="py-2 text-left pl-2 font-mono font-bold">{Math.round(inv.balanceCreated).toLocaleString('ar-SA')} ج.م</td>
                  </tr>
                ))}
                {matchingInvoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-zinc-500">لا توجد فواتير تاريخية معمدة لهذا الطرف</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payments list within statement */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold text-zinc-900">سجل الصرف وسندات تحصيل الدفعات:</h3>
            <table className="w-full text-right text-[11px] border-collapse">
              <thead>
                <tr className="border-b-2 border-t border-zinc-900 bg-zinc-50 font-bold">
                  <th className="py-2 pr-2">تاريخ السند</th>
                  <th className="py-2">رقم المستند والنوع والوسيلة</th>
                  <th className="py-2">وصف المعاملة</th>
                  <th className="py-2 text-left pl-2">المبلغ المستلم/المدفوع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {matchingPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-2 font-mono">{p.date}</td>
                    <td className="py-2 font-bold">
                      {p.receiptNumber} ({p.type === 'payment' ? 'سند صرف صرف' : 'سند قبض مصل'}) - {p.paymentMethod === 'cash' ? 'نقدي' : 'بنكي'}
                    </td>
                    <td className="py-2 text-zinc-650 font-medium">{p.notes || 'تسوية رصيد تاريخية'}</td>
                    <td className="py-2 text-left pl-2 font-mono font-bold">{Math.round(p.amount).toLocaleString('ar-SA')} جنيه</td>
                  </tr>
                ))}
                {matchingPayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-zinc-500">لا توجد حركات سداد بنكية أو نقدية مسجلة لاحقًا</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Printable calculation disclaimer */}
          <div className="pt-6 border-t border-zinc-300 grid grid-cols-2 gap-4 text-center text-[10px] text-zinc-500">
            <div className="space-y-6">
              <div>المحاسب المالي المراجع للمعاملات</div>
              <div className="border-b border-zinc-400 w-32 mx-auto pt-4" />
              <div>توقيع قسم الحسابات والتسوية</div>
            </div>
            <div className="space-y-6">
              <div>المصادقة والتوقيع للطرف ذي الصلة</div>
              <div className="border-b border-zinc-400 w-32 mx-auto pt-4" />
              <div>أوافق وأصادق على الرصيد النهائي كشف الحساب</div>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-4 text-center text-[9px] text-zinc-500 font-mono">
            شركة الهضبة لتجارة خردة الحديد والمعادن بمصر | مستند كشف الحساب ينشأ تلقائياً وتاريخه ملزم للطرفين محاسبياً.
          </div>

          <div className="flex justify-center pt-2 print:hidden justify-center items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#161617] border border-[#333336] hover:bg-[#2c2c2e] text-zinc-100 rounded-xl text-xs flex items-center gap-1 cursor-pointer font-bold"
            >
              <Printer className="w-4 h-4 text-amber-500 font-bold" />
              <span>أمر طباعة المستند الآن</span>
            </button>
            
            <button
              onClick={() => setShowStatement(false)}
              className="px-4 py-2 bg-zinc-100 border border-zinc-200 text-zinc-800 hover:bg-zinc-200 rounded-xl text-xs flex items-center gap-1 cursor-pointer font-bold"
            >
              <span>إغلاق معاينة المستند</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
