/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { LogIn, Shield, Users, DollarSign, Hammer, Scale } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const { login } = useApp();
  const [role, setRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username || role, role);
  };

  const rolesConfig = [
    {
      role: 'admin' as UserRole,
      title: 'المدير العام',
      desc: 'صلاحيات كاملة للمراقبة وإدارة أصناف السكراب والمحاسبة والتقارير الاستراتيجية.',
      icon: Shield,
      color: 'border-[#333336] bg-[#1d1d1f] text-white'
    },
    {
      role: 'procurement' as UserRole,
      title: 'مسؤول المشتريات والوارد',
      desc: 'إدخال حركة الأوزان الواردة، تسجيل فواتير الشراء، وإدارة الموردين.',
      icon: Scale,
      color: 'border-[#333336] bg-[#1d1d1f] text-white'
    },
    {
      role: 'sales' as UserRole,
      title: 'مدير المبيعات والصادر',
      desc: 'إصدار فواتير البيع للصادر، متابعة العملاء، والتحقق من أرصدة المخازن.',
      icon: DollarSign,
      color: 'border-[#333336] bg-[#1d1d1f] text-white'
    },
    {
      role: 'accounting' as UserRole,
      title: 'الحسابات والتسويات',
      desc: 'إجراء تسويات الذمم المالية، كشوفات الحساب، ومطابقة الأرباح والبورصة.',
      icon: Users,
      color: 'border-[#333336] bg-[#1d1d1f] text-white'
    }
  ];

  return (
    <div id="login-container" className="min-h-screen flex items-center justify-center bg-black text-[#f5f5f7] font-sans p-4 sm:p-6" dir="rtl">
      <div id="login-card-wrapper" className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 my-auto">
        
        {/* Left/Intro Section - Super Clean Apple Typography */}
        <div id="login-info-section" className="col-span-1 lg:col-span-5 flex flex-col justify-center text-center lg:text-right pr-2">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
            <div className="p-3 bg-[#1d1d1f] border border-[#333336] rounded-2xl">
              <Hammer id="hero-icon" className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 id="app-title" className="text-xl font-bold tracking-tight text-white">مؤسسة الهضبة للمعادن</h1>
              <p id="app-subtitle" className="text-[10px] text-[#86868b] uppercase tracking-widest font-mono">Scrap Management System</p>
            </div>
          </div>
          <h2 id="hero-message" className="text-3xl font-semibold mb-4 leading-normal tracking-tight text-white">نظام متكامل لإدارة وحوكمة تجارة خردة المعادن بمصر</h2>
          <p id="hero-description" className="text-[#86868b] text-xs leading-relaxed mb-6 font-medium">
            بوابة رقمية مصممة للتحكم السلس بساحات الوزن البسكول، تعقب فواتير الوارد والصادر، ومطابقة كشوفات حساب الموردين والعملاء وفق مؤشرات البورصة اليومية.
          </p>
          <div id="quick-roles-hint" className="hidden lg:block text-[11px] text-[#86868b] border-t border-[#333336] pt-4 font-mono">
            * اضغط مباشرة على الدور المطلوب تفعيله، ثم انقر على "دخول آمن للوحة التحكم".
          </div>
        </div>

        {/* Right/Form Section - Absolute Sleek Apple Matte Card */}
        <div id="login-form-section" className="col-span-1 lg:col-span-7 bg-[#161617] border border-[#333336] p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          
          <h3 id="form-heading" className="text-lg font-semibold mb-1 text-white">تسجيل الدخول للموظفين</h3>
          <p id="form-subheading" className="text-xs text-[#86868b] mb-6">يرجى اختيار الحساب والوصول الوظيفي لبدء العمل</p>

          <form onSubmit={handleSubmit} id="credentials-form" className="space-y-6">
            
            {/* Pick your role */}
            <div id="role-selector-group" className="space-y-3">
              <label id="role-label" className="text-[11px] font-bold text-[#86868b] block">الوظيفة والدور الرقابي المعتمد:</label>
              <div id="roles-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rolesConfig.map((item) => {
                  const Icon = item.icon;
                  const isSelected = role === item.role;
                  return (
                    <button
                      id={`role-btn-${item.role}`}
                      key={item.role}
                      type="button"
                      onClick={() => {
                        setRole(item.role);
                        setUsername(item.role);
                      }}
                      className={`text-right p-3.5 rounded-2xl border text-xs transition-all duration-200 flex items-start gap-3 ${
                        isSelected 
                          ? `border-[#0071e3] bg-[#0071e3]/10 text-white` 
                          : 'border-[#333336] bg-[#1d1d1f] text-[#86868b] hover:border-[#424245] hover:text-white'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-[#0071e3] text-white' : 'bg-[#161617] text-[#86868b]'}`}>
                        <Icon id={`role-icon-${item.role}`} className="w-4 h-4" />
                      </div>
                      <div>
                        <div id={`role-title-${item.role}`} className="font-bold text-white text-xs">{item.title}</div>
                        <div id={`role-desc-${item.role}`} className="text-[#86868b] text-[10px] leading-relaxed mt-1">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated username */}
            <div id="username-group" className="space-y-2">
              <label id="username-label" className="text-[11px] font-bold text-[#86868b] block">مُعرف الموظف أو الاسم الشخصي:</label>
              <input
                id="username-input"
                type="text"
                placeholder="اتركه فارغاً للدخول التلقائي بالاسم الافتراضي"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#1d1d1f] border border-[#333336] rounded-2xl px-4 py-3 text-xs text-white focus:border-[#0071e3] focus:outline-none transition-colors font-mono"
                dir="rtl"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="w-full bg-[#0071e3] hover:bg-[#147ce5] text-white font-medium py-3 px-6 rounded-full text-center text-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.982]"
            >
              <LogIn id="btn-login-icon" className="w-3.5 h-3.5" />
              <span>دخول آمن إلى لوحة التحكم</span>
            </button>
          </form>
          
          <div id="system-status-indicator" className="mt-6 pt-4 border-t border-[#333336] flex items-center justify-between text-[11px] text-[#86868b] font-mono">
            <span>إصدار النظام: v2.4.0 (مستقر وعالي الأداء)</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              بيئة التشغيل مشفرة وآمنة بالكامل
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
