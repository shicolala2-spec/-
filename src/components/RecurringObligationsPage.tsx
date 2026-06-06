/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RecurringObligation, RecurringPaymentLog } from '../types';
import { 
  Plus, Calendar, Trash2, Edit3, ArrowUpRight, 
  HelpCircle, CheckCircle2, AlertCircle, RefreshCw,
  Clock, Landmark, DollarSign, Wallet, FileText,
  User, Check, X, ShieldAlert, ArrowDownCircle,
  Building, MapPin, Receipt, ArrowUpDown
} from 'lucide-react';
import { CATEGORY_STRUCTURES } from './ExpensesPage';

export default function RecurringObligationsPage() {
  const { 
    recurringObligations, 
    recurringPaymentLogs,
    addRecurringObligation,
    updateRecurringObligation,
    deleteRecurringObligation,
    payRecurringObligation,
    user,
    banks,
    getBankBalance
  } = useApp();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'logs'>('list');

  // Filter list state
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Payment popup state
  const [payingObligation, setPayingObligation] = useState<RecurringObligation | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payPeriod, setPayPeriod] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  // Form states for creating new obligation
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [oblType, setOblType] = useState<RecurringObligation['type']>('rent');
  
  const [expenseCategory, setExpenseCategory] = useState('Rent');
  const [expenseSubCategory, setExpenseSubCategory] = useState('إيجار أرض/مخزن');
  
  const [payeeType, setPayeeType] = useState<RecurringObligation['payeeType']>('landlord');
  const [payeeName, setPayeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'EGP' | 'USD'>('EGP');
  
  const [paymentMethod, setPaymentMethod] = useState<RecurringObligation['paymentMethod']>('cash');
  const [bankAccountId, setBankAccountId] = useState('');
  
  // Loan specifically
  const [loanId, setLoanId] = useState('');
  const [totalLoanAmount, setTotalLoanAmount] = useState('');
  const [remainingLoanAmount, setRemainingLoanAmount] = useState('');
  const [loanStartDate, setLoanStartDate] = useState('');
  const [loanEndDate, setLoanEndDate] = useState('');
  const [loanInterestRate, setLoanInterestRate] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [paidInstallments, setPaidInstallments] = useState('0');

  // Rent specifically
  const [contractNumber, setContractNumber] = useState('');
  const [propertyType, setPropertyType] = useState<'warehouse' | 'office' | 'land' | 'scale' | 'other'>('land');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [rentStartDate, setRentStartDate] = useState('');
  const [rentEndDate, setRentEndDate] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [increasePercentage, setIncreasePercentage] = useState('0');

  // Tax specifically
  const [taxType, setTaxType] = useState<'vat' | 'income' | 'stamp' | 'municipal'>('vat');
  const [taxNumber, setTaxNumber] = useState('');
  const [vatPercentage, setVatPercentage] = useState('14');
  const [taxableAmount, setTaxableAmount] = useState('');

  // Scheduling settings
  const [frequency, setFrequency] = useState<RecurringObligation['frequency']>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('5');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [notificationDaysBefore, setNotificationDaysBefore] = useState('3');
  const [autoCreateTransaction, setAutoCreateTransaction] = useState(false);

  // Form UI states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // View Details standard drawer/modal
  const [viewingObligation, setViewingObligation] = useState<RecurringObligation | null>(null);

  // Auto handle type switch side effects
  const handleTypeChange = (type: RecurringObligation['type']) => {
    setOblType(type);
    
    // Auto align categories for accounting precision!
    if (type === 'rent') {
      setExpenseCategory('Rent');
      setExpenseSubCategory('إيجار أرض/مخزن');
      setPayeeType('landlord');
      setPaymentMethod('cash');
    } else if (type === 'loan_installment') {
      setExpenseCategory('Other');
      setExpenseSubCategory('أقساط قروض بنكية');
      setPayeeType('bank');
      setPaymentMethod('bank_transfer');
    } else if (type === 'salary') {
      setExpenseCategory('Labor');
      setExpenseSubCategory('رواتب شهرية');
      setPayeeType('employee');
      setPaymentMethod('cash');
    } else if (type === 'tax') {
      setExpenseCategory('Taxes');
      setExpenseSubCategory('ضريبة قيمة مضافة');
      setPayeeType('government');
      setPaymentMethod('bank_transfer');
    } else if (type === 'insurance') {
      setExpenseCategory('Labor');
      setExpenseSubCategory('تأمينات اجتماعية');
      setPayeeType('government');
      setPaymentMethod('bank_transfer');
    } else if (type === 'subscription') {
      setExpenseCategory('Utilities');
      setExpenseSubCategory('إنترنت وتليفونات');
      setPayeeType('supplier');
      setPaymentMethod('bank_transfer');
    } else {
      setExpenseCategory('Other');
      setExpenseSubCategory('أخرى');
      setPayeeType('other');
      setPaymentMethod('cash');
    }
  };

  const handleCreateObligation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim()) {
      setErrorMsg('الرجاء إدخال عنوان الالتزام.');
      return;
    }
    const valAmt = parseFloat(amount);
    if (isNaN(valAmt) || valAmt <= 0) {
      setErrorMsg('الرجاء إدخال قيمة التزام شهرية/دورية صحيحة أكبر من الصفر.');
      return;
    }

    let loanDetails = undefined;
    let rentDetails = undefined;
    let taxDetails = undefined;

    if (oblType === 'loan_installment') {
      const totLoan = parseFloat(totalLoanAmount);
      const remLoan = parseFloat(remainingLoanAmount);
      const instRate = parseFloat(loanInterestRate);
      const totInst = parseInt(totalInstallments);
      const paidInst = parseInt(paidInstallments);

      loanDetails = {
        loanId: loanId || `LN-${Date.now().toString().slice(-4)}`,
        totalLoanAmount: isNaN(totLoan) ? valAmt * 12 : totLoan,
        remainingAmount: isNaN(remLoan) ? valAmt * 12 : remLoan,
        startDate: loanStartDate || startDate,
        endDate: loanEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
        interestRate: isNaN(instRate) ? 0 : instRate,
        totalInstallments: isNaN(totInst) ? 12 : totInst,
        paidInstallments: isNaN(paidInst) ? 0 : paidInst,
        remainingInstallments: Math.max(0, (isNaN(totInst) ? 12 : totInst) - (isNaN(paidInst) ? 0 : paidInst))
      };
    } else if (oblType === 'rent') {
      const depAmt = parseFloat(depositAmount);
      const incPct = parseFloat(increasePercentage);

      rentDetails = {
        contractNumber: contractNumber || `CON-${Date.now().toString().slice(-4)}`,
        propertyType: propertyType,
        propertyAddress: propertyAddress || 'مستودع الساحة',
        startDate: rentStartDate || startDate,
        endDate: rentEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        depositAmount: isNaN(depAmt) ? 0 : depAmt,
        increasePercentage: isNaN(incPct) ? 0 : incPct
      };
    } else if (oblType === 'tax') {
      const vatPct = parseFloat(vatPercentage);
      const taxBase = parseFloat(taxableAmount);

      taxDetails = {
        taxType: taxType,
        taxNumber: taxNumber || '000-000-000',
        vatPercentage: isNaN(vatPct) ? undefined : vatPct,
        taxableAmount: isNaN(taxBase) ? undefined : taxBase
      };
    }

    const selectedBank = banks.find(b => b.id === bankAccountId);

    addRecurringObligation({
      title,
      description,
      type: oblType,
      expenseCategory,
      expenseSubCategory,
      payeeType,
      payeeName: payeeName || 'الجهة المستفيدة المباشرة',
      amount: valAmt,
      currency,
      paymentMethod,
      bankAccountId: bankAccountId || undefined,
      bankAccountName: selectedBank ? selectedBank.name : undefined,
      loanDetails,
      rentDetails,
      taxDetails,
      frequency,
      dayOfMonth: parseInt(dayOfMonth) || 5,
      startDate,
      endDate: endDate || undefined,
      isActive,
      notificationDaysBefore: parseInt(notificationDaysBefore) || 3,
      autoCreateTransaction
    });

    setSuccessMsg('تم حفظ وتسجيل الالتزام المالي الدوري بنجاح وجدولة التنبيهات المترتبة!');
    
    // Clean up states
    setTitle('');
    setDescription('');
    setAmount('');
    setPayeeName('');
    setBankAccountId('');
    setLoanId('');
    setTotalLoanAmount('');
    setRemainingLoanAmount('');
    setContractNumber('');
    setPropertyAddress('');
    setTaxNumber('');
    setTaxableAmount('');

    setTimeout(() => {
      setActiveTab('list');
      setSuccessMsg('');
    }, 1500);
  };

  const handlePayObligationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPaySuccess('');

    if (!payingObligation) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError('الرجاء كتابة القيمة النقدية المدفوعة بشكل صحيح.');
      return;
    }

    if (!payPeriod.trim()) {
      setPayError('الرجاء تبيان الفترة المسدد عنها (مثال: يونيو 2026).');
      return;
    }

    payRecurringObligation(
      payingObligation.id,
      amt,
      payDate,
      payPeriod,
      payNotes
    );

    setPaySuccess('تم السداد بنجاح! تم توثيق الدفعة وإنشاء مستند مالي ملائم في المصروفات/البنك تلقائياً.');
    setPayAmount('');
    setPayNotes('');
    setPayPeriod('');

    setTimeout(() => {
      setPayingObligation(null);
      setPaySuccess('');
    }, 2000);
  };

  const getObligationTypeLabel = (type: RecurringObligation['type']) => {
    switch(type) {
      case 'rent': return 'إيجار عقاري/أرض';
      case 'loan_installment': return 'قسط تمويل/قرض';
      case 'salary': return 'رواتب وأجور موظفين';
      case 'tax': return 'ضريبة مصلحة الضرائب';
      case 'insurance': return 'تأمينات اجتماعية';
      case 'subscription': return 'اشتراك منصات/خدمات';
      default: return 'التزامات دورية أخرى';
    }
  };

  const getObligationTypeIcon = (type: RecurringObligation['type']) => {
    switch(type) {
      case 'rent': return <Building className="text-emerald-400 w-4 h-4" />;
      case 'loan_installment': return <Landmark className="text-amber-400 w-4 h-4" />;
      case 'salary': return <User className="text-purple-400 w-4 h-4" />;
      case 'tax': return <Receipt className="text-blue-400 w-4 h-4" />;
      case 'insurance': return <ShieldAlert className="text-rose-400 w-4 h-4" />;
      case 'subscription': return <RefreshCw className="text-cyan-400 w-4 h-4" />;
      default: return <Clock className="text-gray-400 w-4 h-4" />;
    }
  };

  const getPayeeTypeLabel = (pType: RecurringObligation['payeeType']) => {
    switch(pType) {
      case 'bank': return 'جهة مصرفية (بنك)';
      case 'landlord': return 'مالك العقار/المؤجر';
      case 'employee': return 'أجير أو موظف بالشركة';
      case 'government': return 'مصلحة حكومية (الضرائب/التأمينات)';
      case 'supplier': return 'مورد أو مزود خدمة';
      default: return 'جهة مستفيدة أخرى';
    }
  };

  const getMethodAr = (method: RecurringObligation['paymentMethod']) => {
    switch(method) {
      case 'bank_transfer': return 'تحويل مصرفي';
      case 'cheque': return 'شيك رسمي مؤجل';
      case 'cash': return 'نقداً (خزينة الموقع)';
      case 'auto_debit': return 'خصم مباشر تلقائي';
      default: return 'تسوية نقدية';
    }
  };

  // Calculations for KPI Cards
  const totalMonthlyCommitment = recurringObligations
    .filter(o => o.isActive && o.frequency === 'monthly')
    .reduce((sum, o) => sum + o.amount, 0);

  const activeRents = recurringObligations.filter(o => o.isActive && o.type === 'rent').length;
  
  const remainingFinancingLoans = recurringObligations
    .filter(o => o.isActive && o.type === 'loan_installment' && o.loanDetails)
    .reduce((sum, o) => sum + (o.loanDetails?.remainingAmount || 0), 0);

  const thisMonthPaidSum = recurringPaymentLogs
    .filter(log => {
      const yearMonth = log.paymentDate.slice(0, 7); // e.g. "2026-06"
      const currentYearMonth = new Date().toISOString().slice(0, 7);
      return yearMonth === currentYearMonth;
    })
    .reduce((sum, log) => sum + log.amountPaid, 0);

  // Filter logic
  const filteredObligations = recurringObligations.filter(o => {
    const matchesType = selectedTypeFilter === 'all' || o.type === selectedTypeFilter;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && o.isActive) || 
                          (statusFilter === 'inactive' && !o.isActive);
    return matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6" id="recurring-root">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1d1d1f] p-6 rounded-3xl border border-[#333336]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#f5f5f7] tracking-tight flex items-center gap-3">
            <RefreshCw className="text-[#0071e3] animate-spin-slow w-7 h-7" />
            <span>نظام إدارة الالتزامات المالية والأقساط والإيجارات</span>
          </h1>
          <p className="text-xs text-[#86868b] mt-1.5 leading-relaxed">
            مراقبة العقود، الأقساط البنكية التمويلية، الإيجارات، وجدولة المصاريف الدورية لساحة الخردة مع التأثير القيد المحاسبي المزدوج.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => { setActiveTab('list'); setViewingObligation(null); }}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition ${
              activeTab === 'list' && !viewingObligation
                ? 'bg-[#0071e3] text-white shadow-lg' 
                : 'bg-black text-[#86868b] hover:text-[#f5f5f7] border border-[#333336]'
            }`}
          >
            عقود الالتزامات النشطة ({recurringObligations.length})
          </button>
          
          <button
            onClick={() => { setActiveTab('add'); setViewingObligation(null); }}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-[#0071e3] text-white shadow-lg' 
                : 'bg-black text-[#86868b] hover:text-[#f5f5f7] border border-[#333336]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عقد التزام جديد</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('logs'); setViewingObligation(null); }}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition ${
              activeTab === 'logs'
                ? 'bg-[#0071e3] text-white shadow-lg' 
                : 'bg-black text-[#86868b] hover:text-[#f5f5f7] border border-[#333336]'
            }`}
          >
            سجل دفعات السداد المستندي ({recurringPaymentLogs.length})
          </button>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly commitments */}
        <div className="bg-[#1d1d1f] p-5 rounded-3xl border border-[#333336] shadow-sm relative overflow-hidden">
          <div className="p-2 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] w-10 h-10 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-[#86868b] block">معدل الالتزامات الدورية الشهري</span>
          <div className="flex items-baseline mt-1 gap-2">
            <span className="text-xl md:text-2xl font-bold text-[#f5f5f7]">{totalMonthlyCommitment.toLocaleString()}</span>
            <span className="text-[10px] text-[#86868b]">جنيه مصري / شهر</span>
          </div>
          <div className="text-[10px] mt-2 text-emerald-400 font-medium">جدولة تلقائية بناء على العقود النشطة</div>
        </div>

        {/* Card 2: Active Rents Count */}
        <div className="bg-[#1d1d1f] p-5 rounded-3xl border border-[#333336] shadow-sm relative overflow-hidden">
          <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-400 w-10 h-10 flex items-center justify-center mb-3">
            <Building className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-[#86868b] block">عقود الإيجارات الموقعة النشطة</span>
          <div className="flex items-baseline mt-1 gap-2">
            <span className="text-xl md:text-2xl font-bold text-emerald-400">{activeRents}</span>
            <span className="text-[10px] text-[#86868b]">عقود جارية</span>
          </div>
          <div className="text-[10px] mt-2 text-[#86868b]">تشمل الساحات، الموازين والمكاتب</div>
        </div>

        {/* Card 3: Remaining Financing Loans */}
        <div className="bg-[#1d1d1f] p-5 rounded-3xl border border-[#333336] shadow-sm relative overflow-hidden">
          <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 w-10 h-10 flex items-center justify-center mb-3">
            <Landmark className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-[#86868b] block">إجمالي تمويلات وقروض متبقية لشراء الآليات</span>
          <div className="flex items-baseline mt-1 gap-2">
            <span className="text-xl md:text-2xl font-bold text-amber-500">{remainingFinancingLoans.toLocaleString()}</span>
            <span className="text-[10px] text-[#86868b]">جنيه مصري</span>
          </div>
          <div className="text-[10px] mt-2 text-amber-400/80 font-medium">خصم فوري للأقساط من الحسابات البنكية</div>
        </div>

        {/* Card 4: This Month Payments */}
        <div className="bg-[#1d1d1f] p-5 rounded-3xl border border-[#333336] shadow-sm relative overflow-hidden">
          <div className="p-2 rounded-2xl bg-[#30d158]/10 text-[#30d158] w-10 h-10 flex items-center justify-center mb-3">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-[#86868b] block">المبالغ المسددة فعلياً للشهر الجاري</span>
          <div className="flex items-baseline mt-1 gap-2">
            <span className="text-xl md:text-2xl font-bold text-[#30d158]">{thisMonthPaidSum.toLocaleString()}</span>
            <span className="text-[10px] text-[#86868b]">جنيه مصري</span>
          </div>
          <div className="text-[10px] mt-2 text-[#86868b]">سداد مطابق لدفاتر المصروفات البنكية والورقية</div>
        </div>
      </div>

      {/* QUICK WARNING NOTIFICATIONS */}
      {recurringObligations.filter(o => o.isActive).map(obl => {
        const matchingLogs = recurringPaymentLogs.filter(l => l.obligationId === obl.id);
        const hasPaidCurrentMonth = matchingLogs.some(log => {
          const mPay = log.paymentDate.slice(0, 7);
          const mNow = new Date().toISOString().slice(0, 7);
          return mPay === mNow;
        });

        // If today is past or near day og month and didn't pay yet, show elegant reminder!
        const todayDay = new Date().getDate();
        const triggersIncident = todayDay >= (obl.dayOfMonth - obl.notificationDaysBefore) && todayDay <= obl.dayOfMonth && !hasPaidCurrentMonth;

        if (triggersIncident) {
          return (
            <div key={obl.id} className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3 text-amber-300 text-xs animate-pulse">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-bold">استحقاق سداد وشيك: </span>
                الالتزام <span className="font-bold">"{obl.title}"</span> بقيمة <span className="underline font-bold">{obl.amount.toLocaleString()} {obl.currency}</span> يستحق يوم {obl.dayOfMonth} من الشهر الجاري. الرجاء توثيق معاملة صرف الدفعة لتجنب فوائد أو انقطاع!
              </div>
              <button 
                onClick={() => { setPayingObligation(obl); setPayAmount(obl.amount.toString()); }}
                className="bg-amber-500 text-black font-semibold px-3 py-1.5 rounded-xl text-xs hover:bg-amber-400 transition"
              >
                وثق دفعة السداد الآن
              </button>
            </div>
          );
        }
        return null;
      })}

      {/* RENDER VIEW TAB 1: ACTIONS & CARDS */}
      {activeTab === 'list' && !viewingObligation && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-black p-4 rounded-3xl border border-[#333336] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-xs font-bold text-[#86868b]">تفصيل عقود الالتزامات والأقساط الجارية (تحكم ومتابعة):</div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {/* Type filter */}
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="bg-[#1d1d1f] border border-[#333336] text-[11px] text-[#f5f5f7] px-3 py-2 rounded-xl focus:outline-none focus:border-[#0071e3] cursor-pointer"
              >
                <option value="all">كل تصنيفات الالتزام</option>
                <option value="rent">إيجارات فقط</option>
                <option value="loan_installment">أقساط قروض وتمويل</option>
                <option value="salary">رواتب عمال دورية</option>
                <option value="tax">ضرائب ورسوم حكومية</option>
                <option value="insurance">تأمينات اجتماعية</option>
                <option value="subscription">اشتراكات تقنية وخدمية</option>
                <option value="other">التزامات أخرى</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-[#1d1d1f] border border-[#333336] text-[11px] text-[#f5f5f7] px-3 py-2 rounded-xl focus:outline-none focus:border-[#0071e3] cursor-pointer"
              >
                <option value="all">كل الحالات</option>
                <option value="active">نشط جاري العمل به</option>
                <option value="inactive">موقف أو منتهي</option>
              </select>
            </div>
          </div>

          {/* Obligations List */}
          {filteredObligations.length === 0 ? (
            <div className="bg-[#1d1d1f] rounded-3xl border border-[#333336] p-12 text-center text-[#86868b] text-xs">
              <Calendar className="w-12 h-12 text-[#333336] mx-auto mb-3" />
              لا توجد التزامات مطابقة لخيارات الفلترة المسجلة. يمكنك جدولة التزام مالي جديد بالنقر على زر الإضافة!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredObligations.map(obl => {
                const logsForObl = recurringPaymentLogs.filter(l => l.obligationId === obl.id);
                const lastPayment = logsForObl.length > 0 ? logsForObl[0] : null;

                return (
                  <div 
                    key={obl.id} 
                    className="bg-[#1d1d1f] rounded-3xl border border-[#333336] p-5 hover:border-[#424245] transition flex flex-col justify-between space-y-4"
                  >
                    {/* Header */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-black/40 border border-[#333336]">
                            {getObligationTypeIcon(obl.type)}
                          </div>
                          <span className="text-[10px] text-gray-400 bg-black/50 px-2 py-0.5 rounded-full">
                            {getObligationTypeLabel(obl.type)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${obl.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
                          <span className={`text-[10px] font-bold ${obl.isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {obl.isActive ? 'نشط ومستحق' : 'غير نشط'}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-[13px] font-bold text-[#f5f5f7] pt-2 line-clamp-1">{obl.title}</h3>
                      <p className="text-[11px] text-[#86868b] line-clamp-2 h-8 leading-snug">{obl.description}</p>
                    </div>

                    {/* Details overview */}
                    <div className="bg-black/40 rounded-2xl border border-[#333336]/60 p-4 space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#86868b]">المبلغ الدوري:</span>
                        <span className="font-bold text-white text-[12px]">{obl.amount.toLocaleString()} {obl.currency}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#86868b]">يوم السحب المعين:</span>
                        <span className="font-medium text-amber-400">يوم {obl.dayOfMonth} من كل شهر</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#86868b]">الجهة المستحقة لليد:</span>
                        <span className="font-medium text-[#f5f5f7] truncate max-w-[130px]">{obl.payeeName}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#86868b]">طريقة وخزينة الدفع:</span>
                        <span className="text-[#86868b]">{getMethodAr(obl.paymentMethod)}</span>
                      </div>

                      {/* Loan specialized details visualizer */}
                      {obl.type === 'loan_installment' && obl.loanDetails && (
                        <div className="pt-2 border-t border-[#333336]/60 mt-1 space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-amber-500">الأقساط المسددة:</span>
                            <span className="text-white font-bold">{obl.loanDetails.paidInstallments} / {obl.loanDetails.totalInstallments}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-500">المبلغ الإجمالي المتبقي:</span>
                            <span className="text-amber-400 font-bold">{(obl.loanDetails.remainingAmount || 0).toLocaleString()} {obl.currency}</span>
                          </div>
                        </div>
                      )}

                      {/* Rent details visualizer */}
                      {obl.type === 'rent' && obl.rentDetails && (
                        <div className="pt-2 border-t border-[#333336]/60 mt-1 space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-emerald-400">رقم العقد:</span>
                            <span className="text-white font-bold">{obl.rentDetails.contractNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-emerald-400">موقع العقار:</span>
                            <span className="text-white truncate max-w-[140px]">{obl.rentDetails.propertyAddress}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer last payment status */}
                    <div className="text-[10px] text-[#86868b] flex justify-between items-center bg-black/20 p-2.5 rounded-xl">
                      <span>آخر سداد مسجل:</span>
                      <span className="text-[#f5f5f7] font-semibold">
                        {lastPayment ? `${lastPayment.amountPaid.toLocaleString()} جنيه (${lastPayment.periodText})` : 'لا توجد دفعات منشورة'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2.5 pt-1.5 justify-end">
                      <button
                        onClick={() => setViewingObligation(obl)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/5 transition flex-1"
                      >
                        عرض التفاصيل والمطابقة
                      </button>

                      {obl.isActive && (
                        <button
                          onClick={() => {
                            setPayingObligation(obl);
                            setPayAmount(obl.amount.toString());
                            setPayPeriod('');
                          }}
                          className="text-[11px] bg-[#0071e3] text-white hover:bg-[#0077ed] font-bold px-4 py-1.5 rounded-lg transition flex items-center justify-center gap-1 shadow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>سداد دفعة</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm('هل أنت متأكد من رغبتك في حذف هذا الالتزام وجدولته؟')) {
                            deleteRecurringObligation(obl.id);
                          }
                        }}
                        title="حذف الالتزام"
                        className="text-gray-500 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* RENDER VIEW TAB 2: ADDITION FORM OBLIGATION */}
      {activeTab === 'add' && (
        <form onSubmit={handleCreateObligation} className="p-6 bg-[#1d1d1f] rounded-3xl border border-[#333336] max-w-4xl mx-auto space-y-6">
          <div className="border-b border-[#333336] pb-4">
            <h2 className="text-lg font-bold text-[#f5f5f7]">توثيق وجدولة التزام دوري أو قسط شهري جديد</h2>
            <p className="text-xs text-[#86868b] mt-1">املاء تفاصيل العقد أو الأقساط بشكل دقيق وسيقوم النظام بالتأثير المحاسبي والتنبيه بناء عليه.</p>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Content - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">
            
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#cfcfd2] block">عنوان الالتزام المالي دال مفسر:</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="مثال: إيجار مخزن حديد السبتية - عقد السويفي"
                required
                className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0071e3]"
              />
            </div>

            {/* Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#cfcfd2] block">نوع فئة الالتزام التلقائي:</label>
              <select
                value={oblType}
                onChange={e => handleTypeChange(e.target.value as any)}
                className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] cursor-pointer"
              >
                <option value="rent">إيجار مخزن / أرض / معدة (Rent)</option>
                <option value="loan_installment">قسط قرض أو قسط تمويل شراء آليات (Loan Installment)</option>
                <option value="salary">رواتب عمال دورية (Salaries)</option>
                <option value="tax">ضرائب ورسوم (دمغات / قيمة مضافة) (Taxes)</option>
                <option value="insurance">تأمينات اجتماعية وصحية (Insurance)</option>
                <option value="subscription">اشتراك برمجيات ومرافق (Subscription)</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-[#cfcfd2] block">وصف تفصيلي أو بنود وشروط التعاقد:</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="اكتب هنا أي شروط، تواريخ الزيادة، أو ملخص للمستند القانوني..."
                rows={2}
                className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] resize-none"
              />
            </div>

            {/* EXPENSE CATEGORIES MATCHING */}
            <div className="bg-black/40 p-4 rounded-2xl border border-[#333336]/60 space-y-4 md:col-span-2">
              <h4 className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>الربط والتوجيه المحاسبي التلقائي للقيد (عند الدفع):</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#86868b] block">فئة المصروف الرئيسي للتأثير:</label>
                  <select
                    value={expenseCategory}
                    onChange={e => {
                      setExpenseCategory(e.target.value);
                      const sub = CATEGORY_STRUCTURES[e.target.value]?.subCategories[0] || 'أخرى';
                      setExpenseSubCategory(sub);
                    }}
                    className="w-full bg-black border border-[#333336] rounded-xl px-3 py-2.5 text-xs text-[#f5f5f7]"
                  >
                    {Object.keys(CATEGORY_STRUCTURES).map(catKey => (
                      <option key={catKey} value={catKey}>{CATEGORY_STRUCTURES[catKey].nameAr}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#86868b] block">الفئة التفصيلية للمصروف الدفتر:</label>
                  <select
                    value={expenseSubCategory}
                    onChange={e => setExpenseSubCategory(e.target.value)}
                    className="w-full bg-black border border-[#333336] rounded-xl px-3 py-2.5 text-xs text-[#f5f5f7]"
                  >
                    {(CATEGORY_STRUCTURES[expenseCategory]?.subCategories || ['أخرى']).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payee Type & Payee Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#cfcfd2] block">تصنيف الجهة المستلمة للمال:</label>
              <select
                value={payeeType}
                onChange={e => setPayeeType(e.target.value as any)}
                className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7]"
              >
                <option value="bank">البنك / الكيان التمويلي</option>
                <option value="landlord">مالك العقار والساحات</option>
                <option value="employee">الموظفين والعمال في الساحة</option>
                <option value="government">مصلحة الضرائب والجهات الرسمية</option>
                <option value="supplier">مورد خارجي أو متعاقد خدمات</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#cfcfd2] block">اسم الجهة المستفيدة:</label>
              <input
                type="text"
                value={payeeName}
                onChange={e => setPayeeName(e.target.value)}
                placeholder="مثال: بنك مصر / الهيئة العامة للضرائب / الحاج صادق"
                required
                className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7]"
              />
            </div>

            {/* Money: Amount & Currency */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#cfcfd2] block">مبلغ الالتزام لكل فترة (الدوري):</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="مثال: 15000"
                  required
                  min="0"
                  step="any"
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7]"
                />
                <span className="absolute left-4 top-3 text-[11px] text-gray-500 font-bold">{currency}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#cfcfd2] block">العملة المقررة عقدياً:</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as any)}
                className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7]"
              >
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>

            {/* Payment Method & Bank Account */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#cfcfd2] block">طريقة السداد المفترضة محاسبياً:</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7]"
              >
                <option value="cash">نقداً من خزينة الساحة</option>
                <option value="bank_transfer">تحويل بنكي / إيداع</option>
                <option value="cheque">شيك مالي بمستند</option>
                <option value="auto_debit">سحب مباشر من حساب البنك</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#cfcfd2] block">الخزينة أو الحساب البنكي المربوط:</label>
              <select
                value={bankAccountId}
                onChange={e => setBankAccountId(e.target.value)}
                required={paymentMethod !== 'cash'}
                className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7]"
              >
                <option value="">-- اختر الحساب البنكي (إن وجد) --</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.accountNumber.slice(-4)}) - رصيد: {getBankBalance(b.id).toLocaleString()} ج.م</option>
                ))}
              </select>
            </div>

            {/* SCHEDULING SETTINGS */}
            <div className="p-4 bg-black/40 border border-[#333336] rounded-2xl md:col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-blue-400 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>إعدادات الدورية والاستحقاق الزمني:</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#86868b] block">معدل التكرار الدائم:</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as any)}
                    className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="monthly">شهرياً (Monthly)</option>
                    <option value="quarterly">ربع سنوي (Quarterly)</option>
                    <option value="semi_annual">نصف سنوي (Semi Annual)</option>
                    <option value="annual">سنوياً (Annual)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#86868b] block">يوم السداد المستحق من الشهر:</label>
                  <input
                    type="number"
                    value={dayOfMonth}
                    onChange={e => setDayOfMonth(e.target.value)}
                    min="1"
                    max="31"
                    placeholder="مثال: 5"
                    className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#86868b] block">تاريخ تفعيل هذا العقد بالساحة:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-[#1d1d1f] border border-[#333336] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* DYNAMIC SUBSECTION TYPE-SPECIFIC COMPONENT */}
            
            {/* 1. LOAN INSTALLMENT SECTION */}
            {oblType === 'loan_installment' && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl md:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4" />
                  <span>تفاصيل القرض والتمويل المصرفي المربوط:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">معرف/رقم القرض في سجل البنك:</label>
                    <input
                      type="text"
                      value={loanId}
                      onChange={e => setLoanId(e.target.value)}
                      placeholder="رقم القرض أو مرجع البنك"
                      className="w-full bg-black border border-amber-500/20 text-xs text-white p-2 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">إجمالي مبلغ التمويل الرئيسي الكلي:</label>
                    <input
                      type="number"
                      value={totalLoanAmount}
                      onChange={e => setTotalLoanAmount(e.target.value)}
                      placeholder="1,200,000"
                      className="w-full bg-black border border-amber-500/20 text-xs text-white p-2 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">المبلغ المتبقي حالياً للسداد:</label>
                    <input
                      type="number"
                      value={remainingLoanAmount}
                      onChange={e => setRemainingLoanAmount(e.target.value)}
                      placeholder="420,000"
                      className="w-full bg-black border border-amber-500/20 text-xs text-white p-2 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">نسبة فائدة القرض للبنك (%):</label>
                    <input
                      type="number"
                      value={loanInterestRate}
                      onChange={e => setLoanInterestRate(e.target.value)}
                      placeholder="14.5"
                      step="any"
                      className="w-full bg-black border border-amber-500/20 text-xs text-white p-2 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">العدد الكلي للأقساط التمويلية:</label>
                    <input
                      type="number"
                      value={totalInstallments}
                      onChange={e => setTotalInstallments(e.target.value)}
                      placeholder="36"
                      className="w-full bg-black border border-amber-500/20 text-xs text-white p-2 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">عدد الأقساط المسددة سابقاً:</label>
                    <input
                      type="number"
                      value={paidInstallments}
                      onChange={e => setPaidInstallments(e.target.value)}
                      placeholder="17"
                      className="w-full bg-black border border-amber-500/20 text-xs text-white p-2 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. LEASE/RENT CONTRACT DETAILS */}
            {oblType === 'rent' && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl md:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  <span>تفاصيل وبيانات عقد الإيجار العقاري:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">رقم عقد الإيجار الرسمي:</label>
                    <input
                      type="text"
                      value={contractNumber}
                      onChange={e => setContractNumber(e.target.value)}
                      placeholder="CON-2026-X"
                      className="w-full bg-black border border-emerald-500/20 text-xs text-white p-2 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">نوع العقار المؤجر بالساحة:</label>
                    <select
                      value={propertyType}
                      onChange={e => setPropertyType(e.target.value as any)}
                      className="w-full bg-black border border-emerald-500/20 text-xs text-white p-2 rounded-xl"
                    >
                      <option value="land">مساحة أرض للتخزين</option>
                      <option value="warehouse">مستودع مغطى (جمالون)</option>
                      <option value="office">مكتب إداري</option>
                      <option value="scale">ميزان البسكول</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">عنوان العقار المسجل بالعقد:</label>
                    <input
                      type="text"
                      value={propertyAddress}
                      onChange={e => setPropertyAddress(e.target.value)}
                      placeholder="مثال: السبتية بجوار الورش برقم 12"
                      className="w-full bg-black border border-emerald-500/20 text-xs text-white p-2 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">مبلغ التأمين المدفوع مقدماً:</label>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      placeholder="50000"
                      className="w-full bg-black border border-emerald-500/20 text-xs text-white p-2 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">نسبة الزيادة السنوية المقررة (%):</label>
                    <input
                      type="number"
                      value={increasePercentage}
                      onChange={e => setIncreasePercentage(e.target.value)}
                      placeholder="10"
                      className="w-full bg-black border border-emerald-500/20 text-xs text-white p-2 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. TAX CONTRACT DETAILS */}
            {oblType === 'tax' && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl md:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4" />
                  <span>تفاصيل الإقرار الضريبي والذكاة المربوطة:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">نوع الضريبة الدورية:</label>
                    <select
                      value={taxType}
                      onChange={e => setTaxType(e.target.value as any)}
                      className="w-full bg-black border border-blue-500/20 text-xs text-white p-2 rounded-xl"
                    >
                      <option value="vat">ضريبة القيمة المضافة (VAT)</option>
                      <option value="income">ضريبة الدخل التجاري</option>
                      <option value="stamp">ضريبة تمغات ورسوم بلدية</option>
                      <option value="municipal">ضرائب ورسوم حي/تنظيم</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">رقم التسجيل والملف الضريبي:</label>
                    <input
                      type="text"
                      value={taxNumber}
                      onChange={e => setTaxNumber(e.target.value)}
                      placeholder="123-456-789"
                      className="w-full bg-black border border-blue-500/20 text-xs text-white p-2 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868b] block">الوعاء المالي التقديري الضريبي:</label>
                    <input
                      type="number"
                      value={taxableAmount}
                      onChange={e => setTaxableAmount(e.target.value)}
                      placeholder="الأرباح الخاضعة للضريبة"
                      className="w-full bg-black border border-blue-500/20 text-xs text-white p-2 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notification and Auto Actions */}
            <div className="space-y-1 md:col-span-1">
              <label className="text-[11px] font-bold text-[#cfcfd2] block">تنبيه بالاستحقاق قبل (كم يوم):</label>
              <input
                type="number"
                value={notificationDaysBefore}
                onChange={e => setNotificationDaysBefore(e.target.value)}
                min="1"
                placeholder="3"
                className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7]"
              />
            </div>

            <div className="md:col-span-1 flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="auto-create"
                checked={autoCreateTransaction}
                onChange={e => setAutoCreateTransaction(e.target.checked)}
                className="w-4.5 h-4.5 bg-black border border-[#333336] text-[#0071e3] focus:ring-[#0071e3] rounded cursor-pointer"
              />
              <label htmlFor="auto-create" className="text-xs font-bold text-[#cfcfd2] cursor-pointer">
                إنشاء الحركة في الدفاتر محاسبياً فور مواجهة الاستحقاق تلقائياً؟
              </label>
            </div>

          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#333336]">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-5 py-2.5 text-xs text-[#86868b] hover:text-[#f5f5f7] transition"
            >
              إلغاء الرجوع
            </button>
            <button
              type="submit"
              className="bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold px-6 py-2.5 rounded-2xl text-xs transition shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>تسجيل وجدولة الالتزام بالقاعدة</span>
            </button>
          </div>
        </form>
      )}

      {/* RENDER VIEW TAB 3: PAYMENT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-[#1d1d1f] rounded-3xl border border-[#333336] p-6 space-y-4">
          <div className="border-b border-[#333336] pb-4">
            <h2 className="text-lg font-bold text-[#f5f5f7]">سجل سحوبات وسداد التزامات الخزينة والبنك الدورية</h2>
            <p className="text-xs text-[#86868b] mt-1">كشف تاريخي يوضح المبالغ التي دفعت للجهات المختلفة وتواريخ صرفها لربط الأرصدة كلياً.</p>
          </div>

          {recurringPaymentLogs.length === 0 ? (
            <div className="p-12 text-center text-[#86868b] text-xs">
              <FileText className="w-12 h-12 text-[#333336] mx-auto mb-3" />
              لا توجد دفعات مصحوبة سابقة في السجل حتى اللحظة.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[#333336] text-[#86868b] font-bold">
                    <th className="py-3 px-4">رقم الحركة</th>
                    <th className="py-3 px-4">الالتزام الأصلي</th>
                    <th className="py-3 px-4">القيمة المدفوعة</th>
                    <th className="py-3 px-4">الفترة والاتفاق عن</th>
                    <th className="py-3 px-4">تاريخ الصرف المعين</th>
                    <th className="py-3 px-4">طريقة السحب</th>
                    <th className="py-3 px-4">ملاحظات المستند الورقي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333336]/40">
                  {recurringPaymentLogs.map(log => {
                    const matchedObl = recurringObligations.find(o => o.id === log.obligationId);
                    return (
                      <tr key={log.id} className="hover:bg-black/20 text-[#f5f5f7]">
                        <td className="py-3 px-4 text-gray-500 font-mono text-[10px]">{log.id}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold block text-[#f5f5f7]">{matchedObl ? matchedObl.title : 'التزام محذوف'}</span>
                          <span className="text-[10px] text-gray-400">{matchedObl ? getObligationTypeLabel(matchedObl.type) : 'غير معروف'}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#30d158]">
                          {log.amountPaid.toLocaleString()} جنيه
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-black/50 text-[#86868b] px-2.5 py-1 rounded-full font-semibold border border-[#333336]">
                            {log.periodText}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300 font-mono">{log.paymentDate}</td>
                        <td className="py-3 px-4 text-amber-500 font-medium">
                          {getMethodAr(log.paymentMethod)}
                        </td>
                        <td className="py-3 px-4 text-gray-400 italic max-w-xs truncate" title={log.notes}>
                          {log.notes || '--'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RENDER DETAILED VIEW DRILL-DOWN IF VIEWING OBLIGATION */}
      {viewingObligation && (
        <div className="bg-[#1d1d1f] rounded-3xl border border-[#0071e3] p-6 space-y-6 animate-fade-in max-w-4xl mx-auto relative">
          <button 
            type="button" 
            onClick={() => setViewingObligation(null)}
            className="absolute top-6 left-6 text-gray-400 hover:text-white bg-black/40 p-2 rounded-full border border-[#333336]"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="border-b border-[#333336] pb-4">
            <div className="flex items-center gap-2 mb-1.5">
              {getObligationTypeIcon(viewingObligation.type)}
              <span className="text-xs text-[#86868b]">{getObligationTypeLabel(viewingObligation.type)}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{viewingObligation.title}</h2>
            <p className="text-xs text-[#86868b]">{viewingObligation.description}</p>
          </div>

          {/* Details split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-right">
            
            {/* Split right: Financial Contract */}
            <div className="bg-black/40 p-5 rounded-2xl border border-[#333336] space-y-4">
              <h3 className="text-amber-500 font-bold border-b border-[#333336]/60 pb-1.5 flex items-center gap-1.5">
                <Landmark className="w-4 h-4" />
                <span>البيانات والمبالغ المالية (الأساسية):</span>
              </h3>

              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-[#86868b]">المبلغ الدوري الأساسي:</span>
                  <span className="font-bold text-white text-[13px]">{viewingObligation.amount.toLocaleString()} {viewingObligation.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868b]">معدل التكرار:</span>
                  <span className="text-white font-medium">كل {viewingObligation.frequency === 'monthly' ? 'شهر' : 'فترة'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868b]">استحقاق السداد:</span>
                  <span className="text-amber-400 font-bold">يوم {viewingObligation.dayOfMonth} للدفعة</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868b]">طريقة السداد:</span>
                  <span className="text-white">{getMethodAr(viewingObligation.paymentMethod)}</span>
                </div>
                {viewingObligation.bankAccountName && (
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">الحساب البنكي المتأثر:</span>
                    <span className="text-white font-bold">{viewingObligation.bankAccountName} / ({viewingObligation.bankAccountId})</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#86868b]">تنبيه مبكر:</span>
                  <span className="text-white">قبل {viewingObligation.notificationDaysBefore} أيام</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868b]">المستخدم المنشئ للالتزام:</span>
                  <span className="text-[#86868b]">{viewingObligation.createdBy}</span>
                </div>
              </div>
            </div>

            {/* Split Left: Structural type details */}
            <div className="bg-black/40 p-5 rounded-2xl border border-[#333336] space-y-4">
              <h3 className="text-blue-400 font-bold border-b border-[#333336]/60 pb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>المعلومات المحددة للعقد:</span>
              </h3>

              {viewingObligation.type === 'loan_installment' && viewingObligation.loanDetails ? (
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">رقم القرض في البنك:</span>
                    <span className="font-bold text-white">{viewingObligation.loanDetails.loanId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">مبلغ التمويل الأصلي الكلي:</span>
                    <span className="font-bold text-white">{viewingObligation.loanDetails.totalLoanAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">المبلغ المتبقي المعين:</span>
                    <span className="font-bold text-amber-400">{viewingObligation.loanDetails.remainingAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">معدل الفائدة السنوية المتفق عليها:</span>
                    <span className="text-white font-mono">{viewingObligation.loanDetails.interestRate} %</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">الأقساط المدفوعة والمتبقية:</span>
                    <span className="text-white font-bold">{viewingObligation.loanDetails.paidInstallments} مدفوع / {viewingObligation.loanDetails.totalInstallments} كلي</span>
                  </div>
                </div>
              ) : viewingObligation.type === 'rent' && viewingObligation.rentDetails ? (
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">رقم العقد الإيجاري:</span>
                    <span className="font-bold text-white">{viewingObligation.rentDetails.contractNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">نوع العقار المؤجر:</span>
                    <span className="text-white">{viewingObligation.rentDetails.propertyType === 'land' ? 'أرض فضاء لتخزين الخردة' : viewingObligation.rentDetails.propertyType === 'warehouse' ? 'جمالون مغطى' : 'مبنى إداري وميزان'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">مبلغ التأمين المدفوع مقدماً:</span>
                    <span className="font-bold text-white">{viewingObligation.rentDetails.depositAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">نسبة الزيادة السنوية بالإيجار:</span>
                    <span className="text-[#30d158] font-bold">▲ {viewingObligation.rentDetails.increasePercentage} % سنوياً</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">تاريخ آخر سداد مع زيادة:</span>
                    <span className="text-white">{viewingObligation.rentDetails.lastIncreaseDate || '--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">عنوان الأرض التابع:</span>
                    <span className="text-white italic">{viewingObligation.rentDetails.propertyAddress}</span>
                  </div>
                </div>
              ) : viewingObligation.type === 'tax' && viewingObligation.taxDetails ? (
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">نوع الإقرار الضريبي:</span>
                    <span className="font-bold text-white">{viewingObligation.taxDetails.taxType === 'vat' ? 'ضريبة القيمة المضافة الإلزامية' : 'إقرار كسب عمل ودخل'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">رقم الملف والتسجيل الضريبي:</span>
                    <span className="text-white font-mono">{viewingObligation.taxDetails.taxNumber}</span>
                  </div>
                  {viewingObligation.taxDetails.vatPercentage && (
                    <div className="flex justify-between">
                      <span className="text-[#86868b]">نسبة الضريبة المفروضة:</span>
                      <span className="text-white font-bold">{viewingObligation.taxDetails.vatPercentage} %</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-gray-500/5 rounded-xl text-center text-gray-400">
                  لا توجد معلومات إضافية مخصصة لهذا النوع الهجين من العقود. تندرج الحركة تحت المصروف القياسي.
                </div>
              )}
            </div>

          </div>

          {/* History of Payment Logs for this obligation spec */}
          <div className="p-4 bg-black/40 border border-[#333336] rounded-2xl">
            <h3 className="text-xs font-bold text-[#f5f5f7] mb-3 border-b border-[#333336]/60 pb-1.5">تاريخ المعاملات والدفعات لهذا العقد تحديداً ({recurringPaymentLogs.filter(gl => gl.obligationId === viewingObligation.id).length}):</h3>
            
            {recurringPaymentLogs.filter(gl => gl.obligationId === viewingObligation.id).length === 0 ? (
              <div className="text-center p-6 text-gray-500 text-xs">لم تسجل أي دفعات في القاعدة لصالح هذا العقد بعد.</div>
            ) : (
              <div className="space-y-2.5">
                {recurringPaymentLogs.filter(gl => gl.obligationId === viewingObligation.id).map(log => (
                  <div key={log.id} className="bg-black/80 rounded-xl p-3 flex justify-between items-center text-xs text-right border border-[#333336]/40">
                    <div>
                      <span className="text-white font-bold block">{log.amountPaid.toLocaleString()} جنيه</span>
                      <span className="text-[10px] text-[#86868b]">{log.notes || 'سداد مستندي منتظم'}</span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold block mb-1">{log.periodText}</span>
                      <span className="text-[10px] text-gray-500">{log.paymentDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick pay directly from detail view! */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setViewingObligation(null)}
              className="bg-black text-[#f5f5f7] border border-[#333336] text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#1d1d1f]"
            >
              العودة لكافة العقود
            </button>
            <button
              onClick={() => {
                const target = viewingObligation;
                setViewingObligation(null);
                setPayingObligation(target);
                setPayAmount(target.amount.toString());
              }}
              className="bg-[#0071e3] text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-[#0077ed]"
            >
              سداد قسط أو إيجار فوري لهذا العقد
            </button>
          </div>
        </div>
      )}

      {/* RENDER EVENT POPUP: RECORD OBLIGATION PAYMENT */}
      {payingObligation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1d1d1f] rounded-3xl border border-[#0071e3] p-6 max-w-md w-full space-y-4 animate-scale-in text-right">
            
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-white text-sm">سداد وتوثيق حركة التزام دوري جديد</h3>
              <button 
                onClick={() => setPayingObligation(null)}
                className="text-[#86868b] hover:text-[#f5f5f7] p-1 bg-black/40 rounded-full border border-[#333336]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-b border-[#333336] pb-2 text-xs">
              <span className="text-[#86868b] block">اسم العقد المستحق:</span>
              <span className="font-bold text-white text-[13px]">{payingObligation.title}</span>
              <span className="text-[10px] text-amber-500 font-bold block pt-1">
                دورية الدفع: {payingObligation.frequency === 'monthly' ? 'شهرياً' : viewingObligation?.frequency} - مستحق في اليوم {payingObligation.dayOfMonth}
              </span>
            </div>

            {payError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                {payError}
              </div>
            )}
            {paySuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                {paySuccess}
              </div>
            )}

            <form onSubmit={handlePayObligationSubmit} className="space-y-4 text-xs">
              
              {/* Payment Period Text */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#cfcfd2] block">الفترة المستهدفة بالسداد (مطلوب):</label>
                <input
                  type="text"
                  value={payPeriod}
                  onChange={e => setPayPeriod(e.target.value)}
                  placeholder="مثال: يونيو 2026 أو الربع الثالث 2026"
                  required
                  className="w-full bg-black border border-[#333336] rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              {/* Amount paid */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#cfcfd2] block">القيمة المدفوعة فعلياً:</label>
                <div className="relative">
                  <input
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="25000"
                    required
                    min="1"
                    step="any"
                    className="w-full bg-black border border-[#333336] rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                  <span className="absolute left-3.5 top-2.5 text-gray-500 font-bold">{payingObligation.currency}</span>
                </div>
              </div>

              {/* Date Paid */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#cfcfd2] block">تاريخ الدفع والتحويل:</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  required
                  className="w-full bg-black border border-[#333336] rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#cfcfd2] block">ملاحظات إيصال السداد وتحرير الدفعة:</label>
                <textarea
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="رقم الحوالة البنكية، رقم إيصال الاستلام من الحاج السويفي..."
                  rows={2}
                  className="w-full bg-black border border-[#333336] rounded-xl px-3.5 py-2.5 text-xs text-white resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPayingObligation(null)}
                  className="text-xs text-[#86868b] hover:text-white px-3 py-2"
                >
                  إلغاء المعاملة
                </button>
                <button
                  type="submit"
                  className="bg-[#0071e3] text-white hover:bg-[#0077ed] font-bold px-4 py-2 rounded-xl transition shadow"
                >
                  اعتماد السداد والترحيل
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
