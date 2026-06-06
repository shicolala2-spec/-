/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Item, ItemType, BaseUnit } from '../types';
import { Plus, Edit2, Trash2, Search, Filter, ShieldAlert, Check, X, FileText } from 'lucide-react';

export default function ItemsPage() {
  const { items, addItem, updateItem, deleteItem, user } = useApp();
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Editing states
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  // Form values
  const [name, setName] = useState('');
  const [type, setType] = useState<ItemType>('iron');
  const [baseUnit, setBaseUnit] = useState<BaseUnit>('ton');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  // Check auth privilege
  const canEdit = user?.role === 'admin' || user?.role === 'procurement';

  const resetForm = () => {
    setName('');
    setType('iron');
    setBaseUnit('ton');
    setDescription('');
    setActive(true);
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addItem(name, type, baseUnit, description);
    resetForm();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !name.trim()) return;
    updateItem({
      ...editingItem,
      name,
      type,
      baseUnit,
      description,
      active
    });
    resetForm();
  };

  const startEdit = (item: Item) => {
    setEditingItem(item);
    setName(item.name);
    setType(item.type);
    setBaseUnit(item.baseUnit);
    setDescription(item.description);
    setActive(item.active);
    setIsAdding(false);
  };

  const itemsFiltered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeNameAr = (t: ItemType) => {
    switch(t) {
      case 'iron': return 'حديد وسكراب صلْب';
      case 'copper': return 'نحاس وأكبال حمراء';
      case 'aluminum': return 'ألومنيوم وخلائط طرية';
      case 'stainless': return 'نواعم ستانلس ستيل';
      default: return 'معادن أخرى ومخلفات فرز';
    }
  };

  return (
    <div id="items-root" className="space-y-6 text-[#f5f5f7] font-sans" dir="rtl">
      
      {/* Header Panel */}
      <div id="items-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161617] p-6 rounded-3xl border border-[#333336]">
        <div id="items-title-block">
          <h1 id="items-title" className="text-xl font-semibold text-white tracking-tight">إدارة وتعريف فئات الأصناف المعادنية</h1>
          <p id="items-subtitle" className="text-[#86868b] text-xs">تعريف وتحديث ومطابقة المواد والفرز لساحة الهضبة لتسهيل إصدار ومطابقة أوزان البسكول ماليّاً</p>
        </div>
        
        {canEdit && !isAdding && !editingItem && (
          <button
            id="add-item-btn"
            onClick={() => setIsAdding(true)}
            className="bg-[#0071e3] hover:bg-[#147ce5] text-white font-medium py-2 px-5 rounded-full text-xs flex items-center gap-2 cursor-pointer transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>تعريف صنف خردة جديد</span>
          </button>
        )}
      </div>

      {/* Editor Block */}
      {(isAdding || editingItem) && (
        <div id="item-editor-form" className="bg-[#161617] border border-[#333336] p-6 rounded-3xl space-y-4 relative">
          <h3 id="item-editor-title" className="text-sm font-semibold text-white flex items-center gap-2">
            <span>{editingItem ? `تعديل الصنف: ${editingItem.name}` : 'تعريف مادة معدنية جديدة بدليل النظام'}</span>
          </h3>

          <form id="item-def-form" onSubmit={editingItem ? handleUpdate : handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
            
            <div className="md:col-span-6 space-y-2">
              <label className="text-[11px] font-bold text-[#86868b] block">مسمى الصنف التجاري:</label>
              <input
                id="item-name-input"
                type="text"
                placeholder="مثال: حديد تسليح خردة كتل ثقيل، مبروم فرز ثاني..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#1d1d1f] border border-[#333336] rounded-2xl px-4 py-3 text-xs text-white focus:border-[#0071e3] focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-[11px] font-bold text-[#86868b] block">التصنيف المعدني الأساسي:</label>
              <select
                id="item-category-select"
                value={type}
                onChange={e => setType(e.target.value as ItemType)}
                className="w-full bg-[#1d1d1f] border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:border-[#0071e3] focus:outline-none transition-colors cursor-pointer"
              >
                <option value="iron">حديد وسكراب صلف (Iron)</option>
                <option value="copper">نحاس ومكثفات حمراء (Copper)</option>
                <option value="aluminum">ألومنيوم كتل رفيعة (Aluminum)</option>
                <option value="stainless">ستانلس ستيل وخلائط (Stainless)</option>
                <option value="other">معادن ومتبقيات أخرى (Other)</option>
              </select>
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-[11px] font-bold text-[#86868b] block">وحدة الميزان الكبرى الافتراضية:</label>
              <select
                id="item-unit-select"
                value={baseUnit}
                onChange={e => setBaseUnit(e.target.value as BaseUnit)}
                className="w-full bg-[#1d1d1f] border border-[#333336] rounded-2xl px-4 py-3 text-xs text-[#f5f5f7] focus:border-[#0071e3] focus:outline-none transition-colors cursor-pointer"
              >
                <option value="ton">الطن المالي (1,000 كجم)</option>
                <option value="kg">الكيلوجرام المباشر (كجم)</option>
              </select>
            </div>

            <div className="md:col-span-9 space-y-2">
              <label className="text-[11px] font-bold text-[#86868b] block">مواصفات ونسبة الشوائب المقررة فنيّاً:</label>
              <input
                id="item-desc-input"
                type="text"
                placeholder="تفاصيل حول نسبة الصدأ المقبولة، سماكة المقاسات بالملليمتر أو الجهات الموردة الكبرى..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-[#1d1d1f] border border-[#333336] rounded-2xl px-4 py-3 text-xs text-white focus:border-[#0071e3] focus:outline-none transition-colors"
              />
            </div>

            <div className="md:col-span-3 flex items-center gap-2 pt-6">
              <input
                id="item-active-checkbox"
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#0071e3] bg-[#1d1d1f] border-[#333336] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="item-active-checkbox" className="text-xs text-[#86868b] cursor-pointer">متاح للتداول وسندات الوزن</label>
            </div>

            <div className="md:col-span-12 flex justify-end gap-3 pt-2">
              <button
                id="cancel-item-btn"
                type="button"
                onClick={resetForm}
                className="bg-[#1d1d1f] border border-[#333336] hover:bg-[#2d2d30] text-[#f5f5f7] font-medium py-1.5 px-4 rounded-full text-xs cursor-pointer transition-colors"
              >
                تجاهل
              </button>
              <button
                id="save-item-btn"
                type="submit"
                className="bg-[#0071e3] hover:bg-[#147ce5] text-white font-medium py-1.5 px-5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-transform"
              >
                <Check className="w-4 h-4" />
                <span>{editingItem ? 'حفظ الصنف المعدل' : 'حفظ المادة بالدليل'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Main Table and Sizing */}
      <div id="items-grid-section" className="bg-[#161617] border border-[#333336] rounded-3xl p-6 space-y-4">
        
        {/* Filters and search */}
        <div id="items-toolbar" className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
          
          <div id="search-input-group" className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#86868b] absolute right-3.5 top-2.5" />
            <input
              id="items-search-box"
              type="text"
              placeholder="ابحث باسم الفلز أو الوصف الفني للرد المالي..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#1d1d1f] border border-[#333336] rounded-full pr-10 pl-4 py-2 text-xs text-white focus:border-[#0071e3] focus:outline-none transition-colors"
            />
          </div>

          <div id="filter-select-group" className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#86868b] shrink-0" />
            <select
              id="items-filter-dropdown"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-[#1d1d1f] border border-[#333336] rounded-full px-3 py-1.5 text-xs text-[#86868b] focus:border-[#0071e3] focus:outline-none min-w-[150px] cursor-pointer"
            >
              <option value="all">كل التصنيفات التجارية</option>
              <option value="iron">حديد وسكراب صلب</option>
              <option value="copper">نحاس ومكثفات سلك</option>
              <option value="aluminum">ألومنيوم وخلائط</option>
              <option value="stainless">ستانلس ستيل صلب</option>
              <option value="other">معادن وأتربة أخرى</option>
            </select>
          </div>

        </div>

        {/* Real Table */}
        <div id="items-table-wrapper" className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[#333336] text-[#86868b] font-medium">
                <th className="py-3 pr-4">اسم المادة / الصنف بالتداول</th>
                <th className="py-3">الفئة المعدنية</th>
                <th className="py-3">وحدة حساب البسكول</th>
                <th className="py-3">توصيف نسبة الفرز والشوائب</th>
                <th className="py-3 text-center">الحالة الرقابية</th>
                {canEdit && <th className="py-3 text-left pl-4">تحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333336]/40">
              {itemsFiltered.map(item => (
                <tr id={`item-row-${item.id}`} key={item.id} className="hover:bg-black/25 group transition-colors">
                  <td className="py-3.5 pr-4 text-white font-semibold">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${
                        item.type === 'iron' ? 'bg-[#ff453a]' :
                        item.type === 'copper' ? 'bg-orange-400' :
                        item.type === 'aluminum' ? 'bg-[#8e8e93]' : 'bg-[#0071e3]'
                      }`} />
                      {item.name}
                    </div>
                  </td>
                  <td className="py-3.5 text-[#86868b] font-medium">{getTypeNameAr(item.type)}</td>
                  <td className="py-3.5 text-[#86868b] font-mono">
                    <span className="bg-black px-2.5 py-1 rounded-full border border-[#333336]">
                      {item.baseUnit === 'ton' ? 'طن وزني (1000 كجم)' : 'كيلوجرام فقط'}
                    </span>
                  </td>
                  <td className="py-3.5 text-[#86868b] max-w-xs truncate" title={item.description}>
                    {item.description || 'لا يوجد مواصفات فنية إضافية'}
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.active ? 'bg-emerald-555/10 border border-emerald-500/20 text-emerald-450' : 'bg-black border border-[#333336] text-[#86868b]'
                    }`}>
                      {item.active ? 'نشط وقابل للوزن' : 'متوقف مؤقتاً'}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="py-3.5 text-left pl-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`edit-item-btn-${item.id}`}
                          onClick={() => startEdit(item)}
                          className="p-1.5 bg-[#1d1d1f] hover:bg-[#2d2d30] text-[#2997ff] rounded-full border border-[#333336] cursor-pointer transition-colors"
                          title="تعديل المادة"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          id={`delete-item-btn-${item.id}`}
                          onClick={() => {
                            if (window.confirm(`تفعيل الحذف النهائي: هل تريد بالتأكيد إخراج مادة ${item.name} من الدليل المعتمد بالكامل؟`)) {
                              deleteItem(item.id);
                            }
                          }}
                          className="p-1.5 bg-[#1d1d1f] hover:bg-rose-500/10 text-rose-500 rounded-full border border-[#333336] cursor-pointer transition-colors"
                          title="حذف المادة من الدليل"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {itemsFiltered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#86868b]">لا توجد فئات خردة ملموسة لمطابقة الفلترة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Static Note Box */}
      <div id="notice-box" className="p-4 bg-black border border-[#333336] rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[#86868b] space-y-1">
          <p className="font-semibold text-white">إشعار حوكمة حركة البسكول وعقد الوزن المعتمد بمصر:</p>
          <p className="leading-relaxed">
            النظام يدعم التحويل الفوري والتلقائي من كيلوجرام إلى طن دفتري لضمان شفافية مطالبات الشركاء المالية. يجب على موثق الدخول بالساحة كتابة أوزان القسط الأول وميزان البسكول بدقة لتوليد الفواتير بنسبتها اليومية المواكبة.
          </p>
        </div>
      </div>

    </div>
  );
}
