/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Item } from '../types';
import { Check, DollarSign, Calendar, TrendingUp, Award } from 'lucide-react';

export default function DailyPricesPage() {
  const { items, addDailyPrice, getLatestPrice, user } = useApp();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [success, setSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const canEdit = user?.role === 'admin' || user?.role === 'procurement' || user?.role === 'accounting';

  const handleStartEdit = (item: Item) => {
    if (!canEdit) return;
    const price = getLatestPrice(item.id, selectedDate);
    setEditingItemId(item.id);
    setErrorMsg('');
    setBuyPrice(String(price?.buy || 1500));
    setSellPrice(String(price?.sell || 1800));
  };

  const handleSave = (item: Item) => {
    const buyNum = parseFloat(buyPrice);
    const sellNum = parseFloat(sellPrice);

    if (isNaN(buyNum) || buyNum <= 0 || isNaN(sellNum) || sellNum <= 0) {
      setErrorMsg('نظراً للسياسة الآمنة، يُشترط تسجيل قيم الشراء والبيع كأرقام أكبر من صفر بالكامل.');
      return;
    }

    addDailyPrice(item.id, buyNum, sellNum, selectedDate);
    setEditingItemId(null);
    setErrorMsg('');
    setSuccess(`تم تحديث سعر مادة ${item.name.split(' (')[0]} لليوم بنجاح!`);
    
    setTimeout(() => {
      setSuccess('');
    }, 4000);
  };

  return (
    <div id="daily-prices-root" className="space-y-6 text-[#f5f5f7] font-sans" dir="rtl">
      
      {/* Header Panel */}
      <div id="prices-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161617] p-6 rounded-3xl border border-[#333336]">
        <div id="prices-title-block">
          <h1 id="prices-title" className="text-xl font-semibold text-white tracking-tight">مؤشر ومحدد أسعار اليوم</h1>
          <p id="prices-subtitle" className="text-[#86868b] text-xs">تعيين وتحديث أسعار شراء وبيع طن الخردة اليومي لمواكبة البورصة المصرية ومصانع الدرفلة</p>
        </div>

        {/* Date Selector */}
        <div id="date-select-block" className="flex items-center gap-2 bg-black p-2.5 rounded-2xl border border-[#333336]">
          <Calendar className="w-4 h-4 text-[#2997ff]" />
          <span className="text-xs text-[#86868b] font-medium">تاريخ مؤشرات البورصة:</span>
          <input
            id="price-date-picker"
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-[#1d1d1f] border border-[#333336] text-xs text-[#f5f5f7] rounded-lg p-1.5 focus:outline-none focus:border-[#0071e3] font-mono cursor-pointer"
          />
        </div>
      </div>

      {success && (
        <div id="prices-success-alert" className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-medium flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-[#86868b] hover:text-white cursor-pointer text-[10px]">إغلاق</button>
        </div>
      )}

      {errorMsg && (
        <div id="prices-error-alert" className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-450 text-xs font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-[#86868b] hover:text-white cursor-pointer text-[10px]">إغلاق</button>
        </div>
      )}

      {/* Intro info box */}
      <div id="prices-info-box" className="p-5 bg-[#161617] border border-[#333336] rounded-3xl space-y-3 relative overflow-hidden">
        <h3 className="text-xs font-bold text-white flex items-center gap-2 tracking-wide">
          <TrendingUp className="w-4 h-4 text-[#2997ff]" />
          مخرجات استراتيجية التسعير الفوري للميزان
        </h3>
        <p className="text-xs text-[#86868b] leading-relaxed max-w-5xl">
          الأسعار المحددة هنا تطبق تلقائياً عند إنشاء حركة شراء للوارد أو بيع للصادر بالساحة. يمنع هذا البنية التقليدية الأخطاء البشرية أو التلاعب بالأسعار في كشوفات الحساب الختامي ومطابقة اليوميات. تذكر تلبية الأسعار وفقاً لتوجيهات بورصة الحديد والمعادن المصرية.
        </p>
      </div>

      {/* Grid of Prices */}
      <div id="prices-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map(item => {
          const prices = getLatestPrice(item.id, selectedDate);
          const isEditing = editingItemId === item.id;
          
          const buy = prices?.buy || 1500;
          const sell = prices?.sell || 1800;
          const profitPerTon = sell - buy;
          const marginPercent = Math.round((profitPerTon / buy) * 100);

          return (
            <div id={`price-card-${item.id}`} key={item.id} className="bg-[#161617] border border-[#333336] p-5 rounded-3xl space-y-6 hover:border-[#424245] transition-all flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">{item.name}</h3>
                    <span className="text-[10px] text-[#86868b] font-mono block pt-1">
                      المادة الأساسية: {item.type === 'iron' ? 'حديد وصلب' : (item.type === 'copper' ? 'نحاس وأكبال' : 'ألومنيوم وستانلس')}
                    </span>
                  </div>
                  
                  <span className="bg-black px-2.5 py-1 rounded-full border border-[#333336] text-[9px] text-[#86868b] font-semibold">
                    حركة لكل طن مالي
                  </span>
                </div>

                <div className="bg-black p-4 rounded-2xl border border-[#333336] space-y-3">
                  
                  {isEditing ? (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#86868b] font-medium">سعر الشراء للطن (جنيه):</span>
                        <input
                          id={`buy-price-input-${item.id}`}
                          type="number"
                          value={buyPrice}
                          onChange={e => setBuyPrice(e.target.value)}
                          className="w-24 bg-[#1d1d1f] border border-[#333336] text-center font-mono rounded-lg px-2 py-1 text-xs text-[#2997ff] font-bold focus:border-[#0071e3] focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#86868b] font-medium">سعر البيع للطن (جنيه):</span>
                        <input
                          id={`sell-price-input-${item.id}`}
                          type="number"
                          value={sellPrice}
                          onChange={e => setSellPrice(e.target.value)}
                          className="w-24 bg-[#1d1d1f] border border-[#333336] text-center font-mono rounded-lg px-2 py-1 text-xs text-emerald-450 font-bold focus:border-[#0071e3] focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#86868b] flex items-center gap-1.5 font-medium">
                          <DollarSign className="w-3.5 h-3.5 text-[#86868b]" />
                          سعر شراء الساحة (الوارد):
                        </span>
                        <span className="font-mono text-[#2997ff] font-semibold text-xs">{buy.toLocaleString('ar-SA')} جنيه</span>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-2 border-t border-[#333336]/40">
                        <span className="text-[#86868b] flex items-center gap-1.5 font-medium">
                          <DollarSign className="w-3.5 h-3.5 text-[#86868b]" />
                           سعر البيع للمصانع والعموم:
                        </span>
                        <span className="font-mono text-emerald-400 font-semibold text-xs">{sell.toLocaleString('ar-SA')} جنيه</span>
                      </div>
                    </>
                  )}

                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3.5 border-t border-[#333336] flex items-center justify-between">
                
                <div className="text-right">
                  <span className="text-[9px] text-[#86868b] block leading-none">هامش الربح العادل للطن</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 mt-1">
                    +{profitPerTon.toLocaleString('ar-SA')} ج.م <span className="text-[9px] text-[#86868b]">({marginPercent}%)</span>
                  </span>
                </div>

                {canEdit ? (
                  isEditing ? (
                    <button
                      id={`save-price-btn-${item.id}`}
                      onClick={() => handleSave(item)}
                      className="bg-[#0071e3] hover:bg-[#147ce5] text-white font-medium py-1.5 px-3.5 rounded-full text-[10px] flex items-center gap-1 cursor-pointer transition-transform"
                    >
                      <Check className="w-3 h-3" />
                      <span>اتمام المعايرة</span>
                    </button>
                  ) : (
                    <button
                      id={`edit-price-btn-${item.id}`}
                      onClick={() => handleStartEdit(item)}
                      className="bg-[#1d1d1f] hover:bg-[#2d2d30] text-white border border-[#424245] font-semibold py-1.5 px-3.5 rounded-full text-[10px] transition-colors cursor-pointer"
                    >
                      تعديل التسعير
                    </button>
                  )
                ) : (
                  <span className="text-[9px] text-[#86868b] italic">غير مسموح بالتعديل للاختصاص</span>
                )}

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
