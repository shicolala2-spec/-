/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import ItemsPage from './components/ItemsPage';
import PurchasesPage from './components/PurchasesPage';
import SalesPage from './components/SalesPage';
import DailyPricesPage from './components/DailyPricesPage';
import SettlementPage from './components/SettlementPage';
import ReportsPage from './components/ReportsPage';
import ExpensesPage from './components/ExpensesPage';
import BanksPage from './components/BanksPage';
import RecurringObligationsPage from './components/RecurringObligationsPage';
import { 
  Shield, Scale, DollarSign, LayoutDashboard, Calendar, Users, 
  Trash2, FileText, Download, LogOut, Clock, Menu, X, Hammer, UserCheck, Wallet,
  Landmark, RotateCcw, Monitor, Laptop, Smartphone
} from 'lucide-react';

function NavigationWrapper() {
  const { user, logout } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [viewMode, setViewMode] = useState<'responsive' | 'desktop_sim' | 'mobile_sim'>('responsive');

  // Detect if inside simulated iframe frame
  const [isSimFrame, setIsSimFrame] = useState(false);
  const [simFrameType, setSimFrameType] = useState<'mobile' | 'desktop' | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sim_view') === 'mobile') {
      setIsSimFrame(true);
      setSimFrameType('mobile');
    } else if (params.get('sim_view') === 'desktop') {
      setIsSimFrame(true);
      setSimFrameType('desktop');
    }
  }, []);

  // Update Clock dynamically
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ar-SA') + ' - ' + now.toLocaleDateString('ar-SA'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) {
    return <LoginPage />;
  }

  // Force-flag view adjustments if inside simulated frames
  const forceMobileVersion = simFrameType === 'mobile' || viewMode === 'mobile_sim';
  const forceDesktopVersion = simFrameType === 'desktop' || viewMode === 'desktop_sim';

  // Sidebar list representing standard menu options with role authorization logic
  const originalMenu = [
    { id: 'dashboard', name: 'لوحة القيادة والمراقبة', icon: LayoutDashboard, roles: ['admin', 'procurement', 'sales', 'accounting'] },
    { id: 'items', name: 'إدارة أصناف الخردة', icon: Hammer, roles: ['admin', 'procurement'] },
    { id: 'purchases', name: 'تذكرة وارد (شراء)', icon: Scale, roles: ['admin', 'procurement'] },
    { id: 'sales', name: 'تذكرة صادر (بيع)', icon: DollarSign, roles: ['admin', 'sales'] },
    { id: 'prices', name: 'بورصة الأسعار اليومية', icon: Calendar, roles: ['admin', 'procurement', 'accounting'] },
    { id: 'settlements', name: 'تسوية الذمم والدفعات', icon: Users, roles: ['admin', 'accounting'] },
    { id: 'banks', name: 'الحسابات والخزائن البنكية', icon: Landmark, roles: ['admin', 'accounting'] },
    { id: 'recurring', name: 'الالتزامات والأقساط الدورية', icon: RotateCcw, roles: ['admin', 'accounting'] },
    { id: 'expenses', name: 'إدارة المصروفات التشغيلية', icon: Wallet, roles: ['admin', 'accounting'] },
    { id: 'reports', name: 'التقارير والمطابقة وقدرات الجلب', icon: FileText, roles: ['admin', 'accounting', 'procurement', 'sales'] }
  ];

  // Filter menu options according to current user privilege
  const authorizedMenu = originalMenu.filter(item => item.roles.includes(user.role));

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'items':
        return <ItemsPage />;
      case 'purchases':
        return <PurchasesPage />;
      case 'sales':
        return <SalesPage />;
      case 'prices':
        return <DailyPricesPage />;
      case 'settlements':
        return <SettlementPage />;
      case 'banks':
        return <BanksPage />;
      case 'recurring':
        return <RecurringObligationsPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <Dashboard />;
    }
  };

  const getUserBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-[#1d1d1f] border-[#424245] text-white';
      case 'procurement': return 'bg-[#0066cc]/10 border-[#0066cc]/30 text-[#2997ff]';
      case 'sales': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'accounting': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      default: return 'bg-[#1D1D1F] border-[#333336] text-[#86868b]';
    }
  };

  const getRoleNameAr = (role: string) => {
    switch (role) {
      case 'admin': return 'المدير العام';
      case 'procurement': return 'تذاكر الشراء والوزن';
      case 'sales': return 'المبيعات والصادر';
      case 'accounting': return 'المحاسب المالي والتدقيق';
      default: return 'مراقب عام الساحة';
    }
  };

  // Compile conditional classes style sheet for sidebar drawer
  let sidebarClasses = "bg-[#161617]/98 border-l border-[#333336] w-64 p-4 shrink-0 flex flex-col justify-between transition-transform duration-300 overflow-y-auto print:hidden z-40 ";
  if (forceMobileVersion) {
    sidebarClasses += "fixed top-[61px] right-0 bottom-0 h-[calc(100vh-61px)] " + (sidebarOpen ? "translate-x-0" : "translate-x-full");
  } else if (forceDesktopVersion) {
    sidebarClasses += "sticky top-[61px] h-[calc(100vh-61px)] translate-x-0 z-30";
  } else {
    sidebarClasses += "fixed lg:sticky top-[61px] right-0 lg:right-auto bottom-0 lg:bottom-auto h-[calc(100vh-61px)] lg:transform-none " + 
                      (sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0");
  }



  // Inside simulator viewports (iframe components), we do not need the outer monitor shells or top controllers recursion
  if (isSimFrame) {
    return (
      <div id="main-frame" className="min-h-screen bg-[#111112] text-[#f5f5f7] flex flex-col font-sans select-none" dir="rtl">
        
        {/* Simplified mobile-or-desktop simulator header */}
        <header id="top-bar" className="bg-[#161617]/90 border-b border-[#333336] sticky top-0 z-40 backdrop-blur-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-1 bg-[#1d1d1f] border border-[#424245] rounded-full text-zinc-300 transition-colors cursor-pointer ${
                forceMobileVersion ? 'block' : 'hidden'
              }`}
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 text-[10px] bg-[#0071e3] text-white rounded font-bold">محاكاة الموبايل</span>
              <span className="text-[11px] font-bold text-white truncate max-w-[170px] sm:max-w-none">الهضبة لتجارة الخردة للمعادن</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#86868b] hidden sm:block">{user.name}</span>
            <button onClick={logout} className="p-1 bg-[#222] text-rose-500 rounded border border-zinc-800 text-[10px] font-bold">خروج</button>
          </div>
        </header>

        <div className="flex-1 flex relative">
          <aside className={sidebarClasses}>
            <div className="space-y-6 pt-2">
              <div className="p-3 bg-black/40 border border-[#333336] rounded-2xl flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#161617] border border-[#333336] flex items-center justify-center text-[#2a9dff] text-xs font-bold">
                  {user.role.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-[9px] leading-tight">
                  <span className="text-white block font-semibold truncate max-w-[130px]">{user.email}</span>
                </div>
              </div>

              <div className="space-y-1">
                {authorizedMenu.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-right py-2 px-3 rounded-full text-[11px] font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                        activeTab === item.id 
                          ? 'bg-[#0071e3] text-white font-semibold'
                          : 'text-[#86868b] hover:bg-[#1d1d1f] hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="flex-1 p-4 overflow-x-hidden min-h-[calc(100vh-50px)] w-full font-sans">
            {renderActiveScreen()}
          </main>
        </div>
      </div>
    );
  }

  // Host Window rendering layout
  return (
    <div id="main-frame" className="min-h-screen bg-black text-[#f5f5f7] flex flex-col font-sans select-none animate-fadeIn" dir="rtl">
      
      {/* Apple-style sticky header with blur */}
      <header id="top-bar" className="bg-[#161617]/80 border-b border-[#333336] sticky top-0 z-40 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between print:hidden">
        
        {/* Toggle + Logo block */}
        <div className="flex items-center gap-4">
          <button
            id="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 bg-[#1d1d1f] border border-[#424245] rounded-full text-zinc-300 hover:text-white cursor-pointer transition-colors ${
              viewMode === 'mobile_sim' ? 'block' : 'lg:hidden'
            }`}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3.5" id="company-stamp-group">
            <div className="p-2 bg-[#1d1d1f] border border-[#333336] rounded-xl flex items-center justify-center">
              <Hammer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-white leading-none">مؤسسة الهضبة لتجارة المعادن والخردة</h1>
              <span className="text-[9px] sm:text-[10px] text-[#2997ff] font-medium tracking-tight pt-0.5 block">نظام الحوكمة الرقمي وتذاكر الوزن بمصر v2.5</span>
            </div>
          </div>
        </div>



        {/* Device View Mode Simulator Controls */}
        <div id="device-view-simulator" className="flex items-center gap-1 bg-[#1d1d1f] border border-[#333336] p-1 rounded-2xl">
          <button
            onClick={() => setViewMode('responsive')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'responsive'
                ? 'bg-[#0071e3] text-white'
                : 'text-[#86868b] hover:text-[#f5f5f7]'
            }`}
            title="وضع الاستجابة الذكي التلقائي"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">استجابة ذكية</span>
          </button>
          
          <button
            onClick={() => setViewMode('desktop_sim')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'desktop_sim'
                ? 'bg-[#0071e3] text-white'
                : 'text-[#86868b] hover:text-[#f5f5f7]'
            }`}
            title="محاكاة شاشة جهاز الكمبيوتر والمكتب"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden md:inline">مقاس كمبيوتر كامل</span>
          </button>
          
          <button
            onClick={() => setViewMode('mobile_sim')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'mobile_sim'
                ? 'bg-[#0071e3] text-white'
                : 'text-[#86868b] hover:text-[#f5f5f7]'
            }`}
            title="محاكاة هاتف ذكي (موبايل)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">تلفون البسكول</span>
          </button>
        </div>

        {/* Local Clock info (Apple-style minimalist font) */}
        <div id="digital-clock" className={`items-center gap-2 bg-[#1d1d1f] border border-[#333336] px-4.5 py-1.5 rounded-full font-mono text-[9px] text-[#86868b] tracking-wider ${
          viewMode === 'mobile_sim' ? 'hidden' : 'hidden lg:flex'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{currentTime || 'جاري تحميل مصفوفة التوقيع للوقت...'}</span>
        </div>

        {/* User Account / Role block */}
        <div className="flex items-center gap-3" id="user-top-controls">
          <div className={`flex-col items-end text-right ${
            viewMode === 'mobile_sim' ? 'hidden' : 'hidden sm:flex'
          }`}>
            <span className="text-xs font-medium text-white">{user.name}</span>
            <span className={`text-[9px] font-semibold px-2 py-0.5 mt-1 rounded-full border ${getUserBadgeColor(user.role)}`}>
              {getRoleNameAr(user.role)}
            </span>
          </div>

          <button
            id="logout-action-btn"
            onClick={logout}
            className="p-2.5 bg-[#1d1d1f] border border-[#333336] text-rose-500 hover:text-rose-400 hover:bg-[#2d2d30] rounded-full transition-colors cursor-pointer"
            title="تسجيل الخروج والتبديل"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </header>

      {/* RENDER THE BODY BASED ON SELECT PREVIEW SIMULATOR */}
      {viewMode === 'responsive' ? (
        <div id="workspace-container" className="flex-1 flex relative">
          {/* Mobile backdrop shadow click-outside handler */}
          {sidebarOpen && (
            <div 
              id="sidebar-mobile-backdrop" 
              className="fixed inset-0 top-[61px] bg-black/60 backdrop-blur-xs z-35 lg:hidden transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {/* Apple Style Sidebar Container */}
          <aside id="sidebar" className={sidebarClasses}>
            <div className="space-y-6 pt-2">
              <div id="active-terminal-card" className="p-3 bg-[#1d1d1f] border border-[#333336] rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#161617] border border-[#333336] flex items-center justify-center text-[#2997ff]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-[10px] leading-snug">
                  <span className="text-[#86868b] block font-medium">المشغل النشط حالياً:</span>
                  <span className="text-white block font-semibold truncate max-w-[145px]">{user.email}</span>
                </div>
              </div>

              <div id="menu-items" className="space-y-1">
                {authorizedMenu.map(item => {
                  const Icon = item.icon;
                  const isSelected = activeTab === item.id;
                  return (
                    <button
                      id={`side-menu-${item.id}`}
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-right py-2 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected 
                          ? 'bg-[#0071e3] text-white font-semibold shadow-md shadow-[#0071e3]/10'
                          : 'text-[#86868b] hover:bg-[#1d1d1f] hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div id="sidebar-footer" className="pt-4 border-t border-[#333336] text-[10px] text-[#86868b] text-center space-y-1">
              <span className="block font-medium text-white">الهضبة للوزن والمعادن بمصر</span>
              <span className="block font-mono">حالة بيئة النظام: <b className="text-emerald-400">متصل وآمن</b></span>
            </div>
          </aside>

          {/* Main Content Window Panel */}
          <main id="main-content-window" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden min-h-[calc(100vh-61px)] w-full">
            {renderActiveScreen()}
          </main>
        </div>
      ) : viewMode === 'mobile_sim' ? (
        <div className="flex-1 bg-[#09090b] flex flex-col items-center justify-center p-4 sm:p-8 min-h-[calc(100vh-61px)] overflow-y-auto" style={{ backgroundImage: 'radial-gradient(#1f1f22 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
          
          <div className="mb-4 text-center">
            <span className="text-[11px] font-bold text-[#86868b] bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-full inline-flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-[#2997ff] animate-pulse" />
              <span>محاكاة هاتف تذاكر الوزن الذكي مباشرة (قائمة على الحالة النشطة - بدون تسجيل خروج)</span>
            </span>
          </div>

          {/* iPhone style device model view wrapper with REAL dynamic React component injection to preserve state */}
          <div className="w-[380px] h-[780px] bg-black border-[12px] border-[#222224] rounded-[50px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden border-t-[14px]">
            {/* Dynamic Island Capsule */}
            <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-50 flex items-center justify-center pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-[#1b1c1e] ml-2" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#050505]" />
            </div>

            {/* Direct React Inward Frame rendering instead of iframe to preserve login context */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-[#111112] text-[#f5f5f7] relative text-xs">
              {/* Simulated app bar */}
              <header className="bg-[#161617]/90 border-b border-[#333336] sticky top-0 z-40 backdrop-blur-md px-4 py-3 flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-1.5 bg-[#1d1d1f] border border-[#424245] rounded-full text-zinc-300 pointer-events-auto"
                >
                  {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
                <span className="text-[10px] font-bold tracking-tight text-white">الهضبة لتجارة الخرسانة والمعادن</span>
                <span className="p-1 px-1.5 text-[8px] bg-[#0071e3] text-white rounded font-bold">موبايل</span>
              </header>

              <div className="flex-1 flex relative overflow-hidden">
                {/* Simulated mobile drawer side navigation */}
                {sidebarOpen && (
                  <div className="absolute inset-0 bg-black/8 w-full h-full z-40" onClick={() => setSidebarOpen(false)}>
                    <aside className="bg-[#161617]/95 border-l border-[#333336] w-56 h-full p-4 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
                      <div className="space-y-4 pt-2">
                        <div className="p-2 bg-black/40 border border-[#333336] rounded-xl text-[9px] truncate">
                          <span className="text-white block font-semibold">{user.email}</span>
                          <span className="text-[#86868b] block">{getRoleNameAr(user.role)}</span>
                        </div>
                        <div className="space-y-0.5">
                          {authorizedMenu.map(item => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveTab(item.id);
                                  setSidebarOpen(false);
                                }}
                                className={`w-full text-right py-1.5 px-2.5 rounded-full text-[10px] font-medium transition-all flex items-center gap-2 ${
                                  activeTab === item.id 
                                    ? 'bg-[#0071e3] text-white font-semibold'
                                    : 'text-[#86868b] hover:bg-[#1d1d1f] hover:text-white'
                                }`}
                              >
                                <Icon className="w-3 h-3" />
                                <span>{item.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <button onClick={logout} className="p-1.5 bg-[#222] text-rose-500 rounded border border-zinc-800 text-[10px] font-bold">خروج</button>
                    </aside>
                  </div>
                )}

                {/* Simulated inner active workspace screen */}
                <main className="flex-1 p-3 overflow-y-auto max-w-full">
                  {renderActiveScreen()}
                </main>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="flex-1 bg-[#09090b] flex flex-col items-center justify-center p-4 sm:p-8 min-h-[calc(100vh-61px)] overflow-y-auto" style={{ backgroundImage: 'radial-gradient(#1f1f22 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
          
          <div className="mb-4 text-center">
            <span className="text-[11px] font-bold text-[#86868b] bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-full inline-flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-[#2a9dff]" />
              <span>محاكاة شاشة جهاز الكومبيوتر المكتبي واللاب توب مباشرة (مزامنة فورية كاملة)</span>
            </span>
          </div>

          {/* Desktop Laptop frame mockup rendering directly to preserve state */}
          <div className="w-full max-w-[1240px] h-[680px] bg-[#161617] border-[10px] border-[#222224] rounded-t-3xl shadow-2xl relative flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col bg-black text-[#f5f5f7] overflow-hidden text-xs">
              <header className="bg-[#161617]/90 border-b border-[#333336] px-4 py-2.5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white">الهضبة لتجارة الخرسانة والمعادن (منظور شاشات المكاتب)</span>
                <span className="text-[9px] text-[#86868b]">المستخدم: {user.name}</span>
              </header>

              <div className="flex-1 flex relative overflow-hidden">
                <aside className="bg-[#161617] border-l border-[#333336] w-56 p-3 shrink-0 flex flex-col justify-between h-full overflow-y-auto">
                  <div className="space-y-4">
                    <div className="space-y-0.5">
                      {authorizedMenu.map(item => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-right py-2 px-3 rounded-full text-[10px] font-medium transition-all flex items-center gap-2 ${
                              activeTab === item.id 
                                ? 'bg-[#0071e3] text-white font-semibold'
                                : 'text-[#86868b] hover:bg-[#1d1d1f] hover:text-white'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button onClick={logout} className="py-1 bg-[#222] text-rose-500 rounded border border-zinc-800 text-[10px] font-bold mt-4">خروج</button>
                </aside>
                <main className="flex-1 p-5 overflow-y-auto">
                  {renderActiveScreen()}
                </main>
              </div>
            </div>
          </div>
          {/* Laptop trackpad keyboard bottom bezel representation */}
          <div className="w-full max-w-[1290px] h-3.5 bg-[#424245] rounded-b-2xl shadow-xl border-t border-[#4f4f52]" />
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationWrapper />
    </AppProvider>
  );
}
