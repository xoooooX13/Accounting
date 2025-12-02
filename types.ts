

export type Role = 'admin' | 'user' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  provider: 'email' | 'google';
  googleId?: string; // If signed up with Google
  createdAt: string;
  
  // Company Linking
  companyId: string | null; // e.g. "ST-2526" (The DB Name)
  companyName: string | null;
}

// Internal type for mock DB 'users' table
export interface DbUser extends User {
  passwordHash?: string; 
}

export type EntityType = 
  | 'receipts' | 'payments' | 'journal' | 'contra' 
  | 'sales' | 'purchases'
  | 'customers' | 'vendors' | 'banks' | 'inventory' | 'expenses' | 'payroll'
  | 'debit_credit_notes';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction extends BaseEntity {
  date: string;
  reference: string;
  partyName: string; // Customer or Vendor
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description?: string;
  type: EntityType;
}

export interface InventoryItem extends BaseEntity {
  sku: string;
  name: string;
  group: string; // COA Account ID (e.g. 1141)
  hsCode?: string;
  quantity: number; // Current Closing Quantity
  openingQuantity: number;
  unitPrice: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export type PartnerType = 'customer' | 'vendor' | 'bank';

export interface Partner extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  address: string;
  ntn?: string;
  strn?: string;
  cnic?: string;
  // Bank specific fields
  bankAccountNo?: string;
  branchCode?: string;
  
  balance: number;
  type: PartnerType;
  accountId: string; // Link to COA (e.g., 1121 for Customers)
  status: 'active' | 'inactive';
}

export interface KPI {
  label: string;
  value: string | number;
  change: number; // percentage
  trend: 'up' | 'down';
  color?: string;
}

export interface RevenueData {
  month: string;
  earning: number;
  expense: number;
}

export interface CompanyProfile {
  name: string;
  email: string;
  address: string;
  phone?: string;
  ntn?: string;
  strn?: string;
  cnic?: string;
  logoUrl?: string;
  fiscalYearStart?: string; // e.g. "2023-07-01"
}

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  level: 1 | 2 | 3 | 4;
  parentId?: string;
  balance: number;
  description?: string;
  isSystem?: boolean; // Prevent deletion of core structure
}

// --- TAX TYPES ---
export type TaxType = 'GST' | 'WHT' | 'Income Tax';

export interface TaxSetting extends BaseEntity {
  name: string;
  type: TaxType;
  rate: number;
  status: 'Active' | 'Inactive';
}

// --- SALES TYPES ---
export type SalesType = 'Cash' | 'Credit';
export type InvoiceStatus = 'Draft' | 'Posted' | 'Paid' | 'Overdue';

export interface SalesInvoiceItem {
  id: string;
  inventoryItemId: string;
  description: string;
  quantity: number;
  rate: number;
  taxId?: string; // Optional tax rule
  taxRate: number; // Snapshot of rate at time of sale
  taxAmount: number;
  amount: number; // (Qty * Rate)
  rowTotal: number; // Amount + Tax
}

export interface SalesInvoice extends BaseEntity {
  invoiceNo: string;
  customerId: string; // Link to Partner
  date: string;
  dueDate: string;
  type: SalesType;
  isGst: boolean;
  items: SalesInvoiceItem[];
  
  // Totals
  subTotal: number;
  taxTotal: number;
  discount: number;
  grandTotal: number;
  
  notes?: string;
  status: InvoiceStatus;
}

// --- PURCHASE TYPES ---
export type PurchaseType = 'Cash' | 'Credit';
export type BillStatus = 'Draft' | 'Posted' | 'Paid' | 'Overdue';

export interface PurchaseBillItem {
  id: string;
  inventoryItemId: string;
  description: string;
  quantity: number;
  rate: number;
  taxId?: string;
  taxRate: number;
  taxAmount: number;
  amount: number;
  rowTotal: number;
}

export interface PurchaseBill extends BaseEntity {
  billNo: string;
  vendorId: string; // Link to Partner (Vendor)
  date: string;
  dueDate: string;
  type: PurchaseType;
  isGst: boolean;
  items: PurchaseBillItem[];
  
  subTotal: number;
  taxTotal: number;
  discount: number;
  grandTotal: number;
  
  notes?: string;
  status: BillStatus;
}

// --- DEBIT / CREDIT NOTES ---
export type NoteType = 'Debit Note' | 'Credit Note';

export interface DebitCreditNote extends BaseEntity {
  noteNo: string; // Auto Generated (DN-001 or CN-001)
  type: NoteType;
  date: string;
  partyId: string; // Vendor (for Debit Note) or Customer (for Credit Note)
  
  amount: number; // Base Amount
  isTaxable: boolean;
  taxId?: string;
  taxRate?: number;
  taxAmount: number;
  grandTotal: number;

  reason: string;
  status: 'Draft' | 'Posted';
}


// --- EXPENSE TYPES ---
export type ExpenseType = 'Direct' | 'Indirect';

export interface ExpenseRecord extends BaseEntity {
  voucherNo: string; // Auto-generated
  type: ExpenseType;
  date: string;
  amount: number;
  payee?: string;
  expenseAccountId: string; // Level 4 COA Expense Account
  description?: string;
  
  // Payment Details
  paymentMethod: PaymentMethod;
  chequeNo?: string;
  chequeDate?: string;

  // Linkage
  payFromId: string; // Direct -> Bank ID (Partner), Indirect -> Employee ID
  postedAccountId: string; // Auto-determined (Cash/Bank COA or Liability COA)
}

// --- RECEIPTS ---
export interface ReceiptRecord extends BaseEntity {
  voucherNo: string; // REC-001
  date: string;
  customerId: string; // Partner
  
  grossAmount: number; // Amount credited to customer
  isWht: boolean; // Is WHT deducted?
  taxId?: string;
  whtRate?: number;
  whtAmount: number; // Amount debited to Tax Receivable
  
  netAmount: number; // Amount debited to Bank (Gross - WHT)
  
  bankAccountId: string; // Partner (Type Bank)
  paymentMethod: PaymentMethod;
  chequeNo?: string;
  chequeDate?: string;
  
  description?: string;
  status: 'Posted' | 'Draft';
}

// --- PAYMENTS ---
export interface PaymentRecord extends BaseEntity {
  voucherNo: string; // PAY-001
  date: string;
  vendorId: string; // Partner
  
  grossAmount: number; // Amount debited to vendor
  isWht: boolean;
  taxId?: string;
  whtRate?: number;
  whtAmount: number; // Amount credited to Tax Payable
  
  netAmount: number; // Amount credited to Bank (Gross - WHT)
  
  bankAccountId: string; // Partner (Type Bank) - Pay From
  paymentMethod: PaymentMethod;
  chequeNo?: string;
  chequeDate?: string;
  
  description?: string;
  status: 'Posted' | 'Draft';
}

// --- JOURNAL VOUCHER ---
export interface JournalEntry {
  id: string;
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalVoucher extends BaseEntity {
  voucherNo: string; // JV-001
  date: string;
  description: string;
  entries: JournalEntry[];
  totalAmount: number; // Sum of Debits (must equal Sum of Credits)
  status: 'Posted' | 'Draft';
}

// --- CONTRA VOUCHER ---
export interface ContraVoucher extends BaseEntity {
  voucherNo: string; // CV-001
  date: string;
  description: string;
  
  fromAccountId: string; // Credit (Source) - Must be Bank/Cash
  toAccountId: string;   // Debit (Destination) - Must be Bank/Cash
  
  amount: number;
  paymentMethod: 'Cash' | 'Cheque' | 'Online Transfer';
  chequeNo?: string;
  status: 'Posted' | 'Draft';
}

// --- PAYROLL TYPES ---

export type Gender = 'Male' | 'Female' | 'Other';

export interface Designation extends BaseEntity {
  title: string;
}

export interface LeaveType extends BaseEntity {
  name: string;
  isPaid: boolean;
}

export interface PayrollGlobalSettings {
  defaultOvertimeRate: number;
  monthlyCutoffDay: number;
  customHolidays: string[]; // List of dates (YYYY-MM-DD) for current month/year
}

export interface Employee extends BaseEntity {
  employeeId: string; // Auto-generated
  name: string;
  email?: string;
  phone?: string;
  cnic?: string;
  fatherName?: string;
  gender: Gender;
  designationId: string;
  address?: string;
  basicSalary: number;
  dutyHours: 8 | 12; // 8 or 12 hours
  joiningDate: string;
  photoUrl?: string;
  status: 'Active' | 'Resigned' | 'Terminated';
  terminationDate?: string;
  terminationReason?: string;
}

export type PaymentMethod = 'Cash' | 'Cheque' | 'Online Transfer';

export interface AdvanceRecord extends BaseEntity {
  employeeId: string;
  date: string;
  amount: number;
  reason: string;
  payFromBankId: string; // ID from Partners (type=bank)
  paymentMethod: PaymentMethod;
  chequeNumber?: string;
  chequeDate?: string;
}

export interface LeaveRequest extends BaseEntity {
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason?: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface AttendanceRecord extends BaseEntity {
  employeeId: string;
  date: string;
  inTime: string; // HH:mm
  outTime: string; // HH:mm
  totalHours: string; // Calculated HH:mm
  status: 'Present' | 'Late' | 'Half Day' | 'Absent';
  
  // Auto-Calculated Overtime
  overtimeHours?: number;
  overtimeAmount?: number;
}
