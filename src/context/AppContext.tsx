/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, Item, Supplier, Customer, DailyPrice, PurchaseInvoice, SaleInvoice, Payment, 
  ItemType, BaseUnit, UserRole, StockStatus, WeightMovement, Expense,
  Bank, BankTransaction, BankTransactionType, CertificateOfDeposit, BankReconciliation,
  RecurringObligation, RecurringPaymentLog
} from '../types';
import { 
  initialItems, initialSuppliers, initialCustomers, initialDailyPrices, 
  initialPurchaseInvoices, initialSaleInvoices, initialPayments, initialExpenses
} from '../data/mockData';

interface AppContextType {
  user: User | null;
  items: Item[];
  suppliers: Supplier[];
  customers: Customer[];
  dailyPrices: DailyPrice[];
  purchaseInvoices: PurchaseInvoice[];
  saleInvoices: SaleInvoice[];
  payments: Payment[];
  expenses: Expense[];
  
  // Banks Management
  banks: Bank[];
  bankTransactions: BankTransaction[];
  certificatesOfDeposit: CertificateOfDeposit[];
  bankReconciliations: BankReconciliation[];

  // Recurring Management
  recurringObligations: RecurringObligation[];
  recurringPaymentLogs: RecurringPaymentLog[];
  
  // Auth
  login: (username: string, role: UserRole) => boolean;
  logout: () => void;
  
  // Items
  addItem: (name: string, type: ItemType, baseUnit: BaseUnit, description: string) => void;
  updateItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  
  // Suppliers
  addSupplier: (name: string, phone: string, address: string, initialBalance: number) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  
  // Customers
  addCustomer: (name: string, phone: string, address: string, initialBalance: number) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  
  // Daily Prices
  addDailyPrice: (itemId: string, buyPricePerTon: number, sellPricePerTon: number, date: string) => void;
  getLatestPrice: (itemId: string, date?: string) => { buy: number; sell: number } | null;
  
  // Invoices & Settlements
  addPurchaseInvoice: (supplierId: string, paymentType: 'cash' | 'credit', paidAmount: number, details: Array<{ itemId: string; weightKg: number; pricePerTon: number }>, notes: string, date: string) => string;
  addSaleInvoice: (customerId: string, paymentType: 'cash' | 'credit', paidAmount: number, details: Array<{ itemId: string; weightKg: number; pricePerTon: number }>, notes: string, date: string) => string;
  addPayment: (partyType: 'supplier' | 'customer', partyId: string, type: 'payment' | 'receipt', amount: number, paymentMethod: 'cash' | 'bank' | 'cheque', notes: string, date: string, receiptNumber?: string, bankId?: string) => void;
  
  deletePurchaseInvoice: (id: string) => void;
  deleteSaleInvoice: (id: string) => void;
  deletePayment: (id: string) => void;

  // Expenses
  addExpense: (expenseData: Omit<Expense, 'id' | 'createdBy' | 'createdAt'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  
  // Bank Functions
  addBank: (name: string, branch: string, accountNumber: string, accountName: string, currency: 'EGP' | 'USD', initialBalance: number, notes?: string) => void;
  updateBank: (bank: Bank) => void;
  deleteBank: (id: string) => void;
  addBankTransaction: (bankId: string, type: BankTransactionType, amount: number, date: string, description: string, notes?: string, referenceType?: BankTransaction['referenceType'], referenceId?: string) => void;
  deleteBankTransaction: (id: string) => void;
  addCertificateOfDeposit: (bankId: string, certificateNumber: string, amount: number, interestRate: number, issueDate: string, maturityDate: string, interestInterval: CertificateOfDeposit['interestInterval'], notes?: string) => void;
  updateCertificateStatus: (id: string, status: CertificateOfDeposit['status']) => void;
  deleteCertificateOfDeposit: (id: string) => void;
  addBankReconciliation: (bankId: string, statementDate: string, statementBalance: number, bookBalance: number, notes?: string) => void;
  deleteBankReconciliation: (id: string) => void;
  getBankBalance: (bankId: string) => number;

  // Recurring Obligation Functions
  addRecurringObligation: (obligation: Omit<RecurringObligation, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => void;
  updateRecurringObligation: (obligation: RecurringObligation) => void;
  deleteRecurringObligation: (id: string) => void;
  payRecurringObligation: (id: string, amount: number, date: string, periodText: string, notes?: string) => void;
  
  // Analytics and calculations (Dynamic)
  getStockStatus: () => StockStatus[];
  getSupplierBalance: (supplierId: string) => number;
  getCustomerBalance: (customerId: string) => number;
  getWeightMovements: () => WeightMovement[];
  getProfitAndLoss: (startDate?: string, endDate?: string) => {
    purchasesAmount: number;
    salesAmount: number;
    stockCostValue: number;
    directProfit: number;
    soldCost: number;
    expensesAmount: number;
    netProfit: number;
  };
  
  // Backup
  importBackup: (dataStr: string) => boolean;
  exportBackup: () => string;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Current user starting as Admin for rapid demo, but can login/logout
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('scrap_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role === 'admin' && (parsed.name || '').includes('عبد السلام')) {
          parsed.name = 'أحمد حماد (المدير العام)';
        }
        return parsed;
      } catch (e) {
        // ignore JSON parse error and fallback
      }
    }
    return {
      id: 'u-1',
      username: 'admin',
      name: 'أحمد حماد (المدير العام)',
      email: 'admin@scrapco.com',
      role: 'admin'
    };
  });

  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('scrap_items');
    return saved ? JSON.parse(saved) : initialItems;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('scrap_suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('scrap_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [dailyPrices, setDailyPrices] = useState<DailyPrice[]>(() => {
    const saved = localStorage.getItem('scrap_daily_prices');
    return saved ? JSON.parse(saved) : initialDailyPrices;
  });

  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => {
    const saved = localStorage.getItem('scrap_purchase_invoices');
    return saved ? JSON.parse(saved) : initialPurchaseInvoices;
  });

  const [saleInvoices, setSaleInvoices] = useState<SaleInvoice[]>(() => {
    const saved = localStorage.getItem('scrap_sale_invoices');
    return saved ? JSON.parse(saved) : initialSaleInvoices;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('scrap_payments');
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('scrap_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  // Banks states
  const defaultBanks: Bank[] = [
    {
      id: 'bnk-1',
      name: 'البنك الأهلي المصري',
      branch: 'فرع الساحة الرئيسي',
      accountNumber: '1002003004001',
      accountName: 'مؤسسة الهضبة للتجارة',
      currency: 'EGP',
      initialBalance: 150000,
      currentBalance: 150000,
      isActive: true,
      notes: 'الحساب الرئيسي للتعاملات الكبرى والتسويات المباشرة.',
      createdAt: '2026-06-01T12:00:00Z'
    },
    {
      id: 'bnk-2',
      name: 'بنك مصر',
      branch: 'فرع سوق السبتية',
      accountNumber: '2003004005002',
      accountName: 'مؤسسة الهضبة للتجارة',
      currency: 'EGP',
      initialBalance: 50000,
      currentBalance: 50000,
      isActive: true,
      notes: 'حساب مخصص للمصروفات النثرية والعمالة والشحن.',
      createdAt: '2026-06-02T12:00:00Z'
    }
  ];

  const [banks, setBanks] = useState<Bank[]>(() => {
    const saved = localStorage.getItem('scrap_banks');
    return saved ? JSON.parse(saved) : defaultBanks;
  });

  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(() => {
    const saved = localStorage.getItem('scrap_bank_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [certificatesOfDeposit, setCertificatesOfDeposit] = useState<CertificateOfDeposit[]>(() => {
    const saved = localStorage.getItem('scrap_certificates_of_deposit');
    return saved ? JSON.parse(saved) : [];
  });

  const [bankReconciliations, setBankReconciliations] = useState<BankReconciliation[]>(() => {
    const saved = localStorage.getItem('scrap_bank_reconciliations');
    return saved ? JSON.parse(saved) : [];
  });

  const defaultRecurringObligations: RecurringObligation[] = [
    {
      id: 're-1',
      title: 'إيجار ساحة الهضبة الرئيسية بالسبتية',
      description: 'عقد إيجار الأرض والساحة الكبرى لتخزين وتجهيز حديد التسليح وباقي الخردوات.',
      type: 'rent',
      expenseCategory: 'إيجارات',
      expenseSubCategory: 'إيجار مخزن/أرض',
      payeeType: 'landlord',
      payeeName: 'الحاج مصطفى السويفي (مالك الأرض)',
      amount: 25000,
      currency: 'EGP',
      paymentMethod: 'cash',
      rentDetails: {
        contractNumber: 'CON-2026-009',
        propertyType: 'land',
        propertyAddress: 'امتداد شارع ورشة المخارط، السبتية، القاهرة',
        startDate: '2026-01-01',
        endDate: '2028-12-31',
        depositAmount: 50000,
        increasePercentage: 10
      },
      frequency: 'monthly',
      dayOfMonth: 5,
      startDate: '2026-01-01',
      isActive: true,
      notificationDaysBefore: 5,
      autoCreateTransaction: false,
      createdBy: 'أحمد حماد (المدير العام)',
      createdAt: '2026-06-01T08:00:00Z',
      updatedAt: '2026-06-01T08:00:00Z'
    },
    {
      id: 're-2',
      title: 'قسط تمويل شراء لودر كاتربيلر 966',
      description: 'تمويل من البنك الأهلي المصري لشراء معدة تدوير وتحميل كتل الحديد الكبيرة بالساحة.',
      type: 'loan_installment',
      expenseCategory: 'حسابات بنكية',
      expenseSubCategory: 'أقساط قروض بنكية',
      payeeType: 'bank',
      payeeId: 'bnk-1',
      payeeName: 'البنك الأهلي المصري',
      amount: 35000,
      currency: 'EGP',
      paymentMethod: 'bank_transfer',
      bankAccountId: 'bnk-1',
      bankAccountName: 'البنك الأهلي المصري',
      loanDetails: {
        loanId: 'LN-CAT-9662',
        totalLoanAmount: 1200000,
        remainingAmount: 420000,
        startDate: '2025-01-01',
        endDate: '2027-12-31',
        interestRate: 14.5,
        totalInstallments: 36,
        paidInstallments: 17,
        remainingInstallments: 19
      },
      frequency: 'monthly',
      dayOfMonth: 10,
      startDate: '2025-01-10',
      isActive: true,
      notificationDaysBefore: 3,
      autoCreateTransaction: false,
      createdBy: 'أحمد حماد (المدير العام)',
      createdAt: '2026-06-01T09:00:00Z',
      updatedAt: '2026-06-01T09:00:00Z'
    },
    {
      id: 're-3',
      title: 'الرواتب والأجور الشهرية لعمال الساحة',
      description: 'إجمالي رواتب طاقم عمال التقطيع والتفريز والأمن وإدارة الساحة للشهر الجاري.',
      type: 'salary',
      expenseCategory: 'عمالة',
      expenseSubCategory: 'رواتب موظفين',
      payeeType: 'employee',
      payeeName: 'عمال وموظفي ساحة الهضبة',
      amount: 48000,
      currency: 'EGP',
      paymentMethod: 'cash',
      frequency: 'monthly',
      dayOfMonth: 28,
      startDate: '2026-01-28',
      isActive: true,
      notificationDaysBefore: 2,
      autoCreateTransaction: false,
      createdBy: 'أحمد حماد (المدير العام)',
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-01T10:00:00Z'
    }
  ];

  const defaultRecurringPaymentLogs: RecurringPaymentLog[] = [
    {
      id: 'rpl-1',
      obligationId: 're-1',
      amountPaid: 25000,
      paymentDate: '2026-06-05',
      paymentMethod: 'cash',
      notes: 'تم سداد إيجار الساحة نقداً للحاج مصطفى باليد، مستقلاً بوصل ورقي مفسر.',
      periodText: 'يونيو 2026',
      createdAt: '2026-06-05T10:00:00Z'
    }
  ];

  const [recurringObligations, setRecurringObligations] = useState<RecurringObligation[]>(() => {
    const saved = localStorage.getItem('scrap_recurring_obligations');
    return saved ? JSON.parse(saved) : defaultRecurringObligations;
  });

  const [recurringPaymentLogs, setRecurringPaymentLogs] = useState<RecurringPaymentLog[]>(() => {
    const saved = localStorage.getItem('scrap_recurring_payment_logs');
    return saved ? JSON.parse(saved) : defaultRecurringPaymentLogs;
  });

  // Save to persistence
  useEffect(() => {
    localStorage.setItem('scrap_recurring_obligations', JSON.stringify(recurringObligations));
  }, [recurringObligations]);

  useEffect(() => {
    localStorage.setItem('scrap_recurring_payment_logs', JSON.stringify(recurringPaymentLogs));
  }, [recurringPaymentLogs]);

  useEffect(() => {
    localStorage.setItem('scrap_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('scrap_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('scrap_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('scrap_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('scrap_daily_prices', JSON.stringify(dailyPrices));
  }, [dailyPrices]);

  useEffect(() => {
    localStorage.setItem('scrap_purchase_invoices', JSON.stringify(purchaseInvoices));
  }, [purchaseInvoices]);

  useEffect(() => {
    localStorage.setItem('scrap_sale_invoices', JSON.stringify(saleInvoices));
  }, [saleInvoices]);

  useEffect(() => {
    localStorage.setItem('scrap_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('scrap_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('scrap_banks', JSON.stringify(banks));
  }, [banks]);

  useEffect(() => {
    localStorage.setItem('scrap_bank_transactions', JSON.stringify(bankTransactions));
  }, [bankTransactions]);

  useEffect(() => {
    localStorage.setItem('scrap_certificates_of_deposit', JSON.stringify(certificatesOfDeposit));
  }, [certificatesOfDeposit]);

  useEffect(() => {
    localStorage.setItem('scrap_bank_reconciliations', JSON.stringify(bankReconciliations));
  }, [bankReconciliations]);

  // Auth Functions
  const login = (username: string, role: UserRole): boolean => {
    const names = {
      admin: 'أحمد حماد (المدير العام)',
      procurement: 'أحمد مرزوق (مسؤول المشتريات)',
      sales: 'ياسر القحطاني (مدير المبيعات)',
      accounting: 'سامي الخالدي (المحاسب المالي)'
    };
    
    const loggedUser: User = {
      id: `u-${Date.now()}`,
      username: username.toLowerCase() || role,
      name: names[role],
      email: `${role}@scrapco.com`,
      role
    };
    setUser(loggedUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  // Item CRUD
  const addItem = (name: string, type: ItemType, baseUnit: BaseUnit, description: string) => {
    const newItem: Item = {
      id: `it-${Date.now()}`,
      name,
      type,
      baseUnit,
      active: true,
      description
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (updated: Item) => {
    setItems(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Supplier CRUD
  const addSupplier = (name: string, phone: string, address: string, initialBalance: number) => {
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name,
      phone,
      address,
      initialBalance,
      currentBalance: initialBalance
    };
    setSuppliers(prev => [...prev, newSup]);
  };

  const updateSupplier = (updated: Supplier) => {
    setSuppliers(prev => prev.map(sup => sup.id === updated.id ? updated : sup));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(sup => sup.id !== id));
  };

  // Customer CRUD
  const addCustomer = (name: string, phone: string, address: string, initialBalance: number) => {
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name,
      phone,
      address,
      initialBalance,
      currentBalance: initialBalance
    };
    setCustomers(prev => [...prev, newCust]);
  };

  const updateCustomer = (updated: Customer) => {
    setCustomers(prev => prev.map(cust => cust.id === updated.id ? updated : cust));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(cust => cust.id !== id));
  };

  // Daily Prices
  const addDailyPrice = (itemId: string, buyPricePerTon: number, sellPricePerTon: number, date: string) => {
    const id = `dp-${Date.now()}`;
    // Check if entry already exists for that item and date, and update if so
    setDailyPrices(prev => {
      const filtered = prev.filter(dp => !(dp.itemId === itemId && dp.date === date));
      return [...filtered, { id, date, itemId, buyPricePerTon, sellPricePerTon }];
    });
  };

  const getLatestPrice = (itemId: string, date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    // Find price on this specific date, or fall back to the most recent price chronologically
    const pricesForTarget = dailyPrices.filter(dp => dp.itemId === itemId && dp.date <= targetDate);
    if (pricesForTarget.length === 0) {
      // Fallback to any latest price available
      const allForTarget = dailyPrices.filter(dp => dp.itemId === itemId);
      if (allForTarget.length === 0) return { buy: 2000, sell: 2300 }; // baseline safe default
      return {
        buy: allForTarget[allForTarget.length - 1].buyPricePerTon,
        sell: allForTarget[allForTarget.length - 1].sellPricePerTon
      };
    }
    // Sort descending by date
    const sorted = [...pricesForTarget].sort((a, b) => b.date.localeCompare(a.date));
    return { buy: sorted[0].buyPricePerTon, sell: sorted[0].sellPricePerTon };
  };

  // Supplier dynamic ledger balance
  const getSupplierBalance = (supplierId: string): number => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return 0;

    const invoices = purchaseInvoices.filter(inv => inv.supplierId === supplierId);
    const totalPurchased = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaidAtInvoicing = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalLaterPayments = payments
      .filter(p => p.partyType === 'supplier' && p.partyId === supplierId && p.type === 'payment')
      .reduce((sum, p) => sum + p.amount, 0);

    // Initial debt + purchased debt created - later settlements
    return supplier.initialBalance + totalPurchased - totalPaidAtInvoicing - totalLaterPayments;
  };

  // Customer dynamic ledger balance
  const getCustomerBalance = (customerId: string): number => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return 0;

    const invoices = saleInvoices.filter(inv => inv.customerId === customerId);
    const totalSold = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaidAtInvoicing = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalLaterReceipts = payments
      .filter(p => p.partyType === 'customer' && p.partyId === customerId && p.type === 'receipt')
      .reduce((sum, p) => sum + p.amount, 0);

    // Initial debit + sales credit created - subsequent collections
    return customer.initialBalance + totalSold - totalPaidAtInvoicing - totalLaterReceipts;
  };

  // Stock status dynamic calculation (Weighted Average Cost method)
  const getStockStatus = (): StockStatus[] => {
    return items.map(item => {
      // Find all purchase details for this item
      let totalPurchasedWeight = 0;
      let totalPurchasedCost = 0;

      purchaseInvoices.forEach(inv => {
        inv.details.forEach(det => {
          if (det.itemId === item.id) {
            totalPurchasedWeight += det.weightKg;
            totalPurchasedCost += det.totalAmount;
          }
        });
      });

      // Find all sales details for this item
      let totalSoldWeight = 0;
      saleInvoices.forEach(inv => {
        inv.details.forEach(det => {
          if (det.itemId === item.id) {
            totalSoldWeight += det.weightKg;
          }
        });
      });

      // Calculate weight remaing in stock (never let it dip below zero theoretically, but handle if so)
      const totalWeightKg = Math.max(0, totalPurchasedWeight - totalSoldWeight);

      // Weighted Average Purchase Price per Ton
      let avgPurchasePricePerTon = 0;
      if (totalPurchasedWeight > 0) {
        avgPurchasePricePerTon = (totalPurchasedCost / totalPurchasedWeight) * 1000;
      } else {
        // Fallback to today's purchase price
        avgPurchasePricePerTon = getLatestPrice(item.id)?.buy || 1500;
      }

      // Stock cost value
      const totalValue = (totalWeightKg / 1000) * avgPurchasePricePerTon;

      return {
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        totalWeightKg,
        avgPurchasePricePerTon,
        totalValue
      };
    });
  };

  // Comprehensive tracking of weight entries in & out
  const getWeightMovements = (): WeightMovement[] => {
    const movements: WeightMovement[] = [];

    // Purchase Inward Movements
    purchaseInvoices.forEach(inv => {
      const supplierName = suppliers.find(s => s.id === inv.supplierId)?.name || 'مورد غير معروف';
      inv.details.forEach(det => {
        movements.push({
          id: `wmov-p-${det.id}`,
          itemId: det.itemId,
          date: inv.date,
          type: 'in',
          weightKg: det.weightKg,
          referenceType: 'purchase',
          referenceId: inv.id,
          description: `شراء بموجب فاتورة رقم ${inv.invoiceNumber} من ${supplierName}`
        });
      });
    });

    // Sale Outward Movements
    saleInvoices.forEach(inv => {
      const customerName = customers.find(c => c.id === inv.customerId)?.name || 'عميل غير معروف';
      inv.details.forEach(det => {
        movements.push({
          id: `wmov-s-${det.id}`,
          itemId: det.itemId,
          date: inv.date,
          type: 'out',
          weightKg: det.weightKg,
          referenceType: 'sale',
          referenceId: inv.id,
          description: `بيع بموجب فاتورة رقم ${inv.invoiceNumber} للعميل ${customerName}`
        });
      });
    });

    // Sort by date descending
    return movements.sort((a, b) => b.date.localeCompare(a.date));
  };

  // Invoices actions
  const addPurchaseInvoice = (
    supplierId: string, 
    paymentType: 'cash' | 'credit', 
    paidAmount: number, 
    details: Array<{ itemId: string; weightKg: number; pricePerTon: number }>, 
    notes: string,
    date: string
  ): string => {
    const invoiceId = `pinv-${Date.now()}`;
    const dateFormatted = date || new Date().toISOString().split('T')[0];
    const serial = String(purchaseInvoices.length + 1).padStart(4, '0');
    const invoiceNumber = `PINV-${dateFormatted.replace(/-/g, '').slice(2)}-${serial}`;

    const parsedDetails = details.map((det, index) => {
      // Amount is weight in tons * price per ton. (weightKg / 1000) * pricePerTon
      const totalAmount = (det.weightKg / 1000) * det.pricePerTon;
      return {
        id: `pdet-${invoiceId}-${index}`,
        itemId: det.itemId,
        weightKg: det.weightKg,
        pricePerTon: det.pricePerTon,
        totalAmount
      };
    });

    const totalWeightKg = parsedDetails.reduce((sum, d) => sum + d.weightKg, 0);
    const totalAmount = parsedDetails.reduce((sum, d) => sum + d.totalAmount, 0);
    
    // Status resolution
    let finalPaidAmount = paidAmount;
    if (paymentType === 'cash') {
      finalPaidAmount = totalAmount;
    }
    
    const status = finalPaidAmount >= totalAmount ? 'paid' : (finalPaidAmount > 0 ? 'partial' : 'unpaid');

    const newInvoice: PurchaseInvoice = {
      id: invoiceId,
      invoiceNumber,
      date: dateFormatted,
      supplierId,
      totalWeightKg,
      totalAmount,
      paymentType,
      paidAmount: finalPaidAmount,
      status,
      notes,
      details: parsedDetails
    };

    setPurchaseInvoices(prev => [newInvoice, ...prev]);
    return invoiceId;
  };

  const addSaleInvoice = (
    customerId: string, 
    paymentType: 'cash' | 'credit', 
    paidAmount: number, 
    details: Array<{ itemId: string; weightKg: number; pricePerTon: number }>, 
    notes: string,
    date: string
  ): string => {
    const invoiceId = `sinv-${Date.now()}`;
    const dateFormatted = date || new Date().toISOString().split('T')[0];
    const serial = String(saleInvoices.length + 1).padStart(4, '0');
    const invoiceNumber = `SINV-${dateFormatted.replace(/-/g, '').slice(2)}-${serial}`;

    const parsedDetails = details.map((det, index) => {
      const totalAmount = (det.weightKg / 1000) * det.pricePerTon;
      return {
        id: `sdet-${invoiceId}-${index}`,
        itemId: det.itemId,
        weightKg: det.weightKg,
        pricePerTon: det.pricePerTon,
        totalAmount
      };
    });

    const totalWeightKg = parsedDetails.reduce((sum, d) => sum + d.weightKg, 0);
    const totalAmount = parsedDetails.reduce((sum, d) => sum + d.totalAmount, 0);
    
    // Status resolution
    let finalPaidAmount = paidAmount;
    if (paymentType === 'cash') {
      finalPaidAmount = totalAmount;
    }

    const status = finalPaidAmount >= totalAmount ? 'paid' : (finalPaidAmount > 0 ? 'partial' : 'unpaid');

    const newInvoice: SaleInvoice = {
      id: invoiceId,
      invoiceNumber,
      date: dateFormatted,
      customerId,
      totalWeightKg,
      totalAmount,
      paymentType,
      paidAmount: finalPaidAmount,
      status,
      notes,
      details: parsedDetails
    };

    setSaleInvoices(prev => [newInvoice, ...prev]);
    return invoiceId;
  };

  // Payments / Settlement
  const addPayment = (
    partyType: 'supplier' | 'customer',
    partyId: string,
    type: 'payment' | 'receipt',
    amount: number,
    paymentMethod: 'cash' | 'bank' | 'cheque',
    notes: string,
    date: string,
    receiptNumber?: string,
    bankId?: string
  ) => {
    const id = `pay-${Date.now()}`;
    const finalReceiptNumber = receiptNumber || `${partyType === 'supplier' ? 'PAY' : 'REC'}-${String(payments.length + 1).padStart(5, '0')}`;
    
    const newPayment: Payment = {
      id,
      partyType,
      partyId,
      type,
      amount,
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod,
      notes,
      receiptNumber: finalReceiptNumber,
      bankId
    };

    setPayments(prev => [newPayment, ...prev]);

    // Automatically trigger a BankTransaction if bankId is passed
    if (bankId && (paymentMethod === 'bank' || paymentMethod === 'cheque')) {
      const partyName = partyType === 'supplier' 
        ? (suppliers.find(s => s.id === partyId)?.name || 'مورد')
        : (customers.find(c => c.id === partyId)?.name || 'عميل');
      
      const btxType: BankTransactionType = type === 'payment' ? 'withdraw' : 'deposit';
      const btxDesc = type === 'payment'
        ? `سداد دفعة للمورد ${partyName} بموجب سند رقم ${finalReceiptNumber}`
        : `تحصيل دفعة من العميل ${partyName} بموجب سند رقم ${finalReceiptNumber}`;
      
      addBankTransaction(
        bankId,
        btxType,
        amount,
        date || new Date().toISOString().split('T')[0],
        btxDesc,
        notes,
        'payment',
        id
      );
    }
  };

  const deletePurchaseInvoice = (id: string) => {
    setPurchaseInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const deleteSaleInvoice = (id: string) => {
    setSaleInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    setBankTransactions(prev => prev.filter(tx => !(tx.referenceType === 'payment' && tx.referenceId === id)));
  };

  // Expenses CRUD
  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdBy' | 'createdAt'>) => {
    const id = `exp-${Date.now()}`;
    const newExpense: Expense = {
      ...expenseData,
      id,
      createdBy: user?.name || 'مستخدم النظام',
      createdAt: new Date().toISOString()
    };
    setExpenses(prev => [newExpense, ...prev]);

    // Automatically trigger a BankTransaction if expense has bankId passed
    if (expenseData.bankId && (expenseData.paymentMethod === 'bank' || expenseData.paymentMethod === 'cheque')) {
      const btxDesc = `صرف مصروف تشغيلي: ${expenseData.category} - ${expenseData.subCategory || ''}. ${expenseData.description || ''}`;
      addBankTransaction(
        expenseData.bankId,
        'withdraw',
        expenseData.amount,
        expenseData.date,
        btxDesc,
        expenseData.notes,
        'expense',
        id
      );
    }
  };

  const updateExpense = (updated: Expense) => {
    setExpenses(prev => prev.map(exp => exp.id === updated.id ? updated : exp));
    if (updated.bankId && (updated.paymentMethod === 'bank' || updated.paymentMethod === 'cheque')) {
      setBankTransactions(prev => {
        const filtered = prev.filter(tx => !(tx.referenceType === 'expense' && tx.referenceId === updated.id));
        const newTx: BankTransaction = {
          id: `btx-u-${Date.now()}`,
          bankId: updated.bankId!,
          type: 'withdraw',
          amount: updated.amount,
          date: updated.date,
          referenceType: 'expense',
          referenceId: updated.id,
          description: `تعديل مصروف تشغيلي: ${updated.category} - ${updated.subCategory || ''}. ${updated.description || ''}`,
          notes: updated.notes,
          createdAt: new Date().toISOString()
        };
        return [newTx, ...filtered];
      });
    } else {
      setBankTransactions(prev => prev.filter(tx => !(tx.referenceType === 'expense' && tx.referenceId === updated.id)));
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    setBankTransactions(prev => prev.filter(tx => !(tx.referenceType === 'expense' && tx.referenceId === id)));
  };

  // Bank Actions Implementation
  const addBank = (
    name: string,
    branch: string,
    accountNumber: string,
    accountName: string,
    currency: 'EGP' | 'USD',
    initialBalance: number,
    notes?: string
  ) => {
    const newBank: Bank = {
      id: `bnk-${Date.now()}`,
      name,
      branch,
      accountNumber,
      accountName,
      currency,
      initialBalance,
      currentBalance: initialBalance,
      isActive: true,
      notes,
      createdAt: new Date().toISOString()
    };
    setBanks(prev => [...prev, newBank]);
  };

  const updateBank = (updated: Bank) => {
    setBanks(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const deleteBank = (id: string) => {
    setBanks(prev => prev.filter(b => b.id !== id));
  };

  const addBankTransaction = (
    bankId: string,
    type: BankTransactionType,
    amount: number,
    date: string,
    description: string,
    notes?: string,
    referenceType?: BankTransaction['referenceType'],
    referenceId?: string
  ) => {
    const newTx: BankTransaction = {
      id: `btx-${Date.now()}`,
      bankId,
      type,
      amount,
      date: date || new Date().toISOString().split('T')[0],
      referenceType,
      referenceId,
      description,
      notes,
      createdAt: new Date().toISOString()
    };
    setBankTransactions(prev => [newTx, ...prev]);
  };

  const deleteBankTransaction = (id: string) => {
    setBankTransactions(prev => prev.filter(bt => bt.id !== id));
  };

  const addCertificateOfDeposit = (
    bankId: string,
    certificateNumber: string,
    amount: number,
    interestRate: number,
    issueDate: string,
    maturityDate: string,
    interestInterval: CertificateOfDeposit['interestInterval'],
    notes?: string
  ) => {
    const newCD: CertificateOfDeposit = {
      id: `mcd-${Date.now()}`,
      bankId,
      certificateNumber,
      amount,
      interestRate,
      issueDate,
      maturityDate,
      interestInterval,
      status: 'active',
      notes,
      createdAt: new Date().toISOString()
    };
    setCertificatesOfDeposit(prev => [newCD, ...prev]);

    addBankTransaction(
      bankId,
      'withdraw',
      amount,
      issueDate,
      `ربط شهادة إيداع رقم ${certificateNumber} بنسبة ${interestRate}% في البنك`,
      notes,
      'certificate',
      newCD.id
    );
  };

  const updateCertificateStatus = (id: string, status: CertificateOfDeposit['status']) => {
    setCertificatesOfDeposit(prev => prev.map(cd => {
      if (cd.id === id) {
        const oldStatus = cd.status;
        if (oldStatus === 'active' && status === 'redeemed') {
          addBankTransaction(
            cd.bankId,
            'deposit',
            cd.amount,
            new Date().toISOString().split('T')[0],
            `استرداد شهادة إيداع مستحقة رقم ${cd.certificateNumber}`,
            `تم الاسترداد للمحفظة البنكية`,
            'certificate',
            cd.id
          );
        }
        return { ...cd, status };
      }
      return cd;
    }));
  };

  const deleteCertificateOfDeposit = (id: string) => {
    setCertificatesOfDeposit(prev => prev.filter(c => c.id !== id));
  };

  const addBankReconciliation = (
    bankId: string,
    statementDate: string,
    statementBalance: number,
    bookBalance: number,
    notes?: string
  ) => {
    const diff = statementBalance - bookBalance;
    const newRec: BankReconciliation = {
      id: `brec-${Date.now()}`,
      bankId,
      statementDate,
      statementBalance,
      bookBalance,
      differenceAmount: diff,
      reconciled: Math.abs(diff) < 0.01,
      reconciledBy: user?.name || 'مراقب الحسابات البديل',
      notes,
      createdAt: new Date().toISOString()
    };
    setBankReconciliations(prev => [newRec, ...prev]);
  };

  const deleteBankReconciliation = (id: string) => {
    setBankReconciliations(prev => prev.filter(r => r.id !== id));
  };

  const getBankBalance = (bankId: string): number => {
    const bank = banks.find(b => b.id === bankId);
    if (!bank) return 0;
    
    // Transactions sum
    const txs = bankTransactions.filter(t => t.bankId === bankId);
    const totalDeposits = txs
      .filter(t => t.type === 'deposit' || t.type === 'transfer_in' || t.type === 'interest')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = txs
      .filter(t => t.type === 'withdraw' || t.type === 'transfer_out' || t.type === 'bank_fees')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return bank.initialBalance + totalDeposits - totalWithdrawals;
  };

  const addRecurringObligation = (oblData: Omit<RecurringObligation, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    const newObl: RecurringObligation = {
      ...oblData,
      id: `re-${Date.now()}`,
      createdBy: user?.name || 'أحمد حماد (المدير العام)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setRecurringObligations(prev => [newObl, ...prev]);
  };

  const updateRecurringObligation = (updated: RecurringObligation) => {
    setRecurringObligations(prev => prev.map(obl => {
      if (obl.id === updated.id) {
        return {
          ...updated,
          updatedAt: new Date().toISOString()
        };
      }
      return obl;
    }));
  };

  const deleteRecurringObligation = (id: string) => {
    setRecurringObligations(prev => prev.filter(obl => obl.id !== id));
    setRecurringPaymentLogs(prev => prev.filter(log => log.obligationId !== id));
  };

  const payRecurringObligation = (id: string, amountPaid: number, paymentDate: string, periodText: string, notes?: string) => {
    const obligation = recurringObligations.find(obl => obl.id === id);
    if (!obligation) return;

    const paymentLogId = `rpl-${Date.now()}`;
    let linkedExpenseId: string | undefined = undefined;
    let linkedBankTransactionId: string | undefined = undefined;

    if (obligation.type === 'loan_installment') {
      const targetBankId = obligation.bankAccountId;
      if (targetBankId) {
        const txId = `tx-ob-${Date.now()}`;
        const desc = `سداد قسط تمويل/قرض: ${obligation.title} (${periodText})`;
        
        const newTx: BankTransaction = {
          id: txId,
          bankId: targetBankId,
          type: 'withdraw',
          amount: amountPaid,
          date: paymentDate,
          referenceType: 'expense',
          referenceId: id,
          description: desc,
          notes: notes,
          createdAt: new Date().toISOString()
        };
        
        setBankTransactions(prev => [newTx, ...prev]);
        linkedBankTransactionId = txId;
      }
      
      setRecurringObligations(prev => prev.map(obl => {
        if (obl.id === id && obl.loanDetails) {
          const paid = (obl.loanDetails.paidInstallments || 0) + 1;
          const remaining = Math.max(0, (obl.loanDetails.totalInstallments || 1) - paid);
          const remAmount = Math.max(0, (obl.loanDetails.remainingAmount || 0) - amountPaid);
          return {
            ...obl,
            loanDetails: {
              ...obl.loanDetails,
              paidInstallments: paid,
              remainingInstallments: remaining,
              remainingAmount: remAmount
            },
            updatedAt: new Date().toISOString()
          };
        }
        return obl;
      }));

    } else {
      const expId = `exp-ob-${Date.now()}`;
      
      const newExp: Expense = {
        id: expId,
        amount: amountPaid,
        category: obligation.expenseCategory || 'أخرى',
        subCategory: obligation.expenseSubCategory || undefined,
        description: `سداد التزام دوري: ${obligation.title} (${periodText})`,
        date: paymentDate,
        paymentMethod: (obligation.paymentMethod === 'bank_transfer' || obligation.paymentMethod === 'auto_debit') 
          ? 'bank' 
          : (obligation.paymentMethod === 'cheque' ? 'cheque' : 'cash'),
        bankId: obligation.bankAccountId || undefined,
        notes: notes || obligation.description,
        createdBy: user?.name || 'النظام التلقائي',
        createdAt: new Date().toISOString()
      };

      setExpenses(prev => [newExp, ...prev]);
      linkedExpenseId = expId;

      const targetBankId = obligation.bankAccountId;
      if (targetBankId && (obligation.paymentMethod === 'bank_transfer' || obligation.paymentMethod === 'auto_debit' || obligation.paymentMethod === 'cheque')) {
        const txId = `tx-exp-ob-${Date.now()}`;
        const desc = `خصم مصرفي - سداد ${obligation.title} (${periodText})`;
        
        const newTx: BankTransaction = {
          id: txId,
          bankId: targetBankId,
          type: 'withdraw',
          amount: amountPaid,
          date: paymentDate,
          referenceType: 'expense',
          referenceId: expId,
          description: desc,
          notes: notes,
          createdAt: new Date().toISOString()
        };

        setBankTransactions(prev => [newTx, ...prev]);
        linkedBankTransactionId = txId;
      }
      
      if (obligation.type === 'rent') {
        const todayStr = new Date().toISOString().split('T')[0];
        setRecurringObligations(prev => prev.map(obl => {
          if (obl.id === id) {
            return {
              ...obl,
              rentDetails: obl.rentDetails ? {
                ...obl.rentDetails,
                lastIncreaseDate: obl.rentDetails.lastIncreaseDate || todayStr
              } : undefined,
              updatedAt: new Date().toISOString()
            };
          }
          return obl;
        }));
      }
    }

    const newLog: RecurringPaymentLog = {
      id: paymentLogId,
      obligationId: id,
      amountPaid,
      paymentDate,
      paymentMethod: obligation.paymentMethod,
      bankAccountId: obligation.bankAccountId || undefined,
      notes,
      linkedExpenseId,
      linkedBankTransactionId,
      periodText,
      createdAt: new Date().toISOString()
    };

    setRecurringPaymentLogs(prev => [newLog, ...prev]);
  };

  // Profit and Loss calculations
  const getProfitAndLoss = (startDate?: string, endDate?: string) => {
    let salesAmount = 0;
    let purchasesAmount = 0;
    let soldCost = 0;

    // Filter purchase invoices in date range
    const filteredPurchases = purchaseInvoices.filter(inv => {
      if (startDate && inv.date < startDate) return false;
      if (endDate && inv.date > endDate) return false;
      return true;
    });

    // Filter sales invoices in date range
    const filteredSales = saleInvoices.filter(inv => {
      if (startDate && inv.date < startDate) return false;
      if (endDate && inv.date > endDate) return false;
      return true;
    });

    // Total Purchases inside the period
    purchasesAmount = filteredPurchases.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Total Sales inside the period
    salesAmount = filteredSales.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Dynamic Weighted Average Cost per Item at point of sale to find dynamic Profit Margins
    // Under FIFO or Dynamic Average purchase cost:
    const stockStatusList = getStockStatus();

    filteredSales.forEach(inv => {
      inv.details.forEach(det => {
        // Find the average purchase price per ton of this item
        const stockStatus = stockStatusList.find(s => s.itemId === det.itemId);
        const avgPricePerTon = stockStatus?.avgPurchasePricePerTon || getLatestPrice(det.itemId)?.buy || 1500;
        
        // Cost of this sold quantity = (weight / 1000) * avgPricePerTon
        const costValue = (det.weightKg / 1000) * avgPricePerTon;
        soldCost += costValue;
      });
    });

    // Profit margin = Sales - Cost of Goods Sold
    const directProfit = salesAmount - soldCost;

    // Filter expenses in date range
    const filteredExpenses = expenses.filter(exp => {
      if (startDate && exp.date < startDate) return false;
      if (endDate && exp.date > endDate) return false;
      return true;
    });

    const expensesAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = directProfit - expensesAmount;

    // Current remaining stock cost value
    const stockCostValue = stockStatusList.reduce((sum, s) => sum + s.totalValue, 0);

    return {
      purchasesAmount,
      salesAmount,
      stockCostValue,
      directProfit,
      soldCost,
      expensesAmount,
      netProfit
    };
  };

  // Backup and Import
  const exportBackup = (): string => {
    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      items,
      suppliers,
      customers,
      dailyPrices,
      purchaseInvoices,
      saleInvoices,
      payments,
      expenses,
      banks,
      bankTransactions,
      certificatesOfDeposit,
      bankReconciliations,
      recurringObligations,
      recurringPaymentLogs
    }, null, 2);
  };

  const importBackup = (dataStr: string): boolean => {
    try {
      const parsed = JSON.parse(dataStr);
      if (Array.isArray(parsed.items)) setItems(parsed.items);
      if (Array.isArray(parsed.suppliers)) setSuppliers(parsed.suppliers);
      if (Array.isArray(parsed.customers)) setCustomers(parsed.customers);
      if (Array.isArray(parsed.dailyPrices)) setDailyPrices(parsed.dailyPrices);
      if (Array.isArray(parsed.purchaseInvoices)) setPurchaseInvoices(parsed.purchaseInvoices);
      if (Array.isArray(parsed.saleInvoices)) setSaleInvoices(parsed.saleInvoices);
      if (Array.isArray(parsed.payments)) setPayments(parsed.payments);
      if (Array.isArray(parsed.expenses)) {
        setExpenses(parsed.expenses);
      } else {
        setExpenses([]);
      }
      if (Array.isArray(parsed.banks)) setBanks(parsed.banks);
      if (Array.isArray(parsed.bankTransactions)) setBankTransactions(parsed.bankTransactions);
      if (Array.isArray(parsed.certificatesOfDeposit)) setCertificatesOfDeposit(parsed.certificatesOfDeposit);
      if (Array.isArray(parsed.bankReconciliations)) setBankReconciliations(parsed.bankReconciliations);
      if (Array.isArray(parsed.recurringObligations)) setRecurringObligations(parsed.recurringObligations);
      if (Array.isArray(parsed.recurringPaymentLogs)) setRecurringPaymentLogs(parsed.recurringPaymentLogs);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const clearAllData = () => {
    setSuppliers([]);
    setCustomers([]);
    setPurchaseInvoices([]);
    setSaleInvoices([]);
    setPayments([]);
    setExpenses([]);
    setDailyPrices([]);
    setItems(initialItems);
    setBanks(defaultBanks);
    setBankTransactions([]);
    setCertificatesOfDeposit([]);
    setBankReconciliations([]);
    setRecurringObligations([]);
    setRecurringPaymentLogs([]);
  };

  return (
    <AppContext.Provider value={{
      user, items, suppliers, customers, dailyPrices, purchaseInvoices, saleInvoices, payments, expenses,
      banks, bankTransactions, certificatesOfDeposit, bankReconciliations,
      recurringObligations, recurringPaymentLogs,
      login, logout,
      addItem, updateItem, deleteItem,
      addSupplier, updateSupplier, deleteSupplier,
      addCustomer, updateCustomer, deleteCustomer,
      addDailyPrice, getLatestPrice,
      addPurchaseInvoice, addSaleInvoice, addPayment,
      deletePurchaseInvoice, deleteSaleInvoice, deletePayment,
      addExpense, updateExpense, deleteExpense,
      addBank, updateBank, deleteBank,
      addBankTransaction, deleteBankTransaction,
      addCertificateOfDeposit, updateCertificateStatus, deleteCertificateOfDeposit,
      addBankReconciliation, deleteBankReconciliation, getBankBalance,
      addRecurringObligation, updateRecurringObligation, deleteRecurringObligation, payRecurringObligation,
      getStockStatus, getSupplierBalance, getCustomerBalance, getWeightMovements, getProfitAndLoss,
      importBackup, exportBackup, clearAllData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
