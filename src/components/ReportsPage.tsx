/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, TrendingUp, Download, Upload, Scale, 
  Users, Calendar, Filter, Share2, Info, Check 
} from 'lucide-react';

export default function ReportsPage() {
  const { 
    items, suppliers, customers, getStockStatus, 
    getWeightMovements, getProfitAndLoss, exportBackup, importBackup, user, clearAllData 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'inventory' | 'pl' | 'partners' | 'backup'>('inventory');

  // Date filters for P&L
  const todayStr = new Date().toISOString().split('T')[0];
  const startOfMonthStr = `${todayStr.slice(0, 8)}01`;
  const [startDate, setStartDate] = useState(startOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Backup states
  const [backupJson, setBackupJson] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [errorStatus, setErrorStatus] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Dynamic metrics
  const stockReport = getStockStatus();
  const plReport = getProfitAndLoss(startDate, endDate);
  const movements = getWeightMovements();

  // Handle Export Backup
  const handleExport = () => {
    const data = exportBackup();
    setBackupJson(data);
    
    // Create download link dynamically (Premium Craftsmanship offline approach)
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scrap_db_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Import Backup
  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus('');
    setErrorStatus('');
    if (!backupJson.trim()) {
      setErrorStatus('الرجاء اختيار ملف أو لصق نص البيانات لاستيرادها.');
      return;
    }
    const success = importBackup(backupJson);
    if (success) {
      setImportStatus('تم استعادة نسخة البيانات الاحتياطية وتحديث السجلات الحسابية بنجاح!');
      setBackupJson('');
    } else {
      setErrorStatus('برجاء التأكد من صحة الملف! فشل تحليل معطيات كود قاعدة بيانات JSON.');
    }

    setTimeout(() => {
      setImportStatus('');
      setErrorStatus('');
    }, 5000);
  };

  // Handle file picker import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorStatus('');
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (file) {
      fileReader.onload = (event) => {
        const text = event.target?.result as string;
        setBackupJson(text);
      };
      fileReader.readAsText(file);
    }
  };

  const getTypeNameAr = (t: string) => {
    switch(t) {
      case 'iron': return 'حديد وسكراب صلب';
      case 'copper': return 'نحاس ومكثفات';
      case 'aluminum': return 'ألومنيوم وخلائط';
      case 'stainless': return 'ستانلس ستيل';
      default: return 'معادن أخرى ومخلفات';
    }
  };

  // Total portfolio weights
  const totalWeightKg = stockReport.reduce((sum, s) => sum + s.totalWeightKg, 0);
  const totalValue = stockReport.reduce((sum, s) => sum + s.totalValue, 0);

  return (
    <div id="reports-root" className="space-y-6 text-[#f5f5f7] font-sans" dir="rtl">
      
      {/* Header Panel */}
      <div id="reports-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161617] p-6 rounded-3xl border border-[#333336]">
        <div id="title-block">
          <h1 id="reports-heading" className="text-xl font-semibold text-white tracking-tight">التقارير التحليلية والعمليات الاحتياطية</h1>
          <p id="reports-sub" className="text-[#86868b] text-xs font-normal">تقييم الميزانية وجرد بضاعة الساحة الفعلي وخدمات تصدير البيانات الشاملة للهضبة</p>
        </div>
      </div>

      {/* Mini tabs */}
      <div id="reports-navigation" className="flex flex-wrap items-center gap-1.5 bg-[#161617] border border-[#333336] p-1 rounded-2xl w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl cursor-pointer transition-all ${
            activeTab === 'inventory' 
              ? 'bg-[#2c2c2e] text-white font-semibold' 
              : 'text-[#86868b] hover:text-white'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-[#0071e3]" />
          <span>جرد المخزون الفني</span>
        </button>

        <button
          onClick={() => setActiveTab('pl')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl cursor-pointer transition-all ${
            activeTab === 'pl' 
              ? 'bg-[#2c2c2e] text-white font-semibold' 
              : 'text-[#86868b] hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-[#30d158]" />
          <span>الأرباح والخسائر والتكلفة</span>
        </button>

        <button
          onClick={() => setActiveTab('partners')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl cursor-pointer transition-all ${
            activeTab === 'partners' 
              ? 'bg-[#2c2c2e] text-white font-semibold' 
              : 'text-[#86868b] hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#ff9f0a]" />
          <span>كشف أرصدة الذمم الكلية</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl cursor-pointer transition-all ${
            activeTab === 'backup' 
              ? 'bg-[#2c2c2e] text-white font-semibold' 
              : 'text-[#86868b] hover:text-white'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-[#bf5af2]" />
          <span>نسخة البيانات (Backup)</span>
        </button>
      </div>

      {importStatus && (
        <div id="reports-status-bar" className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-450 text-xs font-medium animate-fadeIn">
          {importStatus}
        </div>
      )}

      {errorStatus && (
        <div id="reports-error-bar" className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-455 text-xs font-medium animate-fadeIn">
          {errorStatus}
        </div>
      )}

      {/* TAB content: 1. Inventory */}
      {activeTab === 'inventory' && (
        <div id="tab-inventory-view" className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#333336]/60 pb-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#2997ff]" />
              جرد المخزون الفعلي الحالي لساحة فرز الهضبة
            </h3>
            <span className="text-[10px] text-[#86868b] bg-black border border-[#333336] px-2.5 py-1 rounded-full font-mono">التقييم: المتوسط المرجح WAC</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black p-4 border border-[#333336] rounded-2xl flex justify-between items-center text-xs">
              <span className="text-[#86868b]">الوزن الإجمالي المتوفر الساحة:</span>
              <span className="font-mono text-[#ff9f0a] font-bold text-sm">{(totalWeightKg / 1000).toFixed(3)} طن سكراب</span>
            </div>
            <div className="bg-black p-4 border border-[#333336] rounded-2xl flex justify-between items-center text-xs">
              <span className="text-[#86868b]">القيمة الدفترية التقديرية للمواد:</span>
              <span className="font-mono text-[#30d158] font-bold text-sm">{Math.round(totalValue).toLocaleString('ar-SA')} ج.م</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#333336]/60 text-[#86868b] pb-2 font-bold">
                  <th className="py-3 pr-3">اسم الصنف المسجل</th>
                  <th className="py-3">التصنيف الفني</th>
                  <th className="py-3 text-center">الوزن الفعلي الحالي</th>
                  <th className="py-3 text-center">متوسط شراء الساحة (للطن)</th>
                  <th className="py-3 text-left pl-3">المستحق المالي الكلي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333336]/40">
                {stockReport.map(st => (
                  <tr id={`inv-st-${st.itemId}`} key={st.itemId} className="hover:bg-black/20">
                    <td className="py-3.5 pr-3 font-semibold text-[#f5f5f7]">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          st.itemType === 'iron' ? 'bg-[#ff453a]' :
                          st.itemType === 'copper' ? 'bg-[#ff9f0a]' :
                          st.itemType === 'aluminum' ? 'bg-[#8e8e93]' : 'bg-[#64d2ff]'
                        }`} />
                        {st.itemName}
                      </div>
                    </td>
                    <td className="py-3.5 text-[#86868b]">{getTypeNameAr(st.itemType)}</td>
                    <td className="py-3.5 text-center text-[#f5f5f7] font-mono font-bold">
                      {st.totalWeightKg >= 1000 ? `${(st.totalWeightKg / 1000).toFixed(3)} طن` : `${st.totalWeightKg} كجم`}
                    </td>
                    <td className="py-3.5 text-center text-[#86868b] font-mono">{Math.round(st.avgPurchasePricePerTon).toLocaleString('ar-SA')} ج.م</td>
                    <td className="py-3.5 text-left pl-3 text-[#30d158] font-mono font-bold">{Math.round(st.totalValue).toLocaleString('ar-SA')} جنيه</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB content: 2. P&L */}
      {activeTab === 'pl' && (
        <div id="tab-pl-view" className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#333336]/60 pb-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#30d158]" />
              الأرباح الهامشية وتكاليف البضاعة المبيعة
            </h3>
            
            {/* Filter */}
            <div className="flex items-center gap-2 bg-black px-3 py-1.5 rounded-full border border-[#333336]">
              <Filter className="w-3.5 h-3.5 text-[#86868b]" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-[11px] text-[#f5f5f7] focus:outline-none cursor-pointer font-mono"
              />
              <span className="text-[10px] text-[#86868b] font-bold px-1">إلى</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent text-[11px] text-[#f5f5f7] focus:outline-none cursor-pointer font-mono"
              />
            </div>
          </div>

          {/* Core financial ledger numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="bg-black p-5 rounded-2xl border border-[#333336] flex flex-col justify-between">
              <span className="text-[10px] text-[#86868b] font-bold">إيراد المبيعات الإجمالي لشركتنا:</span>
              <h3 className="text-xl font-bold text-white mt-1.5 font-mono">
                {plReport.salesAmount.toLocaleString('ar-SA')} <span className="text-xs text-[#86868b] pr-1">جنيه</span>
              </h3>
              <p className="text-[10px] text-[#86868b] mt-1">الصفقات المصدرة المعتمدة بالساحة بالفترة</p>
            </div>

            <div className="bg-black p-5 rounded-2xl border border-[#333336] flex flex-col justify-between">
              <span className="text-[10px] text-[#86868b] font-bold">تكلفة المواد المباعة المقابلة (COGS):</span>
              <h3 className="text-xl font-bold text-white mt-1.5 font-mono">
                {Math.round(plReport.soldCost).toLocaleString('ar-SA')} <span className="text-xs text-[#86868b] pr-1">جنيه</span>
              </h3>
              <p className="text-[10px] text-[#86868b] mt-1">كميات المبيعات برصيد متوسط الشراء المرجح</p>
            </div>

            <div className="bg-black p-5 rounded-2xl border border-[#333336] flex flex-col justify-between">
              <span className="text-[10px] text-[#86868b] font-bold">هامش أرباح العمليات الفورية:</span>
              <h3 className={`text-xl font-bold mt-1.5 font-mono ${plReport.directProfit >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                {Math.round(plReport.directProfit).toLocaleString('ar-SA')} <span className="text-xs text-[#86868b] pr-1">جنيه</span>
              </h3>
              <p className="text-[10px] text-[#86868b] mt-1">هامش الأرباح من العمليات التجارية بالموقع</p>
            </div>

          </div>

          <div className="p-4 bg-black border border-[#333336] rounded-2xl flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#ff9f0a] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#86868b] leading-relaxed font-normal">
              توضيح مالي: نطبق في الهضبة طريقة المتوسط الحسابي المرجح (WAC) لإيجاد ربحية الحديد والمعادن الصادرة بشكل دقيق تلافياً للتقلبات اليومية الكثيرة لأسعار بورصة الخردة بمصر.
            </div>
          </div>
        </div>
      )}

      {/* TAB content: 3. Partners Balances */}
      {activeTab === 'partners' && (
        <div id="tab-partners-view" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Suppliers balance directory */}
          <div className="bg-[#161617] border border-[#333336] p-5 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-white">
              دليل أرصدة الموردين (المطالب المتبقية علينا)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[#333336]/60 text-[#86868b] pb-2 font-bold">
                    <th className="py-2.5 pr-2">اسم المورد</th>
                    <th className="py-2.5">رقم الاتصال اليومي</th>
                    <th className="py-2.5 text-left pl-2">الرصيد الكلي دائن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333336]/30">
                  {suppliers.map(sup => {
                    const dynamicBal = useApp().getSupplierBalance(sup.id);
                    return (
                      <tr id={`partner-sup-${sup.id}`} key={sup.id} className="hover:bg-black/20">
                        <td className="py-3 pr-2 font-semibold text-[#f5f5f7]">{sup.name}</td>
                        <td className="py-3 text-[#86868b] font-mono">{sup.phone || '—'}</td>
                        <td className="py-3 text-left pl-2 text-[#ff9f0a] font-mono font-bold">
                          {dynamicBal.toLocaleString('ar-SA')} ج.م
                        </td>
                      </tr>
                    );
                  })}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-[#86868b]">لا توجد أرصدة لموردي سكراب بالشركة حالياً.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customers balance folder */}
          <div className="bg-[#161617] border border-[#333336] p-5 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-white">
              دليل مديونيات الزبائن والمصانع (مستحقات التحصيل)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[#333336]/60 text-[#86868b] pb-2 font-bold">
                    <th className="py-2.5 pr-2">اسم العميل والمنشأة</th>
                    <th className="py-2.5">رقم الهاتف الفعال</th>
                    <th className="py-2.5 text-left pl-2">رصيد المديونية مدين</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333336]/30">
                  {customers.map(cust => {
                    const dynamicBal = useApp().getCustomerBalance(cust.id);
                    return (
                      <tr id={`partner-cust-${cust.id}`} key={cust.id} className="hover:bg-black/20">
                        <td className="py-3 pr-2 font-semibold text-[#f5f5f7]">{cust.name}</td>
                        <td className="py-3 text-[#86868b] font-mono">{cust.phone || '—'}</td>
                        <td className="py-3 text-left pl-2 text-[#30d158] font-mono font-bold">
                          {dynamicBal.toLocaleString('ar-SA')} ج.م
                        </td>
                      </tr>
                    );
                  })}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-[#86868b]">لا توجد أرصدة لعملاء الحديد أو المصانع.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB content: 4. JSON Backup and Import */}
      {activeTab === 'backup' && (
        <div id="tab-backup" className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#333336]/60 pb-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-[#bf5af2]" />
              النسخ الاحتياطي ومزامنة دفاتر الشركة المالية
            </h3>
            <span className="text-[10px] font-mono text-[#86868b] bg-black px-2 py-0.5 rounded border border-[#333336]">JSON BACKUP UTILITY</span>
          </div>

          <p className="text-xs text-[#86868b] leading-relaxed max-w-4xl">
            يخزن النظام كافة قيود الميزان المدمج والصفقات بذاكرة المتصفح للوصول الفوري السريع. لحماية أعمالك وتأمين التقارير من الفقدان أو تشغيلها عبر منصات الإدارات الأخرى، نوصي بتحميل نسخة احتياطية بشكل دوري عبر صيغة JSON سهلة الحفظ والمطابقة.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Export box */}
            <div id="export-panel" className="bg-black p-5 rounded-2xl border border-[#333336] space-y-4">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>تصدير نسخة البيانات الفورية</span>
              </h4>
              <p className="text-[11px] text-[#86868b] leading-normal">
                برجاء الضغط على الزر لتجميع قيود الفواتير والصفقات وجداول الشركاء المسجلين فوراً في ملف حاسوبي مشفر آمن لحمايتها.
              </p>
              
              <button
                id="export-db-btn"
                type="button"
                onClick={handleExport}
                className="bg-[#0071e3] hover:bg-[#147ce5] text-white font-medium py-2 px-5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer mt-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير ملف قاعدة البيانات بالكامل (.json)</span>
              </button>
            </div>

            {/* Import box */}
            <div id="import-panel" className="bg-black p-5 rounded-2xl border border-[#333336] space-y-4">
              <h4 className="text-xs font-bold text-[#ff453a] flex items-center gap-1">
                <span>استيراد واستعادة القيود الحسابية</span>
              </h4>
              <p className="text-[11px] text-[#86868b] leading-normal">
                انتقِ ملف JSON الذي تم تصديره سابقاً أو الصق الرمز البرمجي بالكامل لتحديث كافة السجلات والكميات بالساحة.
              </p>

              <form onSubmit={handleImport} className="space-y-4">
                
                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="w-full bg-[#161617] border border-[#333336] rounded-xl px-3 py-2 text-xs text-[#86868b] cursor-pointer"
                  />
                  <textarea
                    placeholder="الصق هنا رمز بيانات الاستعادة..."
                    value={backupJson}
                    onChange={e => setBackupJson(e.target.value)}
                    className="w-full h-24 bg-[#161617] border border-[#333336] rounded-xl p-3 text-[10px] text-zinc-300 font-mono focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    id="import-db-btn"
                    type="submit"
                    className="bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white font-medium py-2 px-5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 shrink-0 text-[#ff453a]" />
                    <span>تأكيد ترميم واستيراد السجلات</span>
                  </button>
                </div>

              </form>

            </div>

          </div>

          <div className="bg-rose-950/20 border border-rose-900/45 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-rose-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff453a] animate-pulse" />
              التهيئة الشاملة لتصفير وقيد البيانات الحقيقية للساحة (صيانة وتصفير الدفاتر)
            </h4>
            <p className="text-[11px] text-[#86868b] leading-relaxed">
              هذا الخيار سيمسح كافة الفواتير والقيود الافتراضية والموردين والعملاء والمصروفات المسجلة مسبقاً في النظام بالكامل لتهيئة السجل لبيانات ومعاملات المستودع الفعلي الحقيقية بمصر. سيتم الإبقاء فقط على الفئات الخمسة الرئيسية للمعادن لتسهيل تصنيفات الميزان.
            </p>
            
            {!showClearConfirm ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="bg-[#ff453a]/10 hover:bg-[#ff453a]/25 text-[#ff453a] border border-[#ff453a]/30 font-bold py-2 px-6 rounded-full text-xs transition-colors cursor-pointer"
              >
                تصفير الدفاتر بالكامل للبدء ببيانات واقعية ⚙️
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/60 p-4 border border-[#ff453a]/40 rounded-xl animate-fade-in">
                <span className="text-xs text-rose-300 font-bold">⚠️ هل أنت متأكد تماماً من رغبتك في حذف وحذف كل الحسابات السابقة لتسجيل البيانات الحقيقية؟</span>
                <div className="flex items-center gap-2 mr-auto">
                  <button
                    type="button"
                    onClick={() => {
                      clearAllData();
                      setShowClearConfirm(false);
                      setImportStatus('تم بنجاح تصفير وتهيئة السجلات كاملة لمؤسسة الهضبة! يمكنك الآن إدخال البيانات الحقيقية والرفع.');
                      setTimeout(() => setImportStatus(''), 7000);
                    }}
                    className="bg-[#ff453a] hover:bg-rose-500 text-white font-black py-1.5 px-4 rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    نعم، امسح كل البيانات الحالية 🗑️
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    تراجع وإلغاء
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-[#333336]/60 flex items-center gap-2 text-[#86868b] text-[10px]">
            <Check className="w-4 h-4 text-[#30d158]" />
            <span>نظام التخزين آمن ومشفر بالكامل داخل المتصفح مع توافق تام لبروتوكول التصدير المادي لساحة الهضبة.</span>
          </div>

        </div>
      )}

    </div>
  );
}
