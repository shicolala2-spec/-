/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Expense } from '../types';
import { 
  Plus, Search, Calendar, Filter, Trash2, Edit3, ArrowUpRight, 
  ArrowDownLeft, Printer, FileText, Upload, HelpCircle, 
  BarChart3, PieChart, Users, Coins, Image, Check, ChevronDown, 
  TrendingUp, TrendingDown, Clipboard, AlertCircle, Sparkles
} from 'lucide-react';
import { unifiedDocumentAnalysis } from '../lib/documentAnalyzer';

export const CATEGORY_STRUCTURES: Record<string, { nameAr: string; subCategories: string[] }> = {
  Transportation: {
    nameAr: 'نقل وشحن (Transportation)',
    subCategories: [
      'إيجار سيارات نقل',
      'وقود (سولار/بنزين)',
      'صيانة سيارات',
      'إطارات وزيوت',
      'حوادث ومخالفات',
      'تحميل وتفريغ'
    ]
  },
  Labor: {
    nameAr: 'عمالة (Labor)',
    subCategories: [
      'رواتب شهرية',
      'مكافآت وحوافز',
      'أجر يومي (عمال موسميين)',
      'تأمينات اجتماعية',
      'إصابات عمل'
    ]
  },
  Rent: {
    nameAr: 'إيجارات (Rent)',
    subCategories: [
      'إيجار أرض/مخزن',
      'إيجار مكتب',
      'إيجار موازين'
    ]
  },
  Utilities: {
    nameAr: 'مرافق (Utilities)',
    subCategories: [
      'كهرباء',
      'مياه',
      'غاز',
      'إنترنت وتليفونات'
    ]
  },
  Commissions: {
    nameAr: 'عمولات (Commissions)',
    subCategories: [
      'عمولة سماسرة شراء',
      'عمولة سماسرة بيع',
      'عمولة مندوبين'
    ]
  },
  Maintenance: {
    nameAr: 'صيانة (Maintenance)',
    subCategories: [
      'صيانة موازين',
      'صيانة معدات (كلاركات، لوادر)',
      'صيانة مباني'
    ]
  },
  Taxes: {
    nameAr: 'ضرائب ورسوم (Taxes & Fees)',
    subCategories: [
      'ضريبة قيمة مضافة',
      'ضرائب دخل',
      'رسوم تراخيص',
      'دمغة'
    ]
  },
  Other: {
    nameAr: 'أخرى (Other)',
    subCategories: [
      'قرطاسية',
      'ضيافة',
      'سفر وانتقالات',
      'دعاية وإعلان',
      'هدايا وعزومات'
    ]
  }
};

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense, user, banks } = useApp();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'reports'>('list');

  // Addition state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Transportation');
  const [subCategory, setSubCategory] = useState('وقود (سولار/بنزين)');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'cheque'>('cash');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState<string>('');
  
  // Addition form status feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // AI OCR integration state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);

  const handleAnalyzeInvoice = async () => {
    if (!attachment) return;
    setIsAnalyzing(true);
    setErrorMsg('');
    setSuccessMsg('');
    setAnalysisSuccess(false);

    try {
      const res = await unifiedDocumentAnalysis(attachment, 'invoice', true);
      const data: any = res.expense || res;
      
      // Map extracted values into the React inputs
      if (data.amount !== undefined && data.amount !== null) {
        setAmount(data.amount.toString());
      }
      if (data.categoryKey) {
        setCategory(data.categoryKey);
        if (data.subCategory) {
          setSubCategory(data.subCategory);
        } else {
          const subs = CATEGORY_STRUCTURES[data.categoryKey]?.subCategories || [];
          setSubCategory(subs[0] || '');
        }
      }
      if (data.description) setDescription(data.description);
      if (data.date) setDate(data.date);
      if (data.receiptNumber) setReceiptNumber(data.receiptNumber);
      if (data.supplierName) setSupplierName(data.supplierName);
      if (data.notes) setNotes(data.notes);

      setAnalysisSuccess(true);
      if (res.isMockDemo || data.isMockDemo) {
        setSuccessMsg('✨ وضع محاكاة الفاتورة السريع: تم تعبئة البيانات آلياً بنجاح! للتشغيل بقارئ سحابي حقيقي يمكنك تعبئة مفتاحك في شاشة لوحة القيادة.');
      } else {
        setSuccessMsg('✨ تم بنجاح قراءة المستند تلقائياً بالذكاء الاصطناعي وتعبئة حقول ومبالغ الحسابات لشركة الهضبة!');
      }
      setTimeout(() => setSuccessMsg(''), 7000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'فشلت عملية القراءة والتحليل التلقائي للمستند (AI OCR).');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Editing state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  
  // Date range filters
  const todayStr = new Date().toISOString().split('T')[0];
  const startOfMonthStr = `${todayStr.slice(0, 8)}01`;
  const [filterStartDate, setFilterStartDate] = useState(startOfMonthStr);
  const [filterEndDate, setFilterEndDate] = useState(todayStr);

  // Printable Statement Trigger
  const [printFilterView, setPrintFilterView] = useState(false);

  // Helper translations
  const getCategoryNameAr = (catKey: string) => {
    return CATEGORY_STRUCTURES[catKey]?.nameAr.split(' (')[0] || catKey;
  };

  const getPaymentMethodNameAr = (method: string) => {
    switch (method) {
      case 'cash': return 'نقداً/كاش';
      case 'bank': return 'تحويل بنكي';
      case 'cheque': return 'شيك مصرفي';
      default: return method;
    }
  };

  // Change category sub-categories automatically on category change
  const handleCategoryChange = (catKey: string) => {
    setCategory(catKey);
    const subs = CATEGORY_STRUCTURES[catKey]?.subCategories || [];
    setSubCategory(subs[0] || '');
  };

  // Handle Drag & Drop File uploads
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachment(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const selectFile = () => {
    fileInputRef.current?.click();
  };

  // Process Add Expense
  const handleSubmitExpense = (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('الرجاء إدخال قيمة مالية صحيحة للمصروف.');
      return;
    }

    if ((paymentMethod === 'bank' || paymentMethod === 'cheque') && !selectedBankId) {
      setErrorMsg('الرجاء اختيار الحساب البنكي المخصوم منه المصروف التشغيلي.');
      return;
    }

    addExpense({
      amount: val,
      category,
      subCategory,
      description,
      date,
      paymentMethod,
      receiptNumber,
      supplierName,
      notes,
      attachment,
      bankId: selectedBankId || undefined
    });

    setSuccessMsg('تم تسجيل حجة وتحرير المصروف التشغيلي بنجاح!');
    
    // Reset values
    setAmount('');
    setDescription('');
    setReceiptNumber('');
    setSupplierName('');
    setNotes('');
    setAttachment('');
    setSelectedBankId('');

    if (!addAnother) {
      setTimeout(() => {
        setActiveTab('list');
        setSuccessMsg('');
      }, 1500);
    } else {
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Save Edit Expense
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const val = parseFloat(editingExpense.amount.toString());
    if (isNaN(val) || val <= 0) {
      alert('الرجاء إدخال مبلغ صحيح وموجب.');
      return;
    }

    updateExpense({
      ...editingExpense,
      amount: val
    });

    setEditingExpense(null);
    setSuccessMsg('تم تعديل قيد سجل المصروف وحفظ التغييرات بنجاح!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Filter list
  const filteredExpenses = expenses.filter(exp => {
    // Search text match
    const matchesSearch = 
      (exp.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.receiptNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.subCategory || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Category match
    const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;

    // Payment Method Match
    const matchesPayment = filterPaymentMethod === 'all' || exp.paymentMethod === filterPaymentMethod;

    // Date range match
    const matchesDate = 
      (!filterStartDate || exp.date >= filterStartDate) &&
      (!filterEndDate || exp.date <= filterEndDate);

    return matchesSearch && matchesCategory && matchesPayment && matchesDate;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Statistics for period (based on date filters)
  const statsExpenses = expenses.filter(exp => {
    const matchesDate = 
      (!filterStartDate || exp.date >= filterStartDate) &&
      (!filterEndDate || exp.date <= filterEndDate);
    return matchesDate;
  });

  const totalPeriodAmount = statsExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const avgExpenseAmount = statsExpenses.length > 0 ? (totalPeriodAmount / statsExpenses.length) : 0;
  const maxExpenseAmount = statsExpenses.length > 0 ? Math.max(...statsExpenses.map(e => e.amount)) : 0;

  // Breakdown by Category
  const categoryBreakdown = Object.keys(CATEGORY_STRUCTURES).map(catKey => {
    const matched = statsExpenses.filter(e => e.category === catKey);
    const total = matched.reduce((sum, e) => sum + e.amount, 0);
    const percentage = totalPeriodAmount > 0 ? ((total / totalPeriodAmount) * 100) : 0;
    return {
      categoryKey: catKey,
      nameAr: CATEGORY_STRUCTURES[catKey]?.nameAr.split(' (')[0],
      total,
      percentage,
      count: matched.length
    };
  }).sort((a, b) => b.total - a.total);

  // Transportation Specific Report
  const transportExpenses = statsExpenses.filter(e => e.category === 'Transportation');
  const totalTransportAmount = transportExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Top 5 expenses
  const topExpenses = [...statsExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

  // MoM calculations (comparing current period start date month with previous month same date period)
  // Let's get MoM for this current month
  const currentMonthNum = parseInt(todayStr.split('-')[1], 10);
  const currentYearNum = parseInt(todayStr.split('-')[0], 10);
  
  const currentMonthExpenses = expenses.filter(e => {
    const y = parseInt(e.date.split('-')[0], 10);
    const m = parseInt(e.date.split('-')[1], 10);
    return y === currentYearNum && m === currentMonthNum;
  });
  const currentMonthSum = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const prevMonthNum = currentMonthNum === 1 ? 12 : currentMonthNum - 1;
  const prevYearNum = currentMonthNum === 1 ? currentYearNum - 1 : currentYearNum;
  
  const prevMonthExpenses = expenses.filter(e => {
    const y = parseInt(e.date.split('-')[0], 10);
    const m = parseInt(e.date.split('-')[1], 10);
    return y === prevYearNum && m === prevMonthNum;
  });
  const prevMonthSum = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const momDiff = currentMonthSum - prevMonthSum;
  const momPercentage = prevMonthSum > 0 ? ((momDiff / prevMonthSum) * 100) : 0;

  return (
    <div id="expenses-page-root" className="space-y-6 text-[#f5f5f7] font-sans" dir="rtl">
      
      {/* Title Header Block */}
      <div id="expenses-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161617] p-6 rounded-3xl border border-[#333336] print:hidden">
        <div id="title-block">
          <h1 className="text-xl font-semibold text-white tracking-tight">نظام إدارة ومراقبة المصروفات التشغيلية</h1>
          <p className="text-[#86868b] text-xs font-normal">حوكمة وإثبات التكاليف المباشرة والغير مباشرة ومصروفات الشحن والعمالة لساحة فرز الهضبة.</p>
        </div>

        {/* Action pills tab picker */}
        <div className="flex items-center gap-1 bg-black p-1 rounded-full border border-[#333336]">
          <button
            onClick={() => { setActiveTab('list'); setPrintFilterView(false); }}
            className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
              activeTab === 'list' && !printFilterView
                ? 'bg-[#0071e3] text-white shadow-md' 
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            دفتر القيود
          </button>
          
          <button
            onClick={() => { setActiveTab('add'); setPrintFilterView(false); }}
            className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all flex items-center gap-1 ${
              activeTab === 'add'
                ? 'bg-[#0071e3] text-white shadow-md' 
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            <Plus className="w-3 h-3 text-white" />
            إضافة مصروف
          </button>

          <button
            onClick={() => { setActiveTab('reports'); setPrintFilterView(false); }}
            className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
              activeTab === 'reports'
                ? 'bg-[#0071e3] text-white shadow-md' 
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            تقارير وتحليلات المصاريف
          </button>
        </div>
      </div>

      {/* Alerts Feedback */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-medium flex items-center justify-between print:hidden">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg('')} className="text-[#86868b] hover:text-white text-[10px]">إغلاق</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-medium flex items-center justify-between print:hidden">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg('')} className="text-[#86868b] hover:text-white text-[10px]">إغلاق</button>
        </div>
      )}

      {/* TAB 1: ADD EXPENSE FORM */}
      {activeTab === 'add' && (
        <div className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6 print:hidden">
          <div className="border-b border-[#333336]/60 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#bf5af2]" />
              تحرير قيد مالي لمصروف تشغيلي جديد
            </h3>
            <p className="text-[#86868b] text-[11px] mt-0.5">الرجاء إدخال البيانات المعتمدة للتكلفة لضمان توازن الحسابات الختامية والأرباح التشغيلية.</p>
          </div>

          {/* AI Invoice Scan Assistant Banner */}
          <div className="bg-purple-950/20 border border-purple-500/20 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">مستخرج البيانات الذكي للفواتير (AI OCR) ✨</h4>
                <p className="text-[#86868b] text-[10px] mt-1 leading-relaxed">
                  ارفع صورة الفاتورة أو إيصال الدفع أو ملف PDF، وسيقوم نظام الذكاء الاصطناعي لجميني بقراءة وتعبئة المبلغ والتصنيف والبيان والتواريخ بلمحة بصر لمنع أخطاء الإدخال اليدوي!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
              <button
                type="button"
                onClick={selectFile}
                className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-2 rounded-xl text-[11px] cursor-pointer transition-colors flex items-center gap-1 w-full md:w-auto justify-center shadow-lg shadow-purple-500/10"
              >
                <Upload className="w-3.5 h-3.5 animate-pulse" />
                <span>تحميل ملف للفحص</span>
              </button>
            </div>
          </div>

          <form onSubmit={(e) => handleSubmitExpense(e, false)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Category Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">التصنيف الرئيسي التابع لمصرف الساحة:</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:border-[#0071e3] focus:outline-none cursor-pointer"
                >
                  {Object.keys(CATEGORY_STRUCTURES).map((key) => (
                    <option key={key} value={key}>{CATEGORY_STRUCTURES[key].nameAr}</option>
                  ))}
                </select>
              </div>

              {/* Sub Category Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">الفرع التفصيلي لمجال التكلفة:</label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:border-[#0071e3] focus:outline-none cursor-pointer"
                >
                  {(CATEGORY_STRUCTURES[category]?.subCategories || []).map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">المبلغ المالي الكلي المدفوع (جنيه مصري): *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="مبلغ المصروف بالجنيه ج.م"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#2997ff] font-bold focus:border-[#0071e3] focus:outline-none font-mono"
                />
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">تاريخ الدفع المعتمد بالفترة:</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-2.5 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] cursor-pointer font-mono"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">خزينة السداد والأرجية ممررة الدورة:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value as 'cash' | 'bank' | 'cheque');
                    setSelectedBankId('');
                  }}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] cursor-pointer"
                >
                  <option value="cash">نقدي فوري (خزينة الموقع الساحية)</option>
                  <option value="bank">تحويل فوري / حساب بنكي للشركاء</option>
                  <option value="cheque">شيك مقبول الدفع مؤمن</option>
                </select>
              </div>

              {(paymentMethod === 'bank' || paymentMethod === 'cheque') && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[11px] font-bold text-amber-500 block">ربط بمصرف الخصم البنكي:</label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    required
                    className="w-full bg-black border border-amber-500/40 rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:outline-none focus:border-amber-450 cursor-pointer"
                  >
                    <option value="">-- اختر البنك المخصوم منه --</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Receipt Number */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">رقم الفاتورة أو رقم إيصال الإسناد (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: REC-5421"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#0071e3] font-mono"
                />
              </div>

              {/* Target / Supplier Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">اسم الجهة المستفيدة / المتعهد (اختياري):</label>
                <input
                  type="text"
                  placeholder="الشركة الموردة أو اسم المقاول/مركز الصيانة..."
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              {/* Description Context */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">وصف المصروف التفصيلي المرفق:</label>
                <input
                  type="text"
                  placeholder="وصف واضح لربط المطابقة (مثال: صيانة لودر الساحة الكبير رصيف 3)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[11px] font-bold text-[#86868b] block">ملاحظات إملائية إضافية للمراجعة اللاحقة:</label>
                <textarea
                  placeholder="سجل أي تفاصيل إضافية قد تهم الحسابات أو المدقق المالي لساحة الهضبة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-2xl p-4 text-xs text-zinc-300 focus:outline-none focus:border-[#0071e3] h-20"
                />
              </div>

              {/* File Attachment Drag and Drop area */}
              <div className="md:col-span-3 space-y-2">
                <label className="text-[11px] font-bold text-[#86868b] block">مسند الإثبات وشهادة الدفع (صورة الإيصال أو فاتورة الصيانة أو PDF):</label>
                
                <div 
                  id="drag-drop-area"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                    dragActive 
                      ? 'border-[#0071e3] bg-[#0071e3]/10 text-white' 
                      : attachment 
                        ? 'border-emerald-500 bg-[#30d158]/5' 
                        : 'border-[#333336] bg-black hover:border-zinc-500'
                  }`}
                  onClick={selectFile}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                  />
                  
                  {attachment ? (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-20 h-20 rounded-xl border border-emerald-500/30 overflow-hidden flex items-center justify-center bg-[#161617] shadow-lg">
                        {attachment.startsWith('data:application/pdf') ? (
                          <div className="flex flex-col items-center text-center p-2">
                            <FileText className="w-8 h-8 text-amber-500" />
                            <span className="text-[8px] text-zinc-400 mt-1 font-mono">PDF Doc</span>
                          </div>
                        ) : (
                          <img src={attachment} alt="Attachment Proof Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      
                      <div className="text-center">
                        <span className="text-xs font-semibold text-emerald-400 block">
                          تم تحميل المستند بنجاح ({attachment.startsWith('data:application/pdf') ? 'ملف واجهة PDF كتابية' : 'صورة إيصال رقمية'})
                        </span>
                        <span className="text-[9px] text-[#86868b] mt-0.5 block">
                          اضغط على الزر بالأسفل لقراءة البيانات بالذكاء الاصطناعي قبل حفظ القيد.
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={isAnalyzing}
                          onClick={handleAnalyzeInvoice}
                          className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                            isAnalyzing 
                              ? 'bg-purple-900/60 text-purple-300 border border-purple-500/25 animate-pulse cursor-wait' 
                              : 'bg-purple-600 hover:bg-purple-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                          }`}
                        >
                          {isAnalyzing ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></span>
                              <span>جاري قراءة البيانات بجميني...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                              <span>ابدأ فحص واستخراج البيانات تلقائياً 🧠</span>
                            </>
                          )}
                        </button>
                        
                        <button 
                          type="button" 
                          onClick={() => setAttachment('')} 
                          className="px-4 py-2 bg-black hover:bg-zinc-950 border border-[#333336] rounded-xl text-xs text-zinc-400 hover:text-white transition-colors"
                        >
                          إلغاء وإزالة الملف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[#86868b] animate-bounce" />
                      <span className="text-xs text-[#f5f5f7] font-semibold">اسحب وألقِ صورة الإيصال أو ملف الـ PDF هنا</span>
                      <span className="text-[10px] text-[#86868b]">أو انقر لاختيار ملف يدوياً لتفعيله والمسح الفوري بالذكاء الاصطناعي</span>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#333336]/60">
              <button
                type="button"
                onClick={(e) => handleSubmitExpense(e, true)}
                className="bg-black hover:bg-[#1d1d1f] text-white border border-[#333336] font-medium py-2.5 px-6 rounded-full text-xs cursor-pointer transition-colors"
              >
                حفظ وإضافة مصروف آخر
              </button>
              
              <button
                type="submit"
                className="bg-[#0071e3] hover:bg-[#147ce5] text-white font-medium py-2.5 px-8 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ المصروف الرئيسي</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: EXPENSES LIST VIEW */}
      {activeTab === 'list' && !printFilterView && (
        <div className="space-y-6 print:hidden">
          
          {/* Filters card */}
          <div className="bg-[#161617] border border-[#333336] p-5 rounded-3xl space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#2997ff]" />
              صفحة فرز وتصفية حركة الصرف والقيود الحالية
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              
              {/* Search text match */}
              <div className="space-y-1">
                <label className="text-[10px] text-[#86868b] font-bold">ابحث بالبيان أو المستند أو الجهة:</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث بالوصف، الإيصال، الاسم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black border border-[#333336] rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-[#0071e3]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#86868b] absolute right-3 top-3" />
                </div>
              </div>

              {/* Category Select */}
              <div className="space-y-1">
                <label className="text-[10px] text-[#86868b] font-bold">الفئة الرئيسية للنفقة:</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="all">كل الفئات الأساسية</option>
                  {Object.keys(CATEGORY_STRUCTURES).map((key) => (
                    <option key={key} value={key}>{CATEGORY_STRUCTURES[key].nameAr.split(' (')[0]}</option>
                  ))}
                </select>
              </div>

              {/* Payment Select */}
              <div className="space-y-1">
                <label className="text-[10px] text-[#86868b] font-bold">طريقة السداد والخزينة ممررة الدورة:</label>
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="all">جميع وسائل السداد</option>
                  <option value="cash">نقدي (كاش الساحة)</option>
                  <option value="bank">حساب بنكي / تحويل</option>
                  <option value="cheque">شيك مالي مقبول التداول</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-[10px] text-[#86868b] font-bold">من تاريخ:</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-xl p-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="text-[10px] text-[#86868b] font-bold">إلى تاريخ:</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full bg-black border border-[#333336] rounded-xl p-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>

            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#333336]/40 text-xs">
              <span className="text-[#86868b]">
                عدد المصروفات المحددة حالياً: <b className="text-white font-mono">{filteredExpenses.length}</b> معاملة | إجمالي التكلفة: <b className="text-[#30d158] font-mono">{totalFilteredAmount.toLocaleString('ar-SA')} ج.م</b>
              </span>

              <button
                type="button"
                onClick={() => setPrintFilterView(true)}
                className="text-[#2997ff] hover:text-[#0071e3] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>عرض معاينة تقرير الطباعة للقيود كشف حساب الفلتر</span>
              </button>
            </div>
          </div>

          {/* Table list main */}
          <div className="bg-[#161617] border border-[#333336] rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-[#333336]/65 flex justify-between items-center text-xs">
              <h3 className="font-bold text-white flex items-center gap-1.5">
                <Clipboard className="w-4 h-4 text-amber-500" />
                دفتر حجة ومسند الصرف اليومي للشركة
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[#333336] text-[#86868b] pb-2 font-bold bg-black/25">
                    <th className="py-3 px-4">مستند / تاريخ</th>
                    <th className="py-3">التصنيف والفرع</th>
                    <th className="py-3">وصف وبيان المصروف</th>
                    <th className="py-3">الجهة المستفيدة</th>
                    <th className="py-3 text-center">الوسيلة</th>
                    <th className="py-3 text-center">المبلغ الكلي</th>
                    <th className="py-3 text-left pl-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333336]/40">
                  {filteredExpenses.map((exp) => (
                    <tr id={`exp-tr-${exp.id}`} key={exp.id} className="hover:bg-black/20 group">
                      
                      {/* Date & receipt id */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white font-mono">{exp.date}</div>
                        <div className="text-[10px] text-[#86868b] font-mono pt-0.5 truncate max-w-[90px]" title={exp.receiptNumber}>
                          {exp.receiptNumber ? `إيصال: ${exp.receiptNumber}` : `معرف: ${exp.id.slice(4,10)}`}
                        </div>
                      </td>

                      {/* category & sub */}
                      <td className="py-3">
                        <div className="font-semibold text-zinc-200">{getCategoryNameAr(exp.category)}</div>
                        <div className="text-[10px] text-[#86868b] pt-0.5">{exp.subCategory || 'بدون تفصيل'}</div>
                      </td>

                      {/* Description & proof image widget */}
                      <td className="py-3 max-w-xs">
                        <div className="flex items-center gap-2">
                          {exp.attachment && (
                            <div className="w-7 h-7 rounded border border-[#333336] shrink-0 overflow-hidden bg-black flex items-center justify-center">
                              <img src={exp.attachment} alt="proof thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div>
                            <div className="text-zinc-300 font-medium line-clamp-1" title={exp.description}>{exp.description || 'قيود مصروف الساحة'}</div>
                            <div className="text-[9px] text-[#86868b] pt-0.5 truncate max-w-[180px]" title={exp.notes}>{exp.notes || 'لا يوجد ملاحظات'}</div>
                          </div>
                        </div>
                      </td>

                      {/* supplier target */}
                      <td className="py-3 text-zinc-400 font-medium font-semibold">
                        {exp.supplierName || '— ساحة الهضبة'}
                      </td>

                      {/* Method flag */}
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          exp.paymentMethod === 'cash' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          exp.paymentMethod === 'bank' ? 'bg-[#2997ff]/10 border-[#2997ff]/20 text-[#2997ff]' :
                          'bg-purple-500/10 border-purple-500/20 text-purple-400'
                        }`}>
                          {getPaymentMethodNameAr(exp.paymentMethod)}
                        </span>
                      </td>

                      {/* Amount column */}
                      <td className="py-3 text-center text-[#ff9f0a] font-mono font-bold text-sm">
                        {exp.amount.toLocaleString('ar-SA')} ج.م
                      </td>

                      {/* Edit or Delete Action triggers */}
                      <td className="py-3 text-left pl-4">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          
                          <button
                            onClick={() => setEditingExpense(exp)}
                            className="p-1 px-2 border border-[#333336] hover:bg-[#2c2c2e] hover:border-zinc-500 text-zinc-300 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="تعديل هذا القيد"
                          >
                            <Edit3 className="w-3 h-3 text-yellow-500" />
                            <span>تعديل</span>
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('هل أنت واثق وموافق على إعدام وحذف مستند هذا المصروف بشكل نهائي من ميزان ساحة الهضبة؟')) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="p-1 px-2 border border-rose-500/20 hover:bg-rose-500/15 text-rose-500 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                            title="حذف هذا المصروف بالكامل"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف</span>
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#86868b] text-xs">
                        لا يوجد أي مصرفات مطابقة ومقيدة بهذا الإطار المختار للفلاتر.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-black/40 border-t border-[#333336]/60 text-[#86868b] text-[10px] flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>المشرف المسؤول عن موازنة ومطابقة حجة القيود هو: <b>{user?.name} ({user?.role})</b>. المصروفات تؤثر مباشرة في الميزانية الصافية والأرباح.</span>
            </div>
          </div>

        </div>
      )}

      {/* MODAL EDITING EXPENSE POPUP */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-[#161617] border border-[#424245] w-full max-w-lg rounded-3xl p-6 space-y-6 animate-scaleUp">
            <div className="border-b border-[#333336]/60 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-yellow-500" />
                <span>تعديل المصروف: {editingExpense.receiptNumber || editingExpense.id.slice(4,10)}</span>
              </h3>
              <button 
                onClick={() => setEditingExpense(null)}
                className="text-[#86868b] hover:text-white cursor-pointer font-bold text-sm"
              >
                إغلاق ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] text-[#86868b] font-bold">المبلغ المالي الكلي (ج.م):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black border border-[#333336] rounded-xl px-3 py-2 text-xs text-[#2997ff] font-bold font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#86868b] font-bold">تاريخ الحركة الحسابية:</label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full bg-black border border-[#333336] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] text-[#86868b] font-bold">وصف وتفصيل التكلفة المباشر:</label>
                  <input
                    type="text"
                    required
                    value={editingExpense.description || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                    className="w-full bg-black border border-[#333336] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#86868b] font-bold">رقم المستند / السند:</label>
                  <input
                    type="text"
                    value={editingExpense.receiptNumber || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, receiptNumber: e.target.value })}
                    className="w-full bg-black border border-[#333336] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#86868b] font-bold">اسم المستفيد / المورد:</label>
                  <input
                    type="text"
                    value={editingExpense.supplierName || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, supplierName: e.target.value })}
                    className="w-full bg-black border border-[#333336] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] text-[#86868b] font-bold">ملاحظات لساحة فرز وتأمين الهضبة:</label>
                  <input
                    type="text"
                    value={editingExpense.notes || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                    className="w-full bg-black border border-[#333336] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#333336]/40">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="bg-black hover:bg-[#1d1d1f] text-[#86868b] border border-[#333336] font-medium py-2 px-5 rounded-full text-xs cursor-pointer transition-colors"
                >
                  تراجع وإلغاء
                </button>
                <button
                  type="submit"
                  className="bg-[#0071e3] hover:bg-[#147ce5] text-white font-medium py-2 px-6 rounded-full text-xs cursor-pointer transition-colors font-bold"
                >
                  تأكيد تعديل القيود
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: REPORTS AND ANALYTICS ON EXPENSES */}
      {activeTab === 'reports' && (
        <div className="space-y-6 print:hidden animate-fadeIn">
          
          {/* MoM Performance Dashboard Widget and Period KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* KPI 1: total period amount */}
            <div className="bg-[#161617] border border-[#333336] p-5 rounded-3xl relative overflow-hidden">
              <div className="absolute top-4 left-4 p-2 bg-black border border-[#333336] rounded-full text-amber-500">
                <Coins className="w-4 h-4" />
              </div>
              <p className="text-[#86868b] text-[10px] font-bold">إجمالي مصروفات الفترة المحددة</p>
              <h3 className="text-2xl font-bold text-white mt-4 font-mono">
                {totalPeriodAmount.toLocaleString('ar-SA')}
                <span className="text-xs text-[#86868b] pr-1">ج.م</span>
              </h3>
              <p className="text-[#86868b] text-[10px] mt-1.5 leading-none">
                تشمل {statsExpenses.length} حركة صرف مسجلة بالدفتر
              </p>
            </div>

            {/* KPI 2: Average size */}
            <div className="bg-[#161617] border border-[#333336] p-5 rounded-3xl relative overflow-hidden">
              <div className="absolute top-4 left-4 p-2 bg-black border border-[#333336] rounded-full text-[#2997ff]">
                <HelpCircle className="w-4 h-4" />
              </div>
              <p className="text-[#86868b] text-[10px] font-bold">متوسط قيمة المصروف المتكرر</p>
              <h3 className="text-2xl font-bold text-white mt-4 font-mono">
                {Math.round(avgExpenseAmount).toLocaleString('ar-SA')}
                <span className="text-xs text-[#86868b] pr-1">ج.م</span>
              </h3>
              <p className="text-[#86868b] text-[10px] mt-1.5 leading-none">
                متوسط التكلفة لكل معاملة قيود
              </p>
            </div>

            {/* KPI 3: Max expense */}
            <div className="bg-[#161617] border border-[#333336] p-5 rounded-3xl relative overflow-hidden">
              <div className="absolute top-4 left-4 p-2 bg-black border border-[#333336] rounded-full text-rose-500">
                <Check className="w-4 h-4" />
              </div>
              <p className="text-[#86868b] text-[10px] font-bold">أكبر مصروف تم تسجيله بالفترة</p>
              <h3 className="text-2xl font-bold text-white mt-4 font-mono">
                {maxExpenseAmount.toLocaleString('ar-SA')}
                <span className="text-xs text-[#86868b] pr-1">ج.م</span>
              </h3>
              <p className="text-[#86868b] text-[10px] mt-1.5 leading-none">
                يتطلب جودة مراجعة وموافقة الإدارة
              </p>
            </div>

            {/* KPI 4: MoM Growth Comparing */}
            <div className="bg-[#161617] border border-[#333336] p-5 rounded-3xl relative overflow-hidden">
              <div className={`absolute top-4 left-4 p-2 bg-black border border-[#333336] rounded-full ${momDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {momDiff <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              </div>
              <p className="text-[#86868b] text-[10px] font-bold">معدل التغير عن الشهر السابق (MoM)</p>
              <h3 className={`text-2xl font-bold mt-4 font-mono ${momDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {momPercentage === 0 ? '0' : (momDiff > 0 ? '+' : '') + Math.round(momPercentage).toString()}%
              </h3>
              <p className="text-[#86868b] text-[10px] mt-1.5 leading-none">
                {momDiff <= 0 ? 'انخفاض رائع وموفر للتكاليف' : `زيادة بـ ${Math.abs(Math.round(momDiff)).toLocaleString('ar-SA')} ج.م`}
              </p>
            </div>

          </div>

          {/* Breakdown Categories visual bar and Specialized logistics section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Visual breakdown progress list (7 Cols) */}
            <div className="col-span-1 lg:col-span-7 bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6">
              <div className="border-b border-[#333336]/60 pb-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#bf5af2]" />
                  توزع وهيكلية المصروفات التشغيلية حسب التصنيف الفني
                </h4>
              </div>

              <div className="space-y-4">
                {categoryBreakdown.map((cat, i) => (
                  <div key={cat.categoryKey} className="space-y-1.5 bg-black p-4 rounded-2xl border border-[#333336] hover:border-zinc-500 transition-colors">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-500 font-mono bg-[#161617] px-2 py-0.5 rounded">فئة {i + 1}</span>
                        {cat.nameAr}
                      </span>
                      <span className="font-mono text-zinc-300 font-bold">
                        {cat.total.toLocaleString('ar-SA')} ج.م <span className="text-[10px] text-[#86868b] font-medium font-sans block text-left pt-0.5">{cat.percentage.toFixed(1)}%</span>
                      </span>
                    </div>

                    {/* Progress Bar of category percentage */}
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          cat.categoryKey === 'Transportation' ? 'bg-[#ff9f0a]' :
                          cat.categoryKey === 'Labor' ? 'bg-indigo-500' :
                          cat.categoryKey === 'Rent' ? 'bg-[#30d158]' :
                          cat.categoryKey === 'Utilities' ? 'bg-cyan-400' :
                          cat.categoryKey === 'Commissions' ? 'bg-purple-400' :
                          cat.categoryKey === 'Maintenance' ? 'bg-[#ff453a]' :
                          cat.categoryKey === 'Taxes' ? 'bg-yellow-400' : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.max(1, cat.percentage)}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-[#86868b] flex justify-between">
                      <span>إجمالي المعاملات: {cat.count} صنف صرف مالي</span>
                      <span>سلسلة التكلفة الموزعة</span>
                    </div>
                  </div>
                ))}

                {statsExpenses.length === 0 && (
                  <div className="py-24 text-center text-[#86868b] text-xs">
                    سجل المصروفات لهذه الفترة فارغ حالياً.
                  </div>
                )}
              </div>
            </div>

            {/* Specialized Logistics and Transportation Cost panel (5 Cols) */}
            <div className="col-span-1 lg:col-span-5 flex flex-col justify-between">
              <div className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6 h-full flex flex-col justify-between">
                
                <div className="space-y-4">
                  <div className="border-b border-[#333336]/65 pb-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <PieChart className="w-4 h-4 text-[#30d158]" />
                      التحليل اللوجستي لمصروفات الشحن والنقل
                    </h4>
                    <p className="text-[#86868b] text-[10px] mt-0.5">بسبب جوهرية النقل والعتالة والشحن لقطاع خردة الحديد بمصر.</p>
                  </div>

                  <div className="bg-black p-5 rounded-2xl border border-orange-500/10 flex flex-col items-center justify-center space-y-1 relative overflow-hidden">
                    <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                      إجمالي تكاليف الشحن واللوجستيات
                    </span>
                    <h2 className="text-2xl font-black text-white font-mono tracking-tight">
                      {totalTransportAmount.toLocaleString('ar-SA')}
                      <span className="text-xs font-medium text-[#86868b] pr-1">جنيه</span>
                    </h2>
                    <span className="text-[10px] text-[#86868b] pt-1 leading-none text-center block">
                      تمثل <b className="text-white">{(totalPeriodAmount > 0 ? (totalTransportAmount / totalPeriodAmount) * 100 : 0).toFixed(1)}%</b> من مجمل نفقات الفترة بالكامل
                    </span>
                  </div>

                  {/* detailed transportation items */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] text-zinc-400 font-bold">بند التحليل التفصيلي لحركات النقل المقيدة:</h5>
                    
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-xs">
                      {transportExpenses.map((e) => (
                        <div key={e.id} className="bg-black p-2.5 rounded-xl border border-[#333336] flex items-center justify-between hover:border-zinc-600">
                          <div>
                            <div className="font-semibold text-white text-[11px]">{e.subCategory}</div>
                            <div className="text-[10px] text-[#86868b] pt-0.5 max-w-[150px] truncate">{e.supplierName || 'جهة النقل ومحطات الخدمة'}</div>
                          </div>
                          <div className="text-left font-mono">
                            <span className="font-bold text-orange-400 text-[11px]">{e.amount.toLocaleString('ar-SA')} ج.م</span>
                            <div className="text-[9px] text-[#86868b]">{e.date}</div>
                          </div>
                        </div>
                      ))}

                      {transportExpenses.length === 0 && (
                        <div className="py-6 text-center text-[#86868b] border border-dashed border-[#333336] rounded-xl text-[10px]">
                          لا توجد أي تكاليف نقل مفصلة تحت فحص هذه الفترة.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-[#86868b] pt-4 border-t border-[#333336]/60 mt-4 leading-normal">
                  💡 إرشاد الحسابات: يوصى بألا يتجاوز حد شحن الخردة والنقل نسبة 20% - 25% من تكلفة الصفقة الكلية للحفاظ على الجدوى التشغيلية لشركة الهضبة.
                </div>

              </div>
            </div>

          </div>

          {/* Top 5 expenses list */}
          <div className="bg-[#161617] border border-[#333336] p-5 rounded-3xl space-y-4">
            <h4 className="text-xs font-bold text-white">أكبر 5 صفقات مصروفات تشغيلية بالفترة المقررة ومجالات صرفها:</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
              {topExpenses.map((e, index) => (
                <div key={e.id} className="bg-black p-4 rounded-2xl border border-[#333336] flex flex-col justify-between hover:border-zinc-500 transition-colors text-xs relative">
                  <span className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full bg-zinc-900 border border-[#333336] text-[9px] font-bold text-[#86868b] flex items-center justify-center font-mono">
                    #{index + 1}
                  </span>
                  <div>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase">{getCategoryNameAr(e.category)}</span>
                    <h4 className="font-bold text-white mt-1 pt-0.5 truncate">{e.subCategory}</h4>
                    <p className="text-[#86868b] text-[10px] line-clamp-2 h-7.5 leading-normal pt-1.5">{e.description || 'حساب المصروف للساحة'}</p>
                  </div>
                  <div className="border-t border-[#333336]/65 mt-3 pt-2 flex justify-between items-center">
                    <span className="text-[#86868b] text-[9px] font-mono">{e.date}</span>
                    <span className="text-[#ff9f0a] font-mono font-bold">{e.amount.toLocaleString('ar-SA')} ج.م</span>
                  </div>
                </div>
              ))}

              {topExpenses.length === 0 && (
                <div className="col-span-5 py-6 text-center text-[#86868b]">سجل أكبر المصروفات فارغ لهذه الفترة.</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* DETAILED PRINTABLE VIEW SHEET (Optimized for A4 Print paper layout) */}
      {printFilterView && (
        <div id="printable-expense-report" className="bg-white text-zinc-950 font-sans p-8 space-y-6 max-w-4xl mx-auto border-4 border-double border-zinc-900 rounded-lg print:block" dir="rtl">
          
          <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4">
            <div className="text-right space-y-1">
              <h2 className="text-xl font-black tracking-wider text-black">شركة الهضبة لتجارة الخردة والمعادن</h2>
              <p className="text-[10px] text-zinc-500">مستودعات وساحة ميزان البسكول - نظام إدارة ومراقبة المصروفات</p>
              <p className="text-[10px] text-zinc-500">التدقيق المالي - القاهرة، السبتية ، هاتف: 01012345678</p>
            </div>
            
            <div className="text-left text-right">
              <div className="border border-zinc-900 px-3 py-1 font-mono font-bold text-sm bg-zinc-50 rounded font-bold">كشف حساب المصروفات التشغيلية</div>
              <p className="text-[9px] text-zinc-500 pt-1 font-mono">طبع في: {new Date().toLocaleDateString('ar-SA')} | التوقيت: {new Date().toLocaleTimeString('ar-SA')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs border-b border-zinc-200 pb-4">
            <div className="space-y-1">
              <div>كشف تصفية الفترة من: <b className="font-mono">{filterStartDate || 'أقدم قيد'}</b> إلى: <b className="font-mono">{filterEndDate || 'أحدث قيد'}</b></div>
              <div>الفئة المستهدفة بالكشف: <b>{filterCategory === 'all' ? 'جميع التصنيفات والمجالات للإنفاق' : getCategoryNameAr(filterCategory)}</b></div>
              <div>خزينة الدفع أو الوسيلة: <b>{filterPaymentMethod === 'all' ? 'جميع الخزائن البنكية والنقدية' : getPaymentMethodNameAr(filterPaymentMethod)}</b></div>
            </div>
            <div className="space-y-1 text-left">
              <div>المراجع والمشرف: <b className="text-zinc-900">{user?.name} ({user?.role})</b></div>
              <div className="text-xs bg-zinc-100 p-2 border-r-4 border-zinc-900 inline-block font-mono font-bold text-right">
                إجمالي المصروفات المخفضة بالكشف المفلتر:<br />
                <span className="text-base font-black text-black">{totalFilteredAmount.toLocaleString('ar-SA')} جنيه مصري</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-900">سجل وحجة قيود المصروفات التفصيلي:</h3>
            <table className="w-full text-right text-[11px] border-collapse">
              <thead>
                <tr className="border-b-2 border-t border-zinc-900 bg-zinc-50 font-bold">
                  <th className="py-2 pr-2">تاريخ القيد</th>
                  <th className="py-2">تصنيف المصروف</th>
                  <th className="py-2">الخدمة والفرع والتفصيل</th>
                  <th className="py-2">المستفيد / المورد</th>
                  <th className="py-2 text-center">الإيصال</th>
                  <th className="py-2 text-center">الوسيلة</th>
                  <th className="py-2 text-left pl-2">المبلغ (جنيه)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="py-2 pr-2 font-mono">{exp.date}</td>
                    <td className="py-2 font-bold">{getCategoryNameAr(exp.category)}</td>
                    <td className="py-2">
                      <div className="font-semibold">{exp.subCategory}</div>
                      <div className="text-[9px] text-zinc-500">{exp.description || 'لا يوجد وصف مضاف'}</div>
                    </td>
                    <td className="py-2 text-zinc-800 font-medium">{exp.supplierName || 'ساحة الهضبة'}</td>
                    <td className="py-2 text-center font-mono">{exp.receiptNumber || '—'}</td>
                    <td className="py-2 text-center font-bold">{getPaymentMethodNameAr(exp.paymentMethod)}</td>
                    <td className="py-2 text-left pl-2 font-mono font-bold">{exp.amount.toLocaleString('ar-SA')} ج.م</td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-zinc-500">لا توجد مصروفات مسجلة تحت مظلة الفلاتر المحددة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Printable calculation disclaimer */}
          <div className="pt-6 border-t border-zinc-300 grid grid-cols-2 gap-4 text-center text-[10px] text-zinc-500">
            <div className="space-y-6">
              <div>أمين الخزينة ومعد القيود</div>
              <div className="border-b border-zinc-400 w-32 mx-auto pt-4" />
              <div>توقيع قسم الحسابات والتسوية</div>
            </div>
            <div className="space-y-6">
              <div>الاعتماد النهائي والمصادقة الإدارية</div>
              <div className="border-b border-zinc-400 w-32 mx-auto pt-4" />
              <div>المدير العام لشركة الهضبة</div>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-4 text-center text-[9px] text-zinc-500 font-mono">
            شركة الهضبة لتجارة خردة الحديد والمعادن بمصر | مستند كشف المصروفات التشغيلية ينشأ تلقائياً وتاريخه ملزم محاسبياً وجنائياً للساحة.
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
              onClick={() => setPrintFilterView(false)}
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
