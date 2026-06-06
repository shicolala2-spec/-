/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Item, Supplier, Customer, DailyPrice, PurchaseInvoice, SaleInvoice, Payment, Expense } from '../types';

export const initialItems: Item[] = [
  {
    id: 'it-1',
    name: 'حديد تسليح خردة (Rebar Scrap)',
    type: 'iron',
    baseUnit: 'ton',
    active: true,
    description: 'حديد تسليح مستخرج من هدم المباني الإنشائية وصالح لإعادة صهر الصلب.'
  },
  {
    id: 'it-2',
    name: 'صاج حديد أسود ومجلفن (Iron Sheets)',
    type: 'iron',
    baseUnit: 'ton',
    active: true,
    description: 'مخلفات تقطيع الصاج بالمصانع وورش تصنيع الهياكل المعدنية.'
  },
  {
    id: 'it-3',
    name: 'نحاس أحمر كابلات (Bright Copper Wire)',
    type: 'copper',
    baseUnit: 'kg',
    active: true,
    description: 'نحاس أحمر نقي مقشر من كابلات الكهرباء ونصف نقي.'
  },
  {
    id: 'it-4',
    name: 'ألومنيوم خردة طري (Soft Scrap Aluminum)',
    type: 'aluminum',
    baseUnit: 'kg',
    active: true,
    description: 'قطاعات ألومنيوم وبقايا مطابخ خردة خالية من الشوائب والحديد.'
  },
  {
    id: 'it-5',
    name: 'ستانلس ستيل خردة 304 (Stainless Steel 304)',
    type: 'stainless',
    baseUnit: 'kg',
    active: true,
    description: 'مخلفات مصانع الأغذية والأدوات المنزلية مقاومة للصدأ.'
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'شركة المقاولات المصرية للسكك الحديدية',
    phone: '01012345678',
    address: 'الوراق، الجيزة',
    initialBalance: 0,
    currentBalance: 12500 // We owe them 12,500
  },
  {
    id: 'sup-2',
    name: 'مصنع الأمل للمنتجات المعدنية بمصر',
    phone: '01598765432',
    address: 'المنطقة الصناعية بالسادس من أكتوبر، الجيزة',
    initialBalance: 5000,
    currentBalance: 5000 // We owe them 5,000
  },
  {
    id: 'sup-3',
    name: 'المعلم أبو ناصر لتجميع خردة السبتية',
    phone: '01211122233',
    address: 'سوق السبتية، القاهرة',
    initialBalance: 0,
    currentBalance: 0 // Settled
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'شركة حديد عز والصلب المصرية',
    phone: '01123456789',
    address: 'المنطقة الصناعية بالدخيلة، الإسكندرية',
    initialBalance: 45000,
    currentBalance: 45000 // They owe us 45,000
  },
  {
    id: 'cust-2',
    name: 'مجموعة بشاي للصلب ودرفلة الحديد',
    phone: '01138765432',
    address: 'مدينة السادات الصناعية، المنوفية',
    initialBalance: 0,
    currentBalance: 8200 // They owe us 8,200
  },
  {
    id: 'cust-3',
    name: 'الشركة المصرية لتجارة الخامات المعدنية',
    phone: '01063334445',
    address: 'شبرا الخيمة، القليوبية',
    initialBalance: 0,
    currentBalance: 0 // Settled
  }
];

export const initialDailyPrices: DailyPrice[] = [
  // Prices for 2026-06-05
  { id: 'dp-1', date: '2026-06-05', itemId: 'it-1', buyPricePerTon: 1850, sellPricePerTon: 2100 },
  { id: 'dp-2', date: '2026-06-05', itemId: 'it-2', buyPricePerTon: 1500, sellPricePerTon: 1750 },
  { id: 'dp-3', date: '2026-06-05', itemId: 'it-3', buyPricePerTon: 28000, sellPricePerTon: 31000 },
  { id: 'dp-4', date: '2026-06-05', itemId: 'it-4', buyPricePerTon: 6500, sellPricePerTon: 7600 },
  { id: 'dp-5', date: '2026-06-05', itemId: 'it-5', buyPricePerTon: 4200, sellPricePerTon: 5100 },

  // Prices for 2026-06-06 (Current)
  { id: 'dp-6', date: '2026-06-06', itemId: 'it-1', buyPricePerTon: 1880, sellPricePerTon: 2120 },
  { id: 'dp-7', date: '2026-06-06', itemId: 'it-2', buyPricePerTon: 1520, sellPricePerTon: 1780 },
  { id: 'dp-8', date: '2026-06-06', itemId: 'it-3', buyPricePerTon: 28500, sellPricePerTon: 31500 },
  { id: 'dp-9', date: '2026-06-06', itemId: 'it-4', buyPricePerTon: 6600, sellPricePerTon: 7750 },
  { id: 'dp-10', date: '2026-06-06', itemId: 'it-5', buyPricePerTon: 4300, sellPricePerTon: 5200 }
];

export const initialPurchaseInvoices: PurchaseInvoice[] = [
  {
    id: 'pinv-1',
    invoiceNumber: 'PINV-260601',
    date: '2026-06-01',
    supplierId: 'sup-1',
    totalWeightKg: 12500, // 12.5 Tons
    totalAmount: 23125, // 12.5 * 1850 standard computed
    paymentType: 'credit',
    paidAmount: 10625,
    status: 'partial',
    notes: 'صفقة حديد تسليح مستعمل من موقع هدم برصيف الميناء القديم.',
    details: [
      {
        id: 'pdet-1',
        itemId: 'it-1',
        weightKg: 12500,
        pricePerTon: 1850,
        totalAmount: 23125
      }
    ]
  },
  {
    id: 'pinv-2',
    invoiceNumber: 'PINV-260603',
    date: '2026-06-03',
    supplierId: 'sup-3',
    totalWeightKg: 4200, // 4.2 Tons items
    totalAmount: 15330, // 1.2 Tons copper (1200 * 28 = 33600 per ton) and 3 Tons Rebar (3 * 1850 = 5550)
    paymentType: 'cash',
    paidAmount: 15330,
    status: 'paid',
    notes: 'شراء مباشر وتسليم ساحة الخردة بمستودع السبتية بالقاهرة.',
    details: [
      {
        id: 'pdet-2',
        itemId: 'it-1',
        weightKg: 3000,
        pricePerTon: 1850,
        totalAmount: 5550
      },
      {
        id: 'pdet-3',
        itemId: 'it-3',
        weightKg: 1200,
        pricePerTon: 28000, // 28 SAR/kg is 28000 per ton
        totalAmount: 33600 / 1000 * 1200 // 33600
        // Wait, 1200 kg is 1.2 tons. 1.2 * 28000 = 33,600.
        // Let's check math: 3000 kg Rebar * (1850/1000) = 5550.
        // 1200 kg Copper * (28000/1000) = 33600.
        // Total should be 5550 + 33600 = 39150! Let's update details and totals correctly to match perfectly.
      }
    ]
  }
];

// Let's refine the mock invoices so the calculations are perfect and easy:
initialPurchaseInvoices[1].totalAmount = 39150;
initialPurchaseInvoices[1].paidAmount = 39150;

// Add a credit purchase invoice
export const initialSaleInvoices: SaleInvoice[] = [
  {
    id: 'sinv-1',
    invoiceNumber: 'SINV-260602',
    date: '2026-06-02',
    customerId: 'cust-1',
    totalWeightKg: 10000, // 10 Tons
    totalAmount: 21000, // 10 * 2100 = 21000
    paymentType: 'credit',
    paidAmount: 0,
    status: 'unpaid',
    notes: 'توريد دفعة حديد تسليح للمقاول الرئيسي للمدينة الصناعية.',
    details: [
      {
        id: 'sdet-1',
        itemId: 'it-1',
        weightKg: 10000,
        pricePerTon: 2100,
        totalAmount: 21000
      }
    ]
  },
  {
    id: 'sinv-2',
    invoiceNumber: 'SINV-260604',
    date: '2026-06-04',
    customerId: 'cust-2',
    totalWeightKg: 2500, // 1.5 tons aluminum + 1 ton sheets
    totalAmount: 13150, // 1500 * (7600/1000) = 11400 + 1000 * (1750/1000) = 1750. Total = 13150
    paymentType: 'credit',
    paidAmount: 4950,
    status: 'partial',
    notes: 'تحميل فوري من الساحة.',
    details: [
      {
        id: 'sdet-2',
        itemId: 'it-4',
        weightKg: 1500,
        pricePerTon: 7600,
        totalAmount: 11400
      },
      {
        id: 'sdet-3',
        itemId: 'it-2',
        weightKg: 1000,
        pricePerTon: 1750,
        totalAmount: 1750
      }
    ]
  }
];

export const initialPayments: Payment[] = [
  {
    id: 'pay-1',
    partyType: 'supplier',
    partyId: 'sup-1',
    type: 'payment',
    amount: 10000,
    date: '2026-06-02',
    paymentMethod: 'bank',
    receiptNumber: 'REC-90081',
    notes: 'سداد دفعة تحت الحساب للتوريد الأخير.'
  },
  {
    id: 'pay-2',
    partyType: 'customer',
    partyId: 'cust-1',
    type: 'receipt',
    amount: 15000,
    date: '2026-06-05',
    paymentMethod: 'cash',
    receiptNumber: 'RCP-80011',
    notes: 'تحصيل دفعة مالية مقابل العقد السنوي لتوريد الحديد.'
  }
];

export const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    amount: 1500,
    category: 'Transportation',
    subCategory: 'وقود (سولار/بنزين)',
    description: 'وقود سيارات نقل السفر لتسليم الحديد',
    date: '2026-06-02',
    paymentMethod: 'cash',
    receiptNumber: 'EQ-1002',
    supplierName: 'محطة بنزين الوطنية',
    notes: 'وقود سيارة شاحنة جامبو رقم س ص ج 123',
    createdBy: 'أحمد حماد (المدير العام)',
    createdAt: '2026-06-02T12:00:00.000Z'
  },
  {
    id: 'exp-2',
    amount: 4500,
    category: 'Labor',
    subCategory: 'أجر يومي (عمال موسميين)',
    description: 'أعمال فرز وتنزيل حمولة خردة الوراق',
    date: '2026-06-03',
    paymentMethod: 'cash',
    receiptNumber: 'EQ-1003',
    supplierName: 'المعلم حميد مقاول الأنفار',
    notes: 'أجور عمال التفريغ والفرز اليدوي للحديد والزهر',
    createdBy: 'أحمد حماد (المدير العام)',
    createdAt: '2026-06-03T15:30:00.000Z'
  },
  {
    id: 'exp-3',
    amount: 3500,
    category: 'Maintenance',
    subCategory: 'صيانة معدات (كلاركات، لوادر)',
    description: 'صيانة دورية هيدروليكية لكلارك ساحة البسكول',
    date: '2026-06-05',
    paymentMethod: 'bank',
    receiptNumber: 'EQ-1004',
    supplierName: 'ورشة الهدى الميكانيكية',
    notes: 'تغيير خراطيم الزيت وصمام الضغط الرئيسي للكلارك الأصفر',
    createdBy: 'أحمد حماد (المدير العام)',
    createdAt: '2026-06-05T09:15:00.000Z'
  },
  {
    id: 'exp-4',
    amount: 1800,
    category: 'Transportation',
    subCategory: 'تحميل وتفريغ',
    description: 'أجرة عتالة وتصفيف صاج الحديد الأسود بالساحة',
    date: '2026-06-06',
    paymentMethod: 'cash',
    receiptNumber: 'EQ-1005',
    supplierName: 'عمال ساحة السبتية اليومية',
    notes: 'إكرامية وحافز عتالة وسرعة إخلاء لوادر الشحن للسيارات',
    createdBy: 'أحمد حماد (المدير العام)',
    createdAt: '2026-06-06T08:00:00.000Z'
  }
];

