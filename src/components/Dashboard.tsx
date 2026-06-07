/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, TrendingDown, Scale, DollarSign, ArrowUpRight, 
  ArrowDownLeft, Users, Package, Award, Calendar, RefreshCw, Wallet,
  Sparkles, Upload, FileText, Check, AlertCircle, Edit3, X, Plus, Trash2, ShoppingCart
} from 'lucide-react';
import {
  unifiedDocumentAnalysis,
  getClientApiKey,
  setClientApiKey,
  isStaticClientOnly
} from '../lib/documentAnalyzer';

export default function Dashboard() {
  const { 
    purchaseInvoices, saleInvoices, suppliers, customers, items, expenses,
    getProfitAndLoss, getStockStatus, getWeightMovements, getLatestPrice,
    addPurchaseInvoice, addSaleInvoice, addExpense, clearAllData
  } = useApp();

  const [dateRange, setDateRange] = useState<'all' | 'today' | 'month'>('all');
  const [tickerIndex, setTickerIndex] = useState(0);

  // Client-side API Key setup UI state
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(getClientApiKey());
  const [staticDeployment] = useState(isStaticClientOnly());

  // AI OCR Scanner States
  const [attachment, setAttachment] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string>('');
  const [aiSuccess, setAiSuccess] = useState<string>('');
  const [showDashboardClearConfirm, setShowDashboardClearConfirm] = useState<boolean>(false);

  // Editable Form states
  const [editPartyId, setEditPartyId] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editPaymentType, setEditPaymentType] = useState<'cash' | 'credit'>('credit');
  const [editPaidAmount, setEditPaidAmount] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editDetails, setEditDetails] = useState<Array<{ itemId: string; itemName: string; weightKg: number; pricePerTon: number }>>([]);

  const [editExpenseAmount, setEditExpenseAmount] = useState<number>(0);
  const [editExpenseCategory, setEditExpenseCategory] = useState<string>('Other');
  const [editExpenseSubCategory, setEditExpenseSubCategory] = useState<string>('');
  const [editExpenseDescription, setEditExpenseDescription] = useState<string>('');
  const [editExpensePaymentMethod, setEditExpensePaymentMethod] = useState<'cash' | 'bank' | 'cheque'>('cash');
  const [editExpenseReceiptNumber, setEditExpenseReceiptNumber] = useState<string>('');
  const [editExpenseSupplierName, setEditExpenseSupplierName] = useState<string>('');

  const CATEGORY_NAMES: Record<string, string> = {
    Transportation: 'نقل وشحن وتفريغ',
    Labor: 'أجور ورواتب عمالة',
    Rent: 'إيجار الساحة والمقرات',
    Utilities: 'مرافق وسياديات (كهرباء/مياه)',
    Commissions: 'عمولات وساطة وشراء',
    Maintenance: 'عمالة وصيانة معدات وبسكول',
    Taxes: 'رسوم وضرائب حكومية',
    Other: 'مصروفات ساحة أخرى متنوعة'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment(reader.result as string);
      setAnalysisResult(null);
      setAiError('');
      setAiSuccess('');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeDocument = async () => {
    if (!attachment) return;
    setIsAnalyzing(true);
    setAiError('');
    setAiSuccess('');
    
    try {
      const res = await unifiedDocumentAnalysis(attachment, 'invoice.png', false);
      setAnalysisResult(res);

      // Pre-fill editable states
      if (res.transactionType === 'purchase' || res.transactionType === 'sale') {
        const isPurchase = res.transactionType === 'purchase';
        const partyName = res.invoice?.partyName || '';
        let matchedId = '';
        if (isPurchase) {
          const found = suppliers.find(s => s.name.includes(partyName) || partyName.includes(s.name));
          matchedId = found ? found.id : (suppliers[0]?.id || '');
        } else {
          const found = customers.find(c => c.name.includes(partyName) || partyName.includes(c.name));
          matchedId = found ? found.id : (customers[0]?.id || '');
        }
        setEditPartyId(matchedId);
        setEditDate(res.invoice?.date || new Date().toISOString().split('T')[0]);
        setEditPaymentType(res.invoice?.paymentType === 'cash' ? 'cash' : 'credit');
        setEditPaidAmount(res.invoice?.paidAmount || 0);
        setEditNotes(res.invoice?.notes || 'مستخرج آلياً بذكاء جميني');
        setEditDetails(res.invoice?.details || []);
      } else if (res.transactionType === 'expense') {
        setEditExpenseAmount(res.expense?.amount || 0);
        setEditExpenseCategory(res.expense?.categoryKey || 'Other');
        setEditExpenseSubCategory(res.expense?.subCategory || 'مصروف عام');
        setEditExpenseDescription(res.expense?.description || '');
        setEditExpensePaymentMethod(res.expense?.paymentMethod === 'bank' ? 'bank' : res.expense?.paymentMethod === 'cheque' ? 'cheque' : 'cash');
        setEditExpenseReceiptNumber(res.expense?.receiptNumber || '');
        setEditExpenseSupplierName(res.expense?.supplierName || '');
        setEditNotes(res.expense?.notes || 'مصروف جاري مستخرج من المستند المالي');
        setEditDate(res.expense?.date || new Date().toISOString().split('T')[0]);
      }
      
      if (res.isMockDemo) {
        setAiSuccess('✨ وضع المحاكاة الذكي لـ GitHub Pages: تم قراءة وتعبئة الفاتوة بنجاح! لشحن مسح حقيقي بكاميرا هاتفك يمكنك حفظ مفتاح Gemini بالأسفل.');
      } else {
        setAiSuccess('✨ تم فحص وتصنيف المستند الذكي بنجاح! راجع البيانات أدناه قبل الاعتماد.');
      }
      setTimeout(() => setAiSuccess(''), 7000);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'عذراً، فشل فحص وتصنيف البيانات عن بعد.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmAndSaveInvoice = () => {
    try {
      if (!analysisResult) return;
      
      const type = analysisResult.transactionType;
      if (type === 'purchase') {
        if (!editPartyId) throw new Error('الرجاء اختيار المورد المعتمد أولاً');
        if (editDetails.length === 0) throw new Error('الرجاء تعيين صنف واحد على الأقل بالفاتورة');

        addPurchaseInvoice(
          editPartyId,
          editPaymentType,
          editPaidAmount,
          editDetails.map(d => ({ itemId: d.itemId, weightKg: d.weightKg, pricePerTon: d.pricePerTon })),
          editNotes,
          editDate
        );
        setAiSuccess('✨ تم بنجاح قيد فاتورة لشراء خردة وتذكرة الوارد بالكامل بالدفتر والسجلات!');
      } else if (type === 'sale') {
        if (!editPartyId) throw new Error('الرجاء اختيار العميل المعتمد أولاً');
        if (editDetails.length === 0) throw new Error('الرجاء تعيين صنف واحد على الأقل بالفاتورة');

        addSaleInvoice(
          editPartyId,
          editPaymentType,
          editPaidAmount,
          editDetails.map(d => ({ itemId: d.itemId, weightKg: d.weightKg, pricePerTon: d.pricePerTon })),
          editNotes,
          editDate
        );
        setAiSuccess('✨ تم بنجاح قيد فاتورة مبيعات صادر الساحة وتعديل مستويات الأوزان والميزان!');
      } else if (type === 'expense') {
        if (!editExpenseAmount || editExpenseAmount <= 0) throw new Error('يرجى تحديد إجمالي المبلغ');
        if (!editExpenseSubCategory) throw new Error('يرجى كتابة أو تحديد بيان المصروف');

        addExpense({
          amount: editExpenseAmount,
          category: editExpenseCategory,
          subCategory: editExpenseSubCategory,
          description: editExpenseDescription,
          date: editDate || new Date().toISOString().split('T')[0],
          paymentMethod: editExpensePaymentMethod,
          receiptNumber: editExpenseReceiptNumber,
          supplierName: editExpenseSupplierName,
          notes: editNotes,
          attachment: attachment || undefined
        });
        setAiSuccess('✨ تم قيد وتسجيل المصروف والنفقة التشغيلية بالكامل للساحة!');
      }

      // Reset
      setAttachment('');
      setAnalysisResult(null);
      setTimeout(() => setAiSuccess(''), 7000);
    } catch (err: any) {
      setAiError(err.message || 'فشلت عملية حفظ وضبط المعاملة.');
      setTimeout(() => setAiError(''), 5000);
    }
  };

  const handleDetailChange = (index: number, field: string, value: any) => {
    setEditDetails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeDetailRow = (index: number) => {
    setEditDetails(prev => prev.filter((_, i) => i !== index));
  };

  const addDetailRow = () => {
    setEditDetails(prev => [...prev, { itemId: items[0]?.id || '', itemName: '', weightKg: 1000, pricePerTon: 2000 }]);
  };

  // Derive date bounds
  const todayStr = new Date().toISOString().split('T')[0];
  const startOfMonthStr = `${todayStr.slice(0, 8)}01`;

  const getBounds = () => {
    if (dateRange === 'today') return { start: todayStr, end: todayStr };
    if (dateRange === 'month') return { start: startOfMonthStr, end: todayStr };
    return { start: undefined, end: undefined };
  };

  const bounds = getBounds();
  const pl = getProfitAndLoss(bounds.start, bounds.end);
  const stock = getStockStatus();
  const weightMovements = getWeightMovements();

  // Basic totals
  const totalStockKg = stock.reduce((sum, s) => sum + s.totalWeightKg, 0);
  const totalStockTons = totalStockKg / 1000;

  // Under-the-hood expense math computations for the Dashboard widget
  const todayExpenses = expenses.filter(e => e.date === todayStr);
  const dailyExpensesSum = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const currentMonthNum = parseInt(todayStr.split('-')[1], 10);
  const currentYearNum = parseInt(todayStr.split('-')[0], 10);
  const currentMonthExpenses = expenses.filter(e => {
    const y = parseInt(e.date.split('-')[0], 10);
    const m = parseInt(e.date.split('-')[1], 10);
    return y === currentYearNum && m === currentMonthNum;
  });
  const monthlyExpensesSum = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const prevMonthNum = currentMonthNum === 1 ? 12 : currentMonthNum - 1;
  const prevYearNum = currentMonthNum === 1 ? currentYearNum - 1 : currentYearNum;
  const prevMonthExpenses = expenses.filter(e => {
    const y = parseInt(e.date.split('-')[0], 10);
    const m = parseInt(e.date.split('-')[1], 10);
    return y === prevYearNum && m === prevMonthNum;
  });
  const prevMonthSum = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const momDiff = monthlyExpensesSum - prevMonthSum;
  const momPercentage = prevMonthSum > 0 ? (momDiff / prevMonthSum) * 100 : 0;

  const latestExpenses = [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

  
  // Recent transactions
  const combinedRecent = [
    ...purchaseInvoices.map(inv => ({ 
      id: inv.id, 
      type: 'purchase' as const, 
      invNum: inv.invoiceNumber,
      date: inv.date, 
      party: suppliers.find(s => s.id === inv.supplierId)?.name || 'مورد تلقائي', 
      amount: inv.totalAmount, 
      weight: inv.totalWeightKg 
    })),
    ...saleInvoices.map(inv => ({ 
      id: inv.id, 
      type: 'sale' as const, 
      invNum: inv.invoiceNumber,
      date: inv.date, 
      party: customers.find(c => c.id === inv.customerId)?.name || 'عميل تلقائي', 
      amount: inv.totalAmount, 
      weight: inv.totalWeightKg 
    }))
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Helper function to format weights neatly
  const formatWeight = (kg: number) => {
    if (kg >= 1000) {
      const tons = kg / 1000;
      return `${tons.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} طن`;
    }
    return `${kg.toLocaleString('ar-SA')} كجم`;
  };

  return (
    <div id="dashboard-root" className="space-y-6 text-[#f5f5f7] font-sans" dir="rtl">
      
      {/* Apple-style Header Card with sleek minimal layout */}
      <div id="dashboard-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161617] p-6 rounded-3xl border border-[#333336] relative overflow-hidden">
        <div className="space-y-1">
          <h1 id="welcome-title" className="text-xl font-semibold text-white tracking-tight">الرصد الإحصائي واللوحة التحليلية</h1>
          <p id="welcome-sub" className="text-[#86868b] text-[11px] font-mono">اليوم: {todayStr} | مؤشرات بورصة المعادن والخردة بمصر متصلة وآمنة</p>
        </div>
        
        {/* Date Filter Pills - Apple design */}
        <div id="date-filters" className="flex items-center gap-1 bg-black p-1 rounded-full border border-[#333336]">
          <button
            id="filter-all"
            onClick={() => setDateRange('all')}
            className={`px-4.5 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
              dateRange === 'all' 
                ? 'bg-[#0071e3] text-white shadow-md' 
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            كل الأوقات
          </button>
          <button
            id="filter-month"
            onClick={() => setDateRange('month')}
            className={`px-4.5 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
              dateRange === 'month' 
                ? 'bg-[#0071e3] text-white shadow-md' 
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            هذا الشهر
          </button>
          <button
            id="filter-today"
            onClick={() => setDateRange('today')}
            className={`px-4.5 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
              dateRange === 'today' 
                ? 'bg-[#0071e3] text-white shadow-md' 
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            اليوم
          </button>
        </div>
      </div>

      {/* Dynamic Mock Data Alert Banner */}
      {purchaseInvoices.some(inv => inv.id === 'pinv-1') && (
        <div className="bg-[#1c1c1e] border border-rose-950/50 p-4.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <h4 className="text-xs font-bold text-[#ff9f0a] flex items-center gap-2">
              💡 هل تريد تشغيل النظام على أرصدتكم الحقيقية؟
            </h4>
            <p className="text-[11px] text-[#86868b] leading-relaxed">
              تستعرض اللوحة حالياً أرصدة تجريبية وعقد عينات وهمية لتسهيل الاستيعاب. يمكنك تصفير كافة هذه القيود الآن للبدء ببيانات مستودعك الرسمية بمصر بضغطة زر واحدة!
            </p>
          </div>
          
          {!showDashboardClearConfirm ? (
            <button
              onClick={() => setShowDashboardClearConfirm(true)}
              className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/20 rounded-xl text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
            >
              تصفير وحذف البيانات التجريبية 🗑️
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-black/60 p-2.5 rounded-xl border border-rose-500/30">
              <span className="text-[10px] text-rose-300 font-bold">⚠️ تأكيد تصفير الدفاتر؟</span>
              <button
                onClick={() => {
                  clearAllData();
                  setShowDashboardClearConfirm(false);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg cursor-pointer"
              >
                نعم، تصفير
              </button>
              <button
                onClick={() => setShowDashboardClearConfirm(false)}
                className="bg-[#2c2c2e] text-white text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* AI SMART INVOICE SCANNER & CLASSIFIER (Arabic Language)  */}
      {/* ======================================================== */}
      <div id="ai-invoice-scanner-widget" className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-650/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-950/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header Title with Sparkling micro-animation */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-[#333336]/60">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              مركز الفرز السريع والتدقيق المالي الذكي للفواتير
              <span className="text-[9px] font-mono tracking-wider font-extrabold text-[#2997ff] bg-[#1d1d1f] px-2 py-0.5 rounded-full border border-indigo-950">BETA</span>
            </h2>
            <p className="text-xs text-[#86868b] leading-relaxed">
              ارفع أو اسحب فواتير النفقات التشغيلية، تذاكر البسكول، أو فواتير الشراء والبيع والوزن؛ وسيتولى الذكاء الاصطناعي تصنيفها بدقة وعرضها لتدققها وتعتمدها فوراً بالدفاتر!
            </p>
          </div>
          <span className="text-[10px] text-indigo-400 font-mono select-none bg-indigo-950/35 border border-indigo-900/60 px-3 py-1 rounded-full shrink-0">
            محرك الإدراك المالي بجميني 3.5
          </span>
        </div>

        {/* GitHub Pages Direct Key Configurator */}
        <div className="p-4 bg-indigo-950/10 rounded-2xl border border-indigo-900/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${tempApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-bold text-slate-100">بوابة التشغيل السحابي والمسح (GitHub Pages)</span>
            </div>
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-xs text-[#2997ff] hover:underline cursor-pointer"
            >
              {showKeyConfig ? 'إخفاء الإعدادات ×' : 'إعدادات مفتاح جميني الخاص بك ⚙️'}
            </button>
          </div>
          
          {(showKeyConfig || !tempApiKey) && (
            <div className="space-y-3 pt-2 text-xs border-t border-indigo-900/20 animate-fade-in text-right">
              <p className="text-[#86868b] leading-relaxed">
                هذا النظام مصمم بشكل متطور ليعمل كلياً بدون خوادم على GitHub Pages أو خوادمك الخاصة. 
                بشكل تلقائي، إذا لم تقم بإدخال مفتاح سحابي، سيقوم النظام بتمرير <b>"المحاكاة الذكية الملتزمة"</b> للملفات لتجربة حقول الساحة والأوزان. لتفعيل مسح حقيقي مباشر من الكاميرا أو الصور لكافة فواتيرك، تولّد بمفتاح مجاني من موقع <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[#2997ff] hover:underline">Google AI Studio</a> وألصقه بالأسفل:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  placeholder="أدخل مفتاح Gemini API Key هنا (يبدأ بـ AIzaSy...)"
                  value={tempApiKey || ''}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="flex-1 bg-black border border-[#333336] px-3.5 py-2 rounded-xl text-white text-xs outline-none focus:border-indigo-500 font-mono text-left"
                  dir="ltr"
                />
                <button
                  onClick={() => {
                    setClientApiKey(tempApiKey);
                    alert("تم حفظ مفتاح Gemini API بنجاح في متصفحك! ميزات الذكاء الاصطناعي الحقيقية مفعلة الآن كلياً على GitHub Pages.");
                    setShowKeyConfig(false);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  حفظ في المتصفح 💾
                </button>
                {tempApiKey && (
                  <button
                    onClick={() => {
                      setTempApiKey('');
                      setClientApiKey('');
                      alert("تم حذف المفتاح بنجاح. سيتراجع النظام للوضع المحاكي الفوري.");
                      setShowKeyConfig(false);
                    }}
                    className="bg-rose-950/40 border border-[#3c1e21] text-rose-300 hover:bg-rose-950/65 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shrink-0"
                  >
                    حذف المفتاح ×
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications and Feedback Alerts */}
        {aiError && (
          <div className="p-4 bg-rose-950/40 border border-rose-900/50 text-rose-300 rounded-2xl flex items-start gap-2.5 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">تنبيه المعالجة المحاسبية:</p>
              <p className="opacity-90">{aiError}</p>
            </div>
          </div>
        )}

        {aiSuccess && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 rounded-2xl flex items-start gap-2.5 text-xs animate-fade-in">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">المحاسب الذكي:</p>
              <p className="opacity-90">{aiSuccess}</p>
            </div>
          </div>
        )}

        {/* Binary Layout: Left is Import, Right is AI Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Upload Zone & Document Thumbnail Preview (4 Columns) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-black/40 p-4 rounded-2xl border border-[#333336] flex flex-col items-center justify-between min-h-[190px]">
              <div className="w-full text-center space-y-3 py-4 flex flex-col items-center justify-center border border-dashed border-[#333336] rounded-xl hover:border-indigo-500/50 transition-colors relative cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="p-3 bg-[#1d1d1f] border border-[#333336] rounded-full text-indigo-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">انقر لاختيار أو إسقاط مستند الفاتورة</p>
                  <p className="text-[10px] text-[#86868b] mt-1">يدعم الصور (JPEG، PNG) أو ملفات PDF</p>
                </div>
              </div>

              {attachment && (
                <div className="w-full mt-4 p-3 bg-indigo-950/15 border border-indigo-950 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-[#86868b] truncate max-w-[150px]">مستند_الفاتورة.png</span>
                  </div>
                  <button 
                    onClick={() => { setAttachment(''); setAnalysisResult(null); }}
                    className="text-[#86868b] hover:text-rose-400 p-1 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {attachment && !isAnalyzing && !analysisResult && (
              <button
                onClick={handleAnalyzeDocument}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg hover:shadow-indigo-650/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                حلل المستند وصنف معاملة الفاتورة بالذكاء الاصطناعي
              </button>
            )}
          </div>

          {/* AI Extract & Review Sandbox terminal (8 Columns) */}
          <div className="lg:col-span-8 bg-black/30 rounded-2xl border border-[#333336] p-5 flex flex-col justify-center relative min-h-[190px]">
            
            {/* Case A: Idle / Empty Slate state */}
            {!attachment && !isAnalyzing && !analysisResult && (
              <div className="text-center py-8 space-y-2 selection:bg-indigo-900">
                <p className="text-xs text-[#86868b]">لوحة المراجعة والتدقيق المحاسبي فارغة بانتظار ملف الفاتورة.</p>
                <span className="inline-block text-[11px] text-indigo-400/80 bg-indigo-950/20 px-3 py-1 rounded-full border border-indigo-950/50">
                  💡 تلميحة: اسحب تذكرة ميزان أو فاتورة مشتريات/مصروفات لتجربة الفرز الفوري!
                </span>
              </div>
            )}

            {/* Case B: Holographic Running Scan Wave Animation */}
            {isAnalyzing && (
              <div className="py-12 flex flex-col items-center justify-center space-y-5">
                <div className="relative w-48 h-32 border border-[#333336] rounded-2xl bg-zinc-950 shrink-0 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-x-0 h-0.5 bg-indigo-500 opacity-80 animate-bounce top-0" style={{ animationDuration: '3.5s' }} />
                  <div className="text-center p-3 select-none">
                    <FileText className="w-8 h-8 text-indigo-400/50 mx-auto mb-2 animate-pulse" />
                    <span className="text-[10px] text-indigo-400 font-bold block animate-pulse">جاري تدقيق جميني...</span>
                  </div>
                </div>
                <div className="text-center space-y-1.5 max-w-sm">
                  <p className="text-xs font-semibold text-white">يجري مراجعة الحسابات ومطابقتها...</p>
                  <p className="text-[10px] text-[#86868b] leading-relaxed">
                    يتعرف جميني حالياً على الأعداد والتواريخ، الأوزان، الأسعار، وأسماء الموردين، ثم يفاضل بين كونه (شراء سكراب / مبيعات مسبك / مصروف نقل وتشغيل).
                  </p>
                </div>
              </div>
            )}

            {/* Case C: Live OCR review and edit sandbox! */}
            {analysisResult && (
              <div className="space-y-5 animate-fade-in">
                
                {/* Result banner & classification reasoning */}
                <div className="bg-[#161617] border border-[#333336] p-4 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#333336]/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#86868b]">التصنيف الذكي للمستند:</span>
                      {analysisResult.transactionType === 'purchase' && (
                        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black">
                          📥 توريد خردة واردة (فاتورة شراء)
                        </span>
                      )}
                      {analysisResult.transactionType === 'sale' && (
                        <span className="bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#2997ff] px-3 py-1 rounded-full text-[10px] font-black">
                          📤 تسليم مصنع صادر (فاتورة بيع)
                        </span>
                      )}
                      {analysisResult.transactionType === 'expense' && (
                        <span className="bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 text-[#ff9f0a] px-3 py-1 rounded-full text-[10px] font-black">
                          💼 مصروف تشغيلي وخدمي
                        </span>
                      )}
                    </div>
                    <span className="text-[9.5px] text-[#86868b] font-mono select-none">دقة تحليل عالية وموثوقة</span>
                  </div>

                  <p className="text-xs text-zinc-300 italic leading-relaxed text-right pr-2 border-r-2 border-indigo-500/50 font-mono">
                    {analysisResult.confidenceReasoning || 'تمت مطابقة أسعار ومجموع الفاتورة المرفوعة مع المعايير.'}
                  </p>
                </div>

                {/* Sub-form: Purchase or Sale Invoice details */}
                {(analysisResult.transactionType === 'purchase' || analysisResult.transactionType === 'sale') && (
                  <div className="space-y-4">
                    
                    {/* Invoice Meta header */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#161617]/40 p-3 rounded-xl border border-[#333336]/50">
                      
                      {/* Party details select */}
                      <div className="sm:col-span-2 space-y-1 text-right">
                        <label className="text-[10px] text-[#86868b] font-bold block">
                          {analysisResult.transactionType === 'purchase' ? 'المورد المسجل والمطابق:' : 'العميل المسجل والمطابق:'}
                        </label>
                        <select
                          value={editPartyId}
                          onChange={(e) => setEditPartyId(e.target.value)}
                          className="w-full bg-black text-white text-xs border border-[#333336] rounded-lg px-2.5 py-1.5 focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="">-- اختر الشريك التجاري --</option>
                          {analysisResult.transactionType === 'purchase' ? (
                            suppliers.map(s => <option key={s.id} value={s.id}>{s.name} (رصيد: {Math.round(s.currentBalance).toLocaleString('ar-SA')} ج.م)</option>)
                          ) : (
                            customers.map(c => <option key={c.id} value={c.id}>{c.name} (رصيد: {Math.round(c.currentBalance).toLocaleString('ar-SA')} ج.م)</option>)
                          )}
                        </select>
                      </div>

                      {/* Invoice Date */}
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-[#86868b] font-bold block">التاريخ المعترف به:</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-black text-white text-xs border border-[#333336] rounded-lg px-2.5 py-1 focus:border-indigo-500"
                        />
                      </div>

                      {/* Payment Type */}
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-[#86868b] font-bold block">طريقة سداد المعاملة:</label>
                        <select
                          value={editPaymentType}
                          onChange={(e) => setEditPaymentType(e.target.value as 'cash' | 'credit')}
                          className="w-full bg-black text-white text-xs border border-[#333336] rounded-lg px-1.5 py-1.5 focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="credit">آجل (على ذمة الحساب المفتوح)</option>
                          <option value="cash">نقداً كاش (صرف/تسوية فورية)</option>
                        </select>
                      </div>

                    </div>

                    {/* Paid amount if credit and custom paid */}
                    {editPaymentType === 'credit' && (
                      <div className="flex items-center gap-3 bg-[#1d1d1f] border border-[#333336] p-3 rounded-xl">
                        <div className="text-right space-y-1 shrink-0">
                          <label className="text-[10px] text-[#86868b] font-bold block">مبلغ مدفوع مقدم كاش من الفاتورة:</label>
                          <input
                            type="number"
                            value={editPaidAmount}
                            onChange={(e) => setEditPaidAmount(parseFloat(e.target.value) || 0)}
                            className="w-32 bg-black text-white font-mono text-xs border border-[#333336] rounded-lg px-2 py-1 focus:border-indigo-500 text-left"
                          />
                        </div>
                        <p className="text-[10px] text-[#86868b] leading-relaxed self-end pb-1 pr-2">
                          * يتم قيد رصيد الفاتورة المتبقي في ذمة حساب الشريك آلياً.
                        </p>
                      </div>
                    )}

                    {/* Details Table */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-black/60 px-3 py-1.5 rounded-lg border border-[#333336]">
                        <span className="text-[10px] font-bold text-[#86868b]">أصناف الخردة المدرجة بالفاتورة المستخرجة</span>
                        <button
                          onClick={addDetailRow}
                          className="px-2 py-1 rounded bg-indigo-650 hover:bg-indigo-650/80 text-[10px] text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" /> إضافة صنف آخر
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {editDetails.map((det, index) => {
                          const rowTotal = (det.weightKg / 1000) * det.pricePerTon;
                          return (
                            <div key={index} className="grid grid-cols-12 gap-2 bg-[#161617]/60 p-2.5 rounded-xl border border-[#333336]/60 text-xs items-center">
                              
                              {/* Sub-item Select */}
                              <div className="col-span-5 text-right space-y-0.5">
                                <span className="text-[9px] text-[#86868b] block scale-90 origin-right">الصنف بالساحة:</span>
                                <select
                                  value={det.itemId}
                                  onChange={(e) => handleDetailChange(index, 'itemId', e.target.value)}
                                  className="w-full bg-black text-white text-[11px] border border-[#333336] rounded px-1.5 py-1 focus:border-indigo-500 cursor-pointer"
                                >
                                  {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                                </select>
                              </div>

                              {/* Weight (Kg) */}
                              <div className="col-span-3 text-right space-y-0.5 font-mono">
                                <span className="text-[9px] text-[#86868b] block scale-90 origin-right">الوزن (كجم):</span>
                                <input
                                  type="number"
                                  value={det.weightKg}
                                  onChange={(e) => handleDetailChange(index, 'weightKg', parseInt(e.target.value) || 0)}
                                  className="w-full bg-black text-white font-mono text-[11px] border border-[#333336] rounded px-1.5 py-0.5 text-center"
                                />
                                <span className="text-[8px] text-[#86868b] block pt-0.5">({(det.weightKg / 1000).toFixed(2)} طن)</span>
                              </div>

                              {/* Price per Ton */}
                              <div className="col-span-3 text-right space-y-0.5 font-mono">
                                <span className="text-[9px] text-[#86868b] block scale-90 origin-right">سعر الطن (ج.م):</span>
                                <input
                                  type="number"
                                  value={det.pricePerTon}
                                  onChange={(e) => handleDetailChange(index, 'pricePerTon', parseInt(e.target.value) || 0)}
                                  className="w-full bg-black text-white font-mono text-[11px] border border-[#333336] rounded px-1.5 py-0.5 text-center"
                                />
                              </div>

                              {/* Delete Action button */}
                              <div className="col-span-1 text-center pt-3.5">
                                <button
                                  onClick={() => removeDetailRow(index)}
                                  disabled={editDetails.length === 1}
                                  className="p-1 rounded text-zinc-500 hover:text-rose-450 hover:bg-black/30 transition-colors disabled:opacity-30 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                      {/* Cumulative sums bar */}
                      <div className="bg-[#161617] p-3 rounded-xl border border-[#333336] flex justify-between items-center text-xs font-mono">
                        <span className="text-zinc-400">إجمالي الأوزان المستهدفة: <b className="text-white text-sm">{(editDetails.reduce((sum, d) => sum + d.weightKg, 0) / 1000).toFixed(2)} طن</b></span>
                        <span className="text-[#2997ff]">الإجمالي النهائي للفاتورة: <b className="text-white text-base font-extrabold">
                          {Math.round(editDetails.reduce((sum, d) => sum + (d.weightKg / 1000) * d.pricePerTon, 0)).toLocaleString('ar-SA')} جنيه
                        </b></span>
                      </div>

                    </div>

                  </div>
                )}

                {/* Sub-form: Expense details */}
                {analysisResult.transactionType === 'expense' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#161617]/40 p-3 rounded-xl border border-[#333336]/50">
                      
                      {/* Amount */}
                      <div className="space-y-1 text-right font-mono">
                        <label className="text-[10px] text-[#86868b] font-bold block">إجمالي مبلغ المصروف:</label>
                        <input
                          type="number"
                          value={editExpenseAmount}
                          onChange={(e) => setEditExpenseAmount(parseFloat(e.target.value) || 0)}
                          className="w-full bg-black text-white font-mono text-xs border border-[#333336] rounded-lg px-2.5 py-1 focus:border-indigo-500"
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-[#86868b] font-bold block">التصنيف المحاسبي الرئيسي:</label>
                        <select
                          value={editExpenseCategory}
                          onChange={(e) => setEditExpenseCategory(e.target.value)}
                          className="w-full bg-black text-white text-xs border border-[#333336] rounded-lg px-2 py-1.5 focus:border-indigo-500 cursor-pointer"
                        >
                          {Object.entries(CATEGORY_NAMES).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>

                      {/* Sub Category */}
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-[#86868b] font-bold block">البيان والتصنيف الفرعي:</label>
                        <input
                          type="text"
                          value={editExpenseSubCategory}
                          onChange={(e) => setEditExpenseSubCategory(e.target.value)}
                          placeholder="مثال: نولون شحن سيارات خردة"
                          className="w-full bg-black text-white text-xs border border-[#333336] rounded-lg px-2.5 py-1 focus:border-indigo-500 font-semibold"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#161617]/40 p-3 rounded-xl border border-[#333336]/50">
                      {/* Date */}
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-[#86868b] font-bold block">تاريخ المصروف:</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-black text-white text-xs border border-[#333336] rounded-lg px-2.5 py-1 focus:border-indigo-500"
                        />
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-[#86868b] font-bold block">طريقة السداد وصرف النقدية:</label>
                        <select
                          value={editExpensePaymentMethod}
                          onChange={(e) => setEditExpensePaymentMethod(e.target.value as any)}
                          className="w-full bg-black text-white text-xs border border-[#333336] rounded-lg px-2 py-1.5 focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="cash">نقداً من خزينة المستودع</option>
                          <option value="bank">تحويل بنكي / فودافون كاش</option>
                          <option value="cheque">شيك مالي مقبول الدفع</option>
                        </select>
                      </div>

                      {/* Beneficiary Supplier */}
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-[#86868b] font-bold block">المستفيد / المستلم:</label>
                        <input
                          type="text"
                          value={editExpenseSupplierName}
                          onChange={(e) => setEditExpenseSupplierName(e.target.value)}
                          placeholder="مثال: ورثة العشري للنقل"
                          className="w-full bg-black text-white text-xs border border-[#333336] rounded-lg px-2.5 py-1 focus:border-indigo-500"
                        />
                      </div>

                      {/* Number */}
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-[#86868b] font-bold block">رقم الدفتر أو الإيصال بحد أقصى:</label>
                        <input
                          type="text"
                          value={editExpenseReceiptNumber}
                          onChange={(e) => setEditExpenseReceiptNumber(e.target.value)}
                          placeholder="رقم الإيصال"
                          className="w-full bg-black text-white text-xs border border-[#333336] rounded-lg px-2.5 py-1 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <label className="text-[10px] text-[#86868b] block">شرح وتفاصيل إضافية للمصروف:</label>
                      <input
                        type="text"
                        value={editExpenseDescription}
                        onChange={(e) => setEditExpenseDescription(e.target.value)}
                        placeholder="اكتب أية تفاصيل تفصيلية للنقدية..."
                        className="w-full bg-black text-white text-xs border border-[#333336] rounded-lg px-2.5 py-1 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* Notes general input */}
                <div className="space-y-1 text-right">
                  <label className="text-[10px] text-[#86868b] block">ملاحظات وقيود عامة للمعاملة بالدفتر:</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="ملاحظات محاسبية إضافية..."
                    className="w-full bg-black text-zinc-300 text-xs border border-[#333336] rounded-lg px-3 py-1 focus:border-indigo-500"
                  />
                </div>

                {/* Command actions CTA */}
                <div className="flex justify-end gap-3.5 pt-2 border-t border-[#333336]/65">
                  <button
                    onClick={() => { setAttachment(''); setAnalysisResult(null); }}
                    className="px-4 py-2 text-xs font-semibold text-[#86868b] hover:text-white rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    تجاهل وإلغاء 🗑️
                  </button>
                  <button
                    onClick={confirmAndSaveInvoice}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-lg hover:shadow-indigo-650/15 flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    اعتماد وتسجيل فوراً بالدفاتر المحاسبية والمخازن 📝
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* Main Apple KPI Grid */}
      <div id="kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Remaining Stock */}
        <div id="kpi-stock" className="bg-[#161617] border border-[#333336] p-6 rounded-3xl relative overflow-hidden group hover:border-[#424245] transition-all">
          <div className="absolute top-4 left-4 p-2 bg-[#1d1d1f] border border-[#333336] rounded-full text-[#2997ff]">
            <Scale className="w-4 h-4" />
          </div>
          <p className="text-[#86868b] text-[11px] font-bold">وزن المخزون الحالي الإجمالي</p>
          <h3 className="text-2xl font-semibold text-white mt-4 font-mono">{totalStockTons.toFixed(2)} <span className="text-xs text-[#86868b]">طن</span></h3>
          <p className="text-[#86868b] text-[10px] mt-1.5 font-mono">
            تعادل <span className="text-[#2997ff] font-medium">{(totalStockKg).toLocaleString('ar-SA')}</span> كجم بالساحة
          </p>
        </div>

        {/* KPI 2: Total Purchases */}
        <div id="kpi-purchases" className="bg-[#161617] border border-[#333336] p-6 rounded-3xl relative overflow-hidden group hover:border-[#424245] transition-all">
          <div className="absolute top-4 left-4 p-2 bg-[#1d1d1f] border border-[#333336] rounded-full text-white">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <p className="text-[#86868b] text-[11px] font-bold">إجمالي مشتريات الساحة (الوارد)</p>
          <h3 className="text-2xl font-semibold text-white mt-4 font-mono">{pl.purchasesAmount.toLocaleString('ar-SA')} <span className="text-xs text-[#86868b]">جنيه</span></h3>
          <p className="text-[#86868b] text-[10px] mt-1.5 leading-none">
            إجمالي مطالبات الموردين المعتمدة
          </p>
        </div>

        {/* KPI 3: Total Sales */}
        <div id="kpi-sales" className="bg-[#161617] border border-[#333336] p-6 rounded-3xl relative overflow-hidden group hover:border-[#424245] transition-all">
          <div className="absolute top-4 left-4 p-2 bg-[#1d1d1f] border border-[#333336] rounded-full text-[#2997ff]">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-[#86868b] text-[11px] font-bold">إجمالي مبيعات الساحة (الصادر)</p>
          <h3 className="text-2xl font-semibold text-white mt-4 font-mono">{pl.salesAmount.toLocaleString('ar-SA')} <span className="text-xs text-[#86868b]">جنيه</span></h3>
          <p className="text-[#86868b] text-[10px] mt-1.5 leading-none">
            طاقة التسليم للمصانع والعملاء بمصر
          </p>
        </div>

        {/* KPI 4: Net Profit */}
        <div id="kpi-profits" className="bg-[#161617] border border-[#333336] p-6 rounded-3xl relative overflow-hidden group hover:border-[#0071e3]/30 transition-all">
          <div className={`absolute top-4 left-4 p-2 bg-[#1d1d1f] border border-[#333336] rounded-full ${pl.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {pl.netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
          <p className="text-[#86868b] text-[11px] font-bold">صافي الأرباح التشغيلية للمستودع</p>
          <h3 className={`text-2xl font-semibold mt-4 font-mono ${pl.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {Math.round(pl.netProfit).toLocaleString('ar-SA')} 
            <span className="text-xs text-[#86868b] pr-1">جنيه</span>
          </h3>
          <p className="text-[#86868b] text-[10px] mt-1.5 leading-relaxed">
            الربح المباشر: {Math.round(pl.directProfit).toLocaleString('ar-SA')} ج.م
            <span className="block text-[9px] pt-0.5">خصم مصاريف تشغيلية: <span className="text-orange-400">-{Math.round(pl.expensesAmount).toLocaleString('ar-SA')} ج.م</span></span>
          </p>
        </div>
      </div>

      {/* Daily Price Ticker Board & Stock Chart */}
      <div id="analysis-row" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Custom Visual Stock Table & Graphic Bars (8 Cols) */}
        <div id="stock-visualizer-card" className="col-span-1 lg:col-span-8 bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 id="card3-heading" className="text-sm font-semibold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-[#2997ff]" />
              مستويات المخزون والوزن القابل للتدوير بساحة البسكول
            </h3>
            <span className="text-[#86868b] text-[10px] font-mono select-none">متوسط التكلفة المرجحة (WA)</span>
          </div>

          <div id="stock-bars-container" className="space-y-3.5">
            {stock.map(st => {
              const item = items.find(i => i.id === st.itemId);
              if (!item) return null;
              
              const maxCapacity = 20000; 
              const percentage = Math.min(100, Math.round((st.totalWeightKg / maxCapacity) * 100));
              
              return (
                <div id={`stock-row-${st.itemId}`} key={st.itemId} className="space-y-2 bg-black p-4 rounded-2xl border border-[#333336] transition-colors">
                  <div className="flex justify-between items-center text-xs text-white">
                    <span className="font-semibold flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        st.itemType === 'iron' ? 'bg-[#ff453a]' :
                        st.itemType === 'copper' ? 'bg-orange-400' :
                        st.itemType === 'aluminum' ? 'bg-[#8e8e93]' : 'bg-[#0071e3]'
                      }`} />
                      {st.itemName}
                    </span>
                    <span className="font-mono text-[#86868b]">
                      {st.totalWeightKg === 0 ? 'مفرغ' : formatWeight(st.totalWeightKg)}
                    </span>
                  </div>

                  {/* Progressive Bar */}
                  <div className="w-full h-2 bg-[#1c1c1e] rounded-full overflow-hidden relative border border-[#2c2c2e]">
                    <div 
                      id={`bar-fill-${st.itemId}`}
                      className={`h-full rounded-full transition-all duration-1000 ${
                        st.itemType === 'iron' ? 'bg-[#ff453a]' :
                        st.itemType === 'copper' ? 'bg-orange-500' :
                        st.itemType === 'aluminum' ? 'bg-[#8e8e93]' :
                        'bg-[#0071e3]'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Meta stats */}
                  <div className="flex justify-between items-center text-[10px] text-[#86868b] font-mono">
                    <span>م. تكلفة الشراء للطن: <b className="text-white">{Math.round(st.avgPurchasePricePerTon).toLocaleString('ar-SA')} جنيه</b></span>
                    <span>القيمة الدفترية الكلية: <b className="text-[#2997ff]">{Math.round(st.totalValue).toLocaleString('ar-SA')} جنيه</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Daily Sourcing Stock Prices Panel (4 Cols) */}
        <div id="live-prices-card" className="col-span-1 lg:col-span-4 bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#2997ff]" />
                مؤشر التسعير والبورصة لليوم
              </h3>
              <span className="text-[10px] text-[#86868b] font-mono bg-black border border-[#333336] px-2 py-0.5 rounded-full select-none">مُحدث</span>
            </div>
            
            <p className="text-[#86868b] text-[11px] leading-relaxed">
              أسعار حركة التسليم الحالية بالطن لشركتنا. معتمدة وتخضع للتحديث المتوافق مع حركة سكراب المعادن محلياً.
            </p>

            <div className="space-y-2.5">
              {items.slice(0, 4).map(item => {
                const prices = getLatestPrice(item.id, todayStr);
                return (
                  <div id={`pricing-ticker-${item.id}`} key={item.id} className="bg-black p-3.5 rounded-2xl border border-[#333336] flex items-center justify-between gap-1">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-white">{item.name.split(' (')[0]}</div>
                      <div className="text-[9px] text-[#86868b] font-mono leading-none pt-1">لوحدة الوزن: {item.baseUnit === 'ton' ? 'طن' : 'كجم'}</div>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <div className="text-right">
                        <span className="text-[9px] text-[#86868b] block scale-90 origin-right">شراء/طن</span>
                        <span className="text-[#2997ff] font-bold">{prices?.buy?.toLocaleString('ar-SA') || '—'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-[#86868b] block scale-90 origin-right">بيع/طن</span>
                        <span className="text-emerald-450 font-bold">{prices?.sell?.toLocaleString('ar-SA') || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#333336] mt-4 text-[#86868b] text-[10px] leading-relaxed flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#86868b]" />
            <span>الهامش العادل والتقديري للمخزون: <b>12% - 15%</b></span>
          </div>
        </div>
      </div>

      {/* Expenses Dashboard Widget */}
      <div id="expenses-dashboard-widget" className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#333336]/60 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-500" />
              مراقبة النفقات والمصروفات التشغيلية
            </h3>
            <p className="text-[10px] text-[#86868b] mt-0.5">مؤشرات عينية لمصروفات الشحن والعمالة لتفادي هبوط هامش الربح التشغيلي.</p>
          </div>
          <span className="text-[10px] text-[#86868b] font-mono select-none">نظام الحوكمة الرقمي</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left panel: Quick expense metrics (5 columns) */}
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            
            {/* Daily expenses */}
            <div className="bg-black p-4 rounded-2xl border border-[#333336] flex flex-col justify-between">
              <span className="text-[#86868b] text-[10px] font-bold block">إجمالي مصروفات اليوم</span>
              <h4 className="text-lg font-bold text-white mt-1 font-mono">
                {dailyExpensesSum.toLocaleString('ar-SA')}
                <span className="text-[10px] text-[#86868b] font-sans pr-0.5">ج.م</span>
              </h4>
              <span className="text-[9px] text-zinc-500 block pt-1.5 leading-none">محدث لحظياً</span>
            </div>

            {/* Monthly expenses */}
            <div className="bg-black p-4 rounded-2xl border border-[#333336] flex flex-col justify-between">
              <span className="text-[#86868b] text-[10px] font-bold block">مصروفات هذا الشهر</span>
              <h4 className="text-lg font-bold text-white mt-1 font-mono">
                {monthlyExpensesSum.toLocaleString('ar-SA')}
                <span className="text-[10px] text-[#86868b] font-sans pr-0.5">ج.م</span>
              </h4>
              <span className="text-[9px] text-[#86868b] block pt-1.5 leading-none">شامل النقل والعمالة</span>
            </div>

            {/* MoM trend */}
            <div className="col-span-2 bg-black p-4 rounded-2xl border border-[#333336] flex items-center justify-between">
              <div>
                <span className="text-[#86868b] text-[10px] font-bold block">مقارنة التغير بالشهر الماضي</span>
                <span className="text-[9px] text-zinc-500 pt-0.5 block">معدل النمو الشهري للنفقات التشغيلية</span>
              </div>
              <div className="text-left font-mono">
                <span className={`text-sm font-black flex items-center gap-1 leading-none ${momDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {momDiff <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  {momPercentage === 0 ? '0' : (momDiff > 0 ? '+' : '') + Math.round(momPercentage).toString()}%
                </span>
                <span className="text-[9px] text-[#86868b] pt-1 block">
                  {momDiff <= 0 ? 'توفير تكاليف' : `زيادة بـ ${Math.abs(Math.round(momDiff)).toLocaleString('ar-SA')} ج.م`}
                </span>
              </div>
            </div>

          </div>

          {/* Right panel: Last 3 recorded expenses (7 columns) */}
          <div className="md:col-span-7 bg-black p-4 rounded-2xl border border-[#333336] space-y-3 flex flex-col justify-between">
            <h4 className="text-[10px] text-zinc-400 font-bold block">آخر 3 مصروفات تشغيلية مقيدة بالدفتر:</h4>
            
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {latestExpenses.map((exp) => (
                <div key={exp.id} className="bg-[#161617] p-2.5 rounded-xl border border-[#333336] flex items-center justify-between text-xs hover:border-zinc-600 transition-colors">
                  <div className="flex items-center gap-2">
                    {exp.attachment && (
                      <div className="w-6 h-6 rounded border border-[#333336] shrink-0 overflow-hidden bg-black flex items-center justify-center">
                        <img src={exp.attachment} alt="attachment thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-white text-[11px] leading-tight">{exp.subCategory}</div>
                      <div className="text-[9px] text-[#86868b] line-clamp-1 truncate max-w-[170px] pt-0.5 leading-none">{exp.description || 'مصروف ساحة'}</div>
                    </div>
                  </div>
                  
                  <div className="text-left font-mono">
                    <span className="font-bold text-[#ff9f0a] text-[11px]">{exp.amount.toLocaleString('ar-SA')} ج.م</span>
                    <div className="text-[9px] text-[#86868b] pt-0.5">{exp.date}</div>
                  </div>
                </div>
              ))}

              {latestExpenses.length === 0 && (
                <div className="py-6 text-center text-[#86868b] text-[10px] border border-dashed border-[#333336] rounded-xl flex-1 flex items-center justify-center">
                  دفتر المصروفات فارغ تماماً حالياً.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recents Rows: Invoices list & Movements */}
      <div id="recents-row" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Recent Invoices - Beautiful Apple Table Style */}
        <div id="recent-invoices-card" className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#2997ff]" />
            آخر المعاملات المالية المعتمدة
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#333336] text-[#86868b]">
                  <th className="py-2 font-semibold">رقم المستند</th>
                  <th className="py-2 font-semibold">الجهة / الشريك</th>
                  <th className="py-2 font-semibold text-center">الوزن الكلي</th>
                  <th className="py-2 font-semibold text-left">القيمة المالية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333336]/40">
                {combinedRecent.map(inv => (
                  <tr id={`rec-inv-${inv.id}`} key={inv.id} className="hover:bg-black/25">
                    <td className="py-3 font-mono font-semibold flex items-center gap-2 text-zinc-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${inv.type === 'purchase' ? 'bg-orange-500' : 'bg-[#0071e3]'}`} />
                      {inv.invNum}
                    </td>
                    <td className="py-3 text-zinc-400 max-w-[120px] truncate">{inv.party}</td>
                    <td className="py-3 text-center text-zinc-300 font-mono">{(inv.weight / 1000).toFixed(2)} طن</td>
                    <td className="py-3 text-left font-mono font-semibold text-white">{Math.round(inv.amount).toLocaleString('ar-SA')} جنيه</td>
                  </tr>
                ))}
                {combinedRecent.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#86868b]">لم تُسجل أي فواتير حالياً بقاعدة البيانات</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weight Movements Ledger */}
        <div id="weight-movements-card" className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#2997ff]" />
            سجل الميزان البسكول لحركة دخول وخروج الأوزان
          </h3>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {weightMovements.slice(0, 5).map(mov => {
              const item = items.find(i => i.id === mov.itemId);
              return (
                <div id={`mov-row-${mov.id}`} key={mov.id} className="bg-black p-3 rounded-2xl border border-[#333336] flex items-center justify-between text-xs hover:border-[#424245] transition-colors">
                  <div className="flex items-start gap-2 max-w-[70%]">
                    <div className={`p-1.5 rounded-full border mt-0.5 shrink-0 ${
                      mov.type === 'in' 
                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                        : 'bg-[#0071e3]/10 border-[#0071e3]/20 text-[#2997ff]'
                    }`}>
                      <Scale className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-200">{item?.name.split(' (')[0] || 'صنف غير معروف'}</div>
                      <div className="text-[10px] text-[#86868b] pt-0.5 line-clamp-1 leading-normal">{mov.description}</div>
                    </div>
                  </div>
                  
                  <div className="text-left font-mono">
                    <span className={`font-semibold ${mov.type === 'in' ? 'text-orange-400' : 'text-[#2997ff]'}`}>
                      {mov.type === 'in' ? '+' : '-'} {formatWeight(mov.weightKg)}
                    </span>
                    <div className="text-[9px] text-[#86868b] pt-0.5">{mov.date}</div>
                  </div>
                </div>
              );
            })}
            {weightMovements.length === 0 && (
              <div className="py-6 text-center text-[#86868b]">سجل الأوزان فارغ حالياً</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
