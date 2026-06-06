/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bank, BankTransaction, BankTransactionType, CertificateOfDeposit, BankReconciliation } from '../types';
import { 
  Landmark, Plus, Coins, TrendingUp, History, FileSpreadsheet, Trash2, 
  PlusCircle, ArrowUpRight, ArrowDownLeft, Percent, ShieldAlert, CheckCircle, 
  HelpCircle, Calendar, RefreshCw, Layers
} from 'lucide-react';

export default function BanksPage() {
  const {
    banks,
    bankTransactions,
    certificatesOfDeposit,
    bankReconciliations,
    addBank,
    updateBank,
    deleteBank,
    addBankTransaction,
    deleteBankTransaction,
    addCertificateOfDeposit,
    updateCertificateStatus,
    deleteCertificateOfDeposit,
    addBankReconciliation,
    deleteBankReconciliation,
    getBankBalance,
    user
  } = useApp();

  // Active view states
  const [activeSubTab, setActiveSubTab] = useState<'banks' | 'transactions' | 'certificates' | 'reconciliation'>('banks');

  // Bank Form State
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [bankOwner, setBankOwner] = useState('');
  const [bankCurrency, setBankCurrency] = useState<'EGP' | 'USD'>('EGP');
  const [bankInitial, setBankInitial] = useState<number>(0);
  const [bankNotes, setBankNotes] = useState('');

  // Transaction Form State
  const [showAddTx, setShowAddTx] = useState(false);
  const [txBankId, setTxBankId] = useState('');
  const [txType, setTxType] = useState<BankTransactionType>('deposit');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDesc, setTxDesc] = useState('');
  const [txNotes, setTxNotes] = useState('');

  // Certificate Form State
  const [showAddCD, setShowAddCD] = useState(false);
  const [cdBankId, setCdBankId] = useState('');
  const [cdNumber, setCdNumber] = useState('');
  const [cdAmount, setCdAmount] = useState<number>(0);
  const [cdInterestRate, setCdInterestRate] = useState<number>(18.5); // Default high Egypt interest rate
  const [cdIssueDate, setCdIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [cdMaturityDate, setCdMaturityDate] = useState('');
  const [cdInterval, setCdInterval] = useState<'monthly' | 'quarterly' | 'annually' | 'maturity'>('monthly');
  const [cdNotes, setCdNotes] = useState('');

  // Reconciliation Form State
  const [showAddRec, setShowAddRec] = useState(false);
  const [recBankId, setRecBankId] = useState('');
  const [recDate, setRecDate] = useState(new Date().toISOString().split('T')[0]);
  const [recStatementBal, setRecStatementBal] = useState<number>(0);
  const [recNotes, setRecNotes] = useState('');

  // Search and Filter State
  const [txFilterBank, setTxFilterBank] = useState('all');
  const [txFilterType, setTxFilterType] = useState('all');

  // Submit Bank
  const handleCreateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !bankNumber) return;
    addBank(bankName, bankBranch, bankNumber, bankOwner || 'مؤسسة الهضبة لتجارة الخردة', bankCurrency, bankInitial, bankNotes);
    
    // Reset
    setBankName('');
    setBankBranch('');
    setBankNumber('');
    setBankOwner('');
    setBankInitial(0);
    setBankNotes('');
    setShowAddBank(false);
  };

  // Submit Transaction
  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txBankId || txAmount <= 0 || !txDesc) return;
    addBankTransaction(txBankId, txType, txAmount, txDate, txDesc, txNotes, 'manual');
    
    // Reset
    setTxAmount(0);
    setTxDesc('');
    setTxNotes('');
    setShowAddTx(false);
  };

  // Submit CD
  const handleCreateCD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cdBankId || !cdNumber || cdAmount <= 0 || !cdMaturityDate) return;
    addCertificateOfDeposit(cdBankId, cdNumber, cdAmount, cdInterestRate, cdIssueDate, cdMaturityDate, cdInterval, cdNotes);

    // Reset
    setCdNumber('');
    setCdAmount(0);
    setCdMaturityDate('');
    setCdNotes('');
    setShowAddCD(false);
  };

  // Submit Reconciliation
  const handleCreateRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recBankId) return;
    const currentBookBal = getBankBalance(recBankId);
    addBankReconciliation(recBankId, recDate, recStatementBal, currentBookBal, recNotes);

    // Reset
    setRecStatementBal(0);
    setRecNotes('');
    setShowAddRec(false);
  };

  // Stats calculation
  const totalBankTreasuryVal = banks.reduce((sum, b) => sum + getBankBalance(b.id), 0);
  const totalActiveCDsVal = certificatesOfDeposit
    .filter(cd => cd.status === 'active')
    .reduce((sum, cd) => sum + cd.amount, 0);

  return (
    <div className="space-y-6" id="banks-module-root">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333336] pb-5">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-[#2997ff]" />
            الخزانة والحسابات البنكية للمستودع
          </h2>
          <p className="text-xs text-[#86868b] leading-relaxed">
            تنظيم التدفقات النقدية الصادرة والواردة لساحة الهضبة، معالجة معاملات البنوك بمصر، والتحقق المستمر من مطابقة الكشوفات.
          </p>
        </div>
        
        {/* Treasury metrics badges */}
        <div className="flex items-center gap-3">
          <div className="bg-[#1d1d1f] border border-[#333336] rounded-2xl px-4 py-2 text-right">
            <span className="text-[10px] text-[#86868b] block font-medium">سيولة الخزائن البنكية</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {totalBankTreasuryVal.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
          <div className="bg-[#1d1d1f] border border-[#333336] rounded-2xl px-4 py-2 text-right">
            <span className="text-[10px] text-[#86868b] block font-medium">إجمالي الاستثمار بالشهادات</span>
            <span className="text-sm font-bold text-[#2997ff] font-mono">
              {totalActiveCDsVal.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        </div>
      </div>

      {/* Embedded Sub-navigation Tabs */}
      <div className="flex border-b border-[#333336]/60 p-1 bg-[#1c1c1e] rounded-full max-w-md">
        <button
          onClick={() => setActiveSubTab('banks')}
          className={`flex-1 text-center py-2 rounded-full text-xs font-semibold tracking-tight cursor-pointer transition-all ${
            activeSubTab === 'banks' ? 'bg-[#2c2c2e] text-white shadow-sm' : 'text-[#86868b] hover:text-white'
          }`}
        >
          الحسابات والعملات
        </button>
        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`flex-1 text-center py-2 rounded-full text-xs font-semibold tracking-tight cursor-pointer transition-all ${
            activeSubTab === 'transactions' ? 'bg-[#2c2c2e] text-white shadow-sm' : 'text-[#86868b] hover:text-white'
          }`}
        >
          كشف الحركات
        </button>
        <button
          onClick={() => setActiveSubTab('certificates')}
          className={`flex-1 text-center py-2 rounded-full text-xs font-semibold tracking-tight cursor-pointer transition-all ${
            activeSubTab === 'certificates' ? 'bg-[#2c2c2e] text-white shadow-sm' : 'text-[#86868b] hover:text-white'
          }`}
        >
          شهادات الإيداع 📈
        </button>
        <button
          onClick={() => setActiveSubTab('reconciliation')}
          className={`flex-1 text-center py-2 rounded-full text-xs font-semibold tracking-tight cursor-pointer transition-all ${
            activeSubTab === 'reconciliation' ? 'bg-[#2c2c2e] text-white shadow-sm' : 'text-[#86868b] hover:text-white'
          }`}
        >
          التسويات والتدقيق
        </button>
      </div>

      {/* ==================== SUB-PAGE 1: BANKS ACCOUNTS ==================== */}
      {activeSubTab === 'banks' && (
        <div className="space-y-6" id="bank-accounts-sub-section">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">الملف الحسابي للبنوك الفعالة</h3>
            
            <button
              onClick={() => setShowAddBank(!showAddBank)}
              className="flex items-center gap-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold py-1.5 px-4 rounded-full text-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              ربط حساب بنكي جديد
            </button>
          </div>

          {showAddBank && (
            <form onSubmit={handleCreateBank} className="bg-[#1c1c1e] border border-[#333336] p-5 rounded-2xl space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold text-[#fafafa] border-b border-[#333336] pb-2">تفاصيل الحساب البنكي الجديد</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">اسم البنك *</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="مثال: البنك الأهلي المصري، بنك مصر"
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">فرع البنك</label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="مثال: الفرع الرئيسي بـ 6 أكتوبر"
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">رقم الحساب / الآيبان *</label>
                  <input
                    type="text"
                    required
                    value={bankNumber}
                    onChange={(e) => setBankNumber(e.target.value)}
                    placeholder="رقم الحساب البنكي المكون من 15 رقم أو الآيبان"
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">اسم صاحب الحساب المعترف به بمصر</label>
                  <input
                    type="text"
                    value={bankOwner}
                    onChange={(e) => setBankOwner(e.target.value)}
                    placeholder="اسم المؤسسة أو صاحب الحساب المقيد رسمياً"
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">الرصيد الافتتاحي *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={bankInitial}
                    onChange={(e) => setBankInitial(parseFloat(e.target.value) || 0)}
                    placeholder="سيتم معاملته كرأس مال افتتاحي للبنك"
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">عملة الحساب البنكي</label>
                  <select
                    value={bankCurrency}
                    onChange={(e) => setBankCurrency(e.target.value as 'EGP' | 'USD')}
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none cursor-pointer"
                  >
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-right">
                <label className="text-[10px] font-bold text-[#86868b] block">ملاحظات توثيقية إضافية</label>
                <input
                  type="text"
                  value={bankNotes}
                  onChange={(e) => setBankNotes(e.target.value)}
                  placeholder="سرية الحساب، مسؤوليات التواصل بالفرع، الاستخدامات المقترحة..."
                  className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 px-5 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  حفظ الحساب وتأسيس الدفتر 📑
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBank(false)}
                  className="bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#86868b] font-semibold py-1.5 px-4 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  إلغاء وتراجع
                </button>
              </div>
            </form>
          )}

          {/* Banks Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banks.map((bank) => {
              const currentBalance = getBankBalance(bank.id);
              return (
                <div key={bank.id} className="bg-[#1c1c1e] border border-[#333336] p-5 rounded-3xl flex flex-col justify-between gap-4 group hover:border-[#424245] transition-all">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center text-[#2997ff]">
                          <Landmark className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs">{bank.name}</h4>
                          <span className="text-[9px] text-[#86868b] block">{bank.branch}</span>
                        </div>
                      </div>
                      
                      <div className="text-left font-mono">
                        <span className="text-[10px] text-[#86868b] block">الحساب الجاري</span>
                        <span className="text-sm font-black text-white">
                          {currentBalance.toLocaleString('ar-EG')} {bank.currency}
                        </span>
                      </div>
                    </div>

                    <div className="bg-black/40 p-3 rounded-xl border border-[#333336]/60 text-[10px] space-y-1.5">
                      <div className="flex justify-between items-center text-[#86868b]">
                        <span>رقم الحساب:</span>
                        <span className="text-white font-mono tracking-wider">{bank.accountNumber}</span>
                      </div>
                      <div className="flex justify-between items-center text-[#86868b]">
                        <span>صاحب الحساب:</span>
                        <span className="text-white">{bank.accountName}</span>
                      </div>
                      <div className="flex justify-between items-center text-[#86868b]">
                        <span>الرصيد الافتتاحي القياسي:</span>
                        <span className="text-zinc-300 font-mono">{bank.initialBalance.toLocaleString('ar-EG')} {bank.currency}</span>
                      </div>
                    </div>
                    {bank.notes && (
                      <p className="text-[10px] text-[#86868b] bg-[#222]/30 p-2 rounded-lg border border-[#333336]/30 leading-normal">
                        📝 {bank.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#333336]/60 pt-3 text-[10px]">
                    <span className="text-[#86868b]">تأسس الدفتر بتاريخ {new Date(bank.createdAt).toLocaleDateString('ar-EG')}</span>
                    {banks.length > 1 && (
                      <button
                        onClick={() => {
                          if(confirm("⚠️ هل أنت متأكد تماماً من رغبتك في فصل وحذف هذا الحساب البنكي من النظام بالكامل؟ (سيؤدي ذلك لتصحّح الحركات المرتبطة)")) {
                            deleteBank(bank.id);
                          }
                        }}
                        className="text-[#ff453a] hover:text-red-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف السجل
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Notice */}
          <div className="bg-blue-950/15 border border-blue-900/40 p-4 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#2997ff] shrink-0" />
            <div className="space-y-1 text-right">
              <h5 className="text-[11px] font-bold text-white">حوكمة الأرصدة والقيود النقدية المتوازية</h5>
              <p className="text-[10px] text-[#86868b] leading-normal">
                عند سداد دفعات للموردين أو استلام دفعات نقدية من العملاء بـ " شيك " أو " تحويل بنكي " في واجهة الحسابات، سيطلب منك اختيار أي من هذه الحسابات البنكية الموثقة ليتم التأثير مباشرة في رصيد البنك تلقائياً مع توثيق الحركة تفصيلياً.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ==================== SUB-PAGE 2: TRANSACTIONS LEDGER ==================== */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-6" id="bank-ledger-sub-section">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-white">سلاسل تدقيق كشف الحساب والعمليات</h3>
            
            <button
              onClick={() => setShowAddTx(!showAddTx)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 px-4 rounded-full text-xs cursor-pointer transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              إيداع / سحب يدوي للمطابقة 💰
            </button>
          </div>

          {showAddTx && (
            <form onSubmit={handleCreateTransaction} className="bg-[#1c1c1e] border border-[#333336] p-5 rounded-2xl space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold text-[#fafafa] border-b border-[#333336] pb-2">تسجيل إيداع أو سحب أو عمولة يدوية بالبنك</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">الحساب البنكي المتأثر *</label>
                  <select
                    required
                    value={txBankId}
                    onChange={(e) => setTxBankId(e.target.value)}
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none cursor-pointer"
                  >
                    <option value="">-- اختر البنك --</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>{b.name} - {getBankBalance(b.id).toLocaleString()} ج.م</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">نوع العملية *</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as BankTransactionType)}
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none cursor-pointer"
                  >
                    <option value="deposit">إيداع نقدي (Deposit)</option>
                    <option value="withdraw">سحب نقدي (Withdraw)</option>
                    <option value="transfer_in">تحويل صادر إلى حساب آخر (Transfer Out)</option>
                    <option value="transfer_out">تحويل وارد إلى الحساب (Transfer In)</option>
                    <option value="bank_fees">مصاريف وعمولات بنكية (Bank Fees)</option>
                    <option value="interest">فوائد وأرباح دورية للبنك (Interest)</option>
                  </select>
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">المبلغ بالعملة المحلية *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={txAmount}
                    onChange={(e) => setTxAmount(parseFloat(e.target.value) || 0)}
                    placeholder="قيمة المبلغ المسحب أو المودع"
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">تاريخ العملية *</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">الوصف الأساسي للحركة *</label>
                  <input
                    type="text"
                    required
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                    placeholder="مثال: فوائد الربع الأول، عمولة كشف حساب دوري، سحب تسوية..."
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">ملاحظات توثيقية سرية</label>
                  <input
                    type="text"
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    placeholder="اسم المودع، رقم مرجع المعاملة بالبنك للتدقيق"
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 px-5 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  قيد الحركة بالحساب دفعة واحدة 📊
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTx(false)}
                  className="bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#86868b] font-semibold py-1.5 px-4 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* Ledger filters */}
          <div className="bg-[#1c1c1e] border border-[#333336] p-4.5 rounded-2xl flex flex-wrap gap-4 items-center">
            <span className="text-[10px] text-[#86868b] font-bold">تصفية وبحث:</span>
            
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#86868b]">تصفية بالبنك:</span>
              <select
                value={txFilterBank}
                onChange={(e) => setTxFilterBank(e.target.value)}
                className="bg-black/60 border border-[#333336] text-white rounded-lg text-[11px] px-2.5 py-1.5 cursor-pointer"
              >
                <option value="all">كل الحسابات</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#86868b]">طبيعة الحركة:</span>
              <select
                value={txFilterType}
                onChange={(e) => setTxFilterType(e.target.value)}
                className="bg-black/60 border border-[#333336] text-white rounded-lg text-[11px] px-2.5 py-1.5 cursor-pointer"
              >
                <option value="all">كل الحركات</option>
                <option value="deposit">الإيداعات والتحصيل</option>
                <option value="withdraw">سحوبات ومصاريف</option>
                <option value="bank_fees">العمولات والمصاريف</option>
                <option value="interest">العوائد والفوائد</option>
              </select>
            </div>
          </div>

          {/* Transactions Statement Table */}
          <div className="bg-[#1c1c1e] border border-[#333336] rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-[#333336] flex justify-between items-center bg-[#1c1c1e]">
              <span className="text-xs font-bold text-white">سجل قيود التدفق المصرفي ({bankTransactions.length} معاملة مقيدة)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-black/40 text-[#86868b] border-b border-[#333336] text-[10px] uppercase font-bold">
                    <th className="py-3 px-4">م</th>
                    <th className="py-3 px-4">الحساب المتأثر</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">نوع الحركة</th>
                    <th className="py-3 px-4">الوصف الأساسي</th>
                    <th className="py-3 px-4">المبلغ المالي</th>
                    <th className="py-3 px-4 text-center">الارتباط</th>
                    <th className="py-3 px-4 text-left">التأمين</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333336]/60">
                  {bankTransactions
                    .filter(tx => {
                      if (txFilterBank !== 'all' && tx.bankId !== txFilterBank) return false;
                      if (txFilterType !== 'all') {
                        if (txFilterType === 'deposit' && !['deposit', 'transfer_in', 'interest'].includes(tx.type)) return false;
                        if (txFilterType === 'withdraw' && !['withdraw', 'transfer_out', 'bank_fees'].includes(tx.type)) return false;
                        if (txFilterType === 'bank_fees' && tx.type !== 'bank_fees') return false;
                        if (txFilterType === 'interest' && tx.type !== 'interest') return false;
                      }
                      return true;
                    })
                    .map((tx, index) => {
                      const targetBank = banks.find(b => b.id === tx.bankId);
                      const isPlus = ['deposit', 'transfer_in', 'interest'].includes(tx.type);
                      
                      const typeLabel = {
                        deposit: 'إيداع نقدي',
                        withdraw: 'سحب نقدي',
                        transfer_in: 'تحويل صادر',
                        transfer_out: 'تحويل وارد',
                        bank_fees: 'مصاريف بنكية',
                        interest: 'عائد/فوائد'
                      }[tx.type];

                      return (
                        <tr key={tx.id} className="hover:bg-black/20 text-zinc-300 transition-colors">
                          <td className="py-3 px-4 font-mono text-[10px] text-[#86868b]">{index + 1}</td>
                          <td className="py-3 px-4 font-bold text-white text-[11px]">{targetBank?.name || 'بنك مستبعد'}</td>
                          <td className="py-3 px-4 font-mono text-[10px]">{tx.date}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isPlus 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {typeLabel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[11px]">
                            <div className="font-medium text-white">{tx.description}</div>
                            {tx.notes && <span className="text-[10px] text-[#86868b] block pt-0.5">💬 {tx.notes}</span>}
                          </td>
                          <td className="py-3 px-4 font-bold font-mono">
                            <span className={isPlus ? 'text-emerald-400' : 'text-rose-400'}>
                              {isPlus ? '+' : '-'} {tx.amount.toLocaleString()} {targetBank?.currency || 'ج.م'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {tx.referenceType ? (
                              <span className="px-1.5 py-0.5 bg-[#424245]/40 text-[#86868b] text-[8px] rounded border border-[#333336] uppercase">
                                {tx.referenceType === 'payment' && 'سند سداد'}
                                {tx.referenceType === 'expense' && 'مصروفات'}
                                {tx.referenceType === 'certificate' && 'شهادة إيداع'}
                                {tx.referenceType === 'manual' && 'يدوي مالي'}
                              </span>
                            ) : (
                              <span className="text-[#86868b]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[10px] text-left">
                            <button
                              onClick={() => {
                                if (confirm("⚠️ هل أنت متأكد تماماً من رغبتك في حذف هذا القيد البنكي القياسي؟ (لا يوصى به لسلامة المطابقات)")) {
                                  deleteBankTransaction(tx.id);
                                }
                              }}
                              className="text-rose-500 hover:text-red-400 cursor-pointer"
                            >
                              حذف القيد
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {bankTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#86868b] text-xs">
                        لا يوجد قيود أو حركات سداد بنكية جارية حالياً. سيتم تسجيل القيود المزدوجة بمجرد تحصيل أو سداد الدفعات بنكياً.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== SUB-PAGE 3: CERTIFICATES OF DEPOSIT ==================== */}
      {activeSubTab === 'certificates' && (
        <div className="space-y-6" id="bank-certificates-sub-section">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white">استثمارات شهادات الإيداع والمقاصات المصرفية</h3>
              <p className="text-[10px] text-[#86868b]">استغلال السيولة الفائضة بالساحة للمطالبة بعوائد فائدة من البنوك الوطنية الكبرى.</p>
            </div>
            
            <button
              onClick={() => setShowAddCD(!showAddCD)}
              className="flex items-center gap-1.5 bg-[#2997ff] hover:bg-[#0071e3] text-white font-semibold py-1.5 px-4 rounded-full text-xs cursor-pointer transition-all"
            >
              <Percent className="w-4 h-4" />
              ربط شهادة إيداع جديدة
            </button>
          </div>

          {showAddCD && (
            <form onSubmit={handleCreateCD} className="bg-[#1c1c1e] border border-[#333336] p-5 rounded-2xl space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold text-[#fafafa] border-b border-[#333336] pb-2">تفاصيل ربط شهادة استثمار بنكية جديدة</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">البنك المصدر *</label>
                  <select
                    required
                    value={cdBankId}
                    onChange={(e) => setCdBankId(e.target.value)}
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none cursor-pointer"
                  >
                    <option value="">-- اختر البنك --</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>{b.name} - {getBankBalance(b.id).toLocaleString()} ج.م</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">رقم الشهادة / الوثيقة *</label>
                  <input
                    type="text"
                    required
                    value={cdNumber}
                    onChange={(e) => setCdNumber(e.target.value)}
                    placeholder="رقم مرجع شهادة الاستثمار بالبنك"
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">مبلغ الشهادة المالي *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={cdAmount}
                    onChange={(e) => setCdAmount(parseFloat(e.target.value) || 0)}
                    placeholder="سيتم خصمه من رصيد البنك تلقائياً"
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">معدل الفائدة السنوية % *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={cdInterestRate}
                    onChange={(e) => setCdInterestRate(parseFloat(e.target.value) || 0)}
                    placeholder="مثال: 19 أو 23.5"
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">تاريخ إصدار الشهادة *</label>
                  <input
                    type="date"
                    required
                    value={cdIssueDate}
                    onChange={(e) => setCdIssueDate(e.target.value)}
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">تاريخ تاريخ الاستحقاق الفعلي *</label>
                  <input
                    type="date"
                    required
                    value={cdMaturityDate}
                    onChange={(e) => setCdMaturityDate(e.target.value)}
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">دورية صرف عوائد الفائدة</label>
                  <select
                    value={cdInterval}
                    onChange={(e) => setCdInterval(e.target.value as any)}
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none cursor-pointer"
                  >
                    <option value="monthly">شهري (Monthly)</option>
                    <option value="quarterly">ربع سنوي (Quarterly)</option>
                    <option value="annually">سنوي (Annually)</option>
                    <option value="maturity">عند الاستحقاق والاسترداد (At Maturity)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-right">
                <label className="text-[10px] font-bold text-[#86868b] block">ملاحظات وقياس عوائد الاستحقاق</label>
                <input
                  type="text"
                  value={cdNotes}
                  onChange={(e) => setCdNotes(e.target.value)}
                  placeholder="سر رهن الشهادة للوزير، كفالات التسهيلات من فروع البنك..."
                  className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 col-span-full">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 px-5 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  ربط وتنزيل من رصيد الحساب المودع 📈
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCD(false)}
                  className="bg-[#2c2c2e] text-[#86868b] font-semibold py-1.5 px-4 rounded-lg text-xs cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            </form>
          )}

          {/* Active Certificates Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificatesOfDeposit.map((cd) => {
              const owningBank = banks.find(b => b.id === cd.bankId);
              
              // Projected quarterly interest
              const annualInterest = cd.amount * (cd.interestRate / 100);
              const payoutPerPeriod = {
                monthly: annualInterest / 12,
                quarterly: annualInterest / 4,
                annually: annualInterest,
                maturity: annualInterest * ((new Date(cd.maturityDate).getTime() - new Date(cd.issueDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
              }[cd.interestInterval];

              return (
                <div key={cd.id} className="bg-[#1c1c1e] border border-[#333336] p-5 rounded-3xl flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 text-right">
                        <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded-full ${
                          cd.status === 'active' 
                            ? 'bg-[#2997ff]/10 text-[#2997ff] border border-[#2997ff]/20'
                            : (cd.status === 'redeemed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-[#ff453a]')
                        }`}>
                          {cd.status === 'active' ? '● سارية وتدر عوائد' : (cd.status === 'redeemed' ? '✔ تم استرداد رصيدها' : 'ملغاة / مستردة مبكراً')}
                        </span>
                        <h4 className="font-bold text-white text-xs pt-1.5">شهادة استثمار وثيقة رقم #{cd.certificateNumber}</h4>
                        <span className="text-[10px] text-[#86868b] block">مستحقة لدى: {owningBank?.name || 'البنك المصدر'}</span>
                      </div>

                      <div className="text-left font-mono">
                        <span className="text-[9px] text-[#86868b] block">قيمة الوديعة</span>
                        <span className="text-sm font-black text-[#2997ff]">{cd.amount.toLocaleString()} ج.م</span>
                      </div>
                    </div>

                    <div className="bg-black/30 border border-[#333336]/60 rounded-xl p-3 grid grid-cols-2 gap-4 text-[10px]">
                      <div>
                        <span className="text-[#86868b] block">نسبة الفائدة السنوية</span>
                        <span className="text-white font-bold font-mono">{cd.interestRate} %</span>
                      </div>
                      <div>
                        <span className="text-[#86868b] block">دورية صرف العائد</span>
                        <span className="text-white font-bold">{
                          { monthly: 'عائد شهري مالي', quarterly: 'ربع سنوي مالي', annually: 'عائد سنوي كامل', maturity: 'عند استحقاق الوديعة' }[cd.interestInterval]
                        }</span>
                      </div>
                      <div>
                        <span className="text-[#86868b] block">العائد المقدر لكل دورة</span>
                        <span className="text-emerald-400 font-bold font-mono">+{Math.round(payoutPerPeriod).toLocaleString()} ج.م</span>
                      </div>
                      <div>
                        <span className="text-[#86868b] block">تاريخ الإسترداد الرسمي</span>
                        <span className="text-[#2997ff] font-bold font-mono">{cd.maturityDate}</span>
                      </div>
                    </div>

                    {cd.notes && (
                      <p className="text-[10px] text-[#86868b] leading-relaxed bg-[#222]/30 p-2 rounded-lg border border-[#333336]/40">
                        {cd.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 border-t border-[#333336]/60 pt-3">
                    {cd.status === 'active' ? (
                      <button
                        onClick={() => {
                          if (confirm(`💵 هل قامت إدارة ساحة الهضبة باسترداد رصيد الشهادة رقم ${cd.certificateNumber} بالكامل مع فوائدها وإعادتها لحساب البنك الموثق وتأكيد إغلاقها؟`)) {
                            updateCertificateStatus(cd.id, 'redeemed');
                          }
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-lg text-[10px] text-center cursor-pointer transition-colors"
                      >
                        ✔ تأكيد استرداد الشهادة لحساب البنك
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold block text-center w-full py-1.5">
                        تمت تصفية المعاملات واسترداد السيولة للبنك بنجاح 🔒
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (confirm("هل تريد حذف وثيقة الشهادة من السجلات؟")) {
                          deleteCertificateOfDeposit(cd.id);
                        }
                      }}
                      className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-[#ff453a]/80 hover:text-rose-400 border border-rose-500/20 rounded-lg text-[10px] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {certificatesOfDeposit.length === 0 && (
              <div className="text-center py-10 col-span-full border border-dashed border-[#333336] rounded-3xl p-6 text-[#86868b] text-xs">
                لا يوجد حالياً شهادات استثمار أو إيداع بنكية دورية مقيدة بالساحة. اضغط على زر "ربط شهادة إيداع جديدة" لتأسيس واحدة.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==================== SUB-PAGE 4: BANK RECONCILIATION ==================== */}
      {activeSubTab === 'reconciliation' && (
        <div className="space-y-6" id="bank-reconcile-sub-section">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white">التسوية البنكية ومطابقة الكشوفات الورقية</h3>
              <p className="text-[10px] text-[#86868b]">مقارنة دورية بين رصيد البنك بالدفاتر النظام ورصيد الحساب المطبوع والتحقق من الفروقات.</p>
            </div>

            <button
              onClick={() => setShowAddRec(!showAddRec)}
              className="flex items-center gap-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold py-1.5 px-4 rounded-full text-xs cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              إنشاء جلسة مطابقة وتسوية
            </button>
          </div>

          {showAddRec && (
            <form onSubmit={handleCreateRec} className="bg-[#1c1c1e] border border-[#333336] p-5 rounded-2xl space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold text-[#fafafa] border-b border-[#333336] pb-2">تفاصيل مطابقة الرصيد الدفتري برصيد كشف الحساب الفعلي</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">الحساب البنكي الخاضع للفحص *</label>
                  <select
                    required
                    value={recBankId}
                    onChange={(e) => setRecBankId(e.target.value)}
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none cursor-pointer"
                  >
                    <option value="">-- اختر البنك للمقارنة --</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>{b.name} - رصيده بالدفاتر الحالية: {getBankBalance(b.id).toLocaleString()} ج.م</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">تاريخ الكشف الورقي المقارن *</label>
                  <input
                    type="date"
                    required
                    value={recDate}
                    onChange={(e) => setRecDate(e.target.value)}
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-[#86868b] block">الرصيد الفعلي المطبوع بكشف البنك *</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={recStatementBal}
                    onChange={(e) => setRecStatementBal(parseFloat(e.target.value) || 0)}
                    placeholder="الرصيد النهائي المطبوع في الكشف المادي"
                    className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1 text-right">
                <label className="text-[10px] font-bold text-[#86868b] block">تقرير التسوية وفروقات الفحص</label>
                <input
                  type="text"
                  value={recNotes}
                  onChange={(e) => setRecNotes(e.target.value)}
                  placeholder="سبب وجود فروقات إن وجدت (عملة مفقودة، شيكات معلقة، عمولات غير مقيدة...)"
                  className="w-full bg-[#111] border border-[#333336] text-white px-3 py-1.5 rounded-lg text-xs font-medium focus:border-[#2997ff] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold py-1.5 px-5 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  قيد وتثبيت الجلسة ومطابقتها 🧾
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddRec(false)}
                  className="bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#86868b] font-semibold py-1.5 px-4 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  تراجع وإلغاء
                </button>
              </div>
            </form>
          )}

          {/* Reconciliation History List */}
          <div className="bg-[#1c1c1e] border border-[#333336] rounded-3xl overflow-hidden">
            <div className="p-4 bg-black/30 border-b border-[#333336] flex justify-between items-center">
              <span className="text-xs font-bold text-white">جلسات التسوية والمصادقة المقيدة ({bankReconciliations.length} جلسة مدققة)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-black/40 text-[#86868b] border-b border-[#333336] text-[10px] uppercase font-bold">
                    <th className="py-3 px-4">م</th>
                    <th className="py-3 px-4">البنك الخاضع للمطابقة</th>
                    <th className="py-3 px-4">تاريخ الكشوف المطبوعة</th>
                    <th className="py-3 px-4">رصيد الدفاتر (النظام)</th>
                    <th className="py-3 px-4">الرصيد التجاري الفعلي</th>
                    <th className="py-3 px-4">الفروق والنقوصات</th>
                    <th className="py-3 px-4">حالة المطابقة</th>
                    <th className="py-3 px-4">المدقق المالي وملاحظاته</th>
                    <th className="py-3 px-4 text-left">التأمين</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333336]/60">
                  {bankReconciliations.map((rec, index) => {
                    const matchedBank = banks.find(b => b.id === rec.bankId);
                    
                    return (
                      <tr key={rec.id} className="hover:bg-black/20 text-zinc-300 transition-colors">
                        <td className="py-4 px-4 font-mono text-[10px] text-[#86868b]">{index + 1}</td>
                        <td className="py-4 px-4 font-bold text-white text-[11px]">{matchedBank?.name || 'البنك المصادق'}</td>
                        <td className="py-4 px-4 font-mono text-[10px]">{rec.statementDate}</td>
                        <td className="py-4 px-4 font-mono font-bold text-zinc-300">{rec.bookBalance.toLocaleString()} ج.م</td>
                        <td className="py-4 px-4 font-mono font-bold text-white">{rec.statementBalance.toLocaleString()} ج.م</td>
                        <td className="py-4 px-4 font-mono font-bold">
                          {rec.differenceAmount === 0 ? (
                            <span className="text-emerald-400">0 (مطابق تماماً)</span>
                          ) : (
                            <span className={Math.abs(rec.differenceAmount) < 0.01 ? 'text-emerald-400' : 'text-rose-400'}>
                              {rec.differenceAmount.toLocaleString()} ج.م
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            rec.reconciled 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {rec.reconciled ? '✓ مصادق ومتطابق' : '⚠️ فوارق قيد التعديل'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-[10px]">
                          <div className="font-semibold text-white">بواسطة: {rec.reconciledBy}</div>
                          {rec.notes && <p className="text-[9px] text-[#86868b] pt-0.5">💬 {rec.notes}</p>}
                        </td>
                        <td className="py-4 px-4 text-left">
                          <button
                            onClick={() => {
                              if (confirm("هل تريد حذف جلسة المصادقة الدورية؟")) {
                                deleteBankReconciliation(rec.id);
                              }
                            }}
                            className="text-stone-500 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {bankReconciliations.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#86868b] text-xs">
                        لا يوجد أي جلسات تسوية بنكية مطبوعة حاليا. اضغط لإنشاء جلسة لمقارنة أرصدة الدفاتر بكشوف الحساب ومواجهة التناقضات نقدياً.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Embedded footer */}
      <div id="banking-module-footer" className="pt-6 border-t border-[#333336]/60 flex items-center gap-2 text-[#86868b] text-[10px]">
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span>جميع قيود الحسابات البنكية مسجلة بصورة مزدوجة ومتطابقة مع تذاكر الوزن لتأمين حسابات ساحة الهضبة وشركات الصلب بمصر.</span>
      </div>

    </div>
  );
}
