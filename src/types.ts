/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'procurement' | 'sales' | 'accounting';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
}

export type ItemType = 'iron' | 'copper' | 'aluminum' | 'stainless' | 'other';
export type BaseUnit = 'kg' | 'ton';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  baseUnit: BaseUnit;
  active: boolean;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  initialBalance: number; // Positive means supplier expects money from us
  currentBalance: number; 
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  initialBalance: number; // Positive means customer owes us money
  currentBalance: number;
}

export interface DailyPrice {
  id: string;
  date: string; // YYYY-MM-DD
  itemId: string;
  buyPricePerTon: number;
  sellPricePerTon: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierId: string;
  totalWeightKg: number;
  totalAmount: number;
  paymentType: 'cash' | 'credit';
  paidAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  notes?: string;
  details: PurchaseDetail[];
}

export interface PurchaseDetail {
  id: string;
  itemId: string;
  weightKg: number;
  pricePerTon: number; // Standard pricing for scrap is per ton (1000 kg)
  totalAmount: number;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  totalWeightKg: number;
  totalAmount: number;
  paymentType: 'cash' | 'credit';
  paidAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  notes?: string;
  details: SaleDetail[];
}

export interface SaleDetail {
  id: string;
  itemId: string;
  weightKg: number;
  pricePerTon: number;
  totalAmount: number;
}

export interface Payment {
  id: string;
  partyType: 'supplier' | 'customer';
  partyId: string;
  type: 'payment' | 'receipt'; // payment: we pay supplier, receipt: customer pays us
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'bank' | 'cheque';
  receiptNumber?: string;
  notes?: string;
  bankId?: string;
}

export interface WeightMovement {
  id: string;
  itemId: string;
  date: string;
  type: 'in' | 'out';
  weightKg: number;
  referenceType: 'purchase' | 'sale' | 'adjustment';
  referenceId: string;
  description: string;
}

export interface StockStatus {
  itemId: string;
  itemName: string;
  itemType: ItemType;
  totalWeightKg: number;
  avgPurchasePricePerTon: number;
  totalValue: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  subCategory?: string;
  description?: string;
  date: string;
  paymentMethod: 'cash' | 'bank' | 'cheque';
  receiptNumber?: string;
  supplierName?: string;
  notes?: string;
  attachment?: string;
  createdBy: string;
  createdAt: string;
  bankId?: string;
}

export interface Bank {
  id: string;
  name: string;              // بنك مصر، الأهلي، QNB، CIB
  branch: string;            // فرع البنك
  accountNumber: string;     // رقم الحساب
  accountName: string;       // اسم صاحب الحساب
  currency: 'EGP' | 'USD';   // العملة
  initialBalance: number;    // الرصيد الافتتاحي
  currentBalance: number;    // الرصيد الحالي
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export type BankTransactionType = 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out' | 'bank_fees' | 'interest';

export interface BankTransaction {
  id: string;
  bankId: string;
  type: BankTransactionType;
  amount: number;
  date: string;               // YYYY-MM-DD
  referenceType?: 'payment' | 'receipt' | 'expense' | 'manual' | 'reconciliation' | 'certificate';
  referenceId?: string;       // ID for linked entity if any
  description: string;
  notes?: string;
  createdAt: string;
}

export interface CertificateOfDeposit {
  id: string;
  bankId: string;
  certificateNumber: string;
  amount: number;             // مبلغ الشهادة
  interestRate: number;       // نسبة الفائدة السنوية % (مثال: 19)
  issueDate: string;          // تاريخ الإصدار YYYY-MM-DD
  maturityDate: string;       // تاريخ الاستحقاق YYYY-MM-DD
  interestInterval: 'monthly' | 'quarterly' | 'annually' | 'maturity'; // دورية الصرف
  status: 'active' | 'redeemed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface BankReconciliation {
  id: string;
  bankId: string;
  statementDate: string;      // تاريخ كشف الحساب YYYY-MM-DD
  statementBalance: number;   // الرصيد في كشف الحساب الفعلي
  bookBalance: number;        // رصيد البنك في الدفاتر (النظام)
  differenceAmount: number;   // الفارق
  reconciled: boolean;
  reconciledBy: string;
  notes?: string;
  createdAt: string;
}

export interface RecurringObligation {
  id: string;
  title: string;                    // "قسط البنك الأهلي - سبتمبر", "إيجار مخزن العبور"
  description: string;              // وصف تفصيلي
  
  // نوع الالتزام
  type: "loan_installment" | "rent" | "salary" | "tax" | "insurance" | "subscription" | "other";
  
  // الفئة (للربط مع المصروفات)
  expenseCategory: string;          // إيجارات، عمالة، ضرائب، مرافق، أخرى
  expenseSubCategory: string;       // حسب الفئة (إيجار مخزن، رواتب شهرية، ضريبة قيمة مضافة...)
  
  // الجهة المستفيدة
  payeeType: "bank" | "landlord" | "employee" | "government" | "supplier" | "other";
  payeeId?: string;                  // ID البنك/المالك/الموظف
  payeeName: string;                // اسم الجهة
  
  // المبالغ
  amount: number;                   // المبلغ الشهري
  currency: "EGP" | "USD";
  
  // طريقة الدفع
  paymentMethod: "bank_transfer" | "cheque" | "cash" | "auto_debit";
  bankAccountId?: string;            // إذا كان دفع بنكي
  bankAccountName?: string;
  
  // معلومات القرض (إذا كان type = loan_installment)
  loanDetails?: {
    loanId: string;                 // رقم القرض
    totalLoanAmount: number;        // إجمالي القرض
    remainingAmount: number;        // المتبقي
    startDate: string;
    endDate: string;
    interestRate: number;           // نسبة الفائدة
    totalInstallments: number;      // عدد الأقساط الكلي
    paidInstallments: number;       // عدد الأقساط المدفوعة
    remainingInstallments: number;  // الأقساط المتبقية
  };
  
  // معلومات الإيجار (إذا كان type = rent)
  rentDetails?: {
    contractNumber: string;         // رقم عقد الإيجار
    propertyType: "warehouse" | "office" | "land" | "scale" | "other";
    propertyAddress: string;        // عنوان العقار
    startDate: string;              // بداية العقد
    endDate: string;                // نهاية العقد
    depositAmount: number;          // التأمين المدفوع
    increasePercentage: number;     // نسبة الزيادة السنوية
    lastIncreaseDate?: string;      // تاريخ آخر زيادة
  };
  
  // معلومات الضريبة (إذا كان type = tax)
  taxDetails?: {
    taxType: "vat" | "income" | "stamp" | "municipal";
    taxNumber: string;              // رقم التسجيل الضريبي
    vatPercentage?: number;         // نسبة الضريبة (للـ VAT)
    taxableAmount?: number;         // الوعاء الضريبي
  };
  
  // الإعدادات الدورية
  frequency: "monthly" | "quarterly" | "semi_annual" | "annual";
  dayOfMonth: number;               // اليوم من الشهر (1-31)
  startDate: string;                // تاريخ بداية الالتزام
  endDate?: string;                // تاريخ نهاية الالتزام (اختياري)
  isActive: boolean;                // هل الالتزام نشط؟
  
  // إشعارات
  notificationDaysBefore: number;   // إشعار قبل كم يوم (مثلاً 3 أيام)
  autoCreateTransaction: boolean;   // هل يتم إنشاء الحركة تلقائياً؟
  
  // إرفاق
  attachments?: Array<{              // صور العقد، مستندات القرض
    name: string;
    url: string;
  }>;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringPaymentLog {
  id: string;
  obligationId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: "bank_transfer" | "cheque" | "cash" | "auto_debit";
  bankAccountId?: string;
  notes?: string;
  linkedExpenseId?: string;
  linkedBankTransactionId?: string;
  periodText: string; // e.g. "يونيو 2026", "الربع الثالث 2026"
  createdAt: string;
}


