
import { 
  Transaction, InventoryItem, Partner, PartnerType, RevenueData, DbUser, Role, 
  CompanyProfile, ChartOfAccount, AccountType, TaxSetting,
  Employee, Designation, LeaveType, PayrollGlobalSettings, AdvanceRecord, LeaveRequest, AttendanceRecord,
  ExpenseRecord, SalesInvoice, SalesInvoiceItem, PurchaseBill, PurchaseBillItem, DebitCreditNote, ReceiptRecord, PaymentRecord,
  JournalVoucher, ContraVoucher, EntityType
} from '../types';

// ==========================================
// 1. SYSTEM CONSTANTS (Global)
// ==========================================
// This mimics the "users" sqlite database for all sign-ups
const USERS_DB_KEY = 'users_db'; 

const INITIAL_COA: ChartOfAccount[] = [
  // Assets
  { id: '1000', code: '1000', name: 'Assets', type: 'Asset', level: 1, balance: 0, isSystem: true },
  { id: '1100', code: '1100', name: 'Current Assets', type: 'Asset', level: 2, parentId: '1000', balance: 0, isSystem: true },
  { id: '1110', code: '1110', name: 'Cash & Cash Equivalents', type: 'Asset', level: 3, parentId: '1100', balance: 0, isSystem: true },
  { id: '1111', code: '1111', name: 'Cash & Banks', type: 'Asset', level: 4, parentId: '1110', balance: 0 },
  { id: '1120', code: '1120', name: 'Accounts Receivable', type: 'Asset', level: 3, parentId: '1100', balance: 0, isSystem: true },
  { id: '1121', code: '1121', name: 'Trade Receivables', type: 'Asset', level: 4, parentId: '1120', balance: 0 },
  { id: '1122', code: '1122', name: 'Employee Receivables', type: 'Asset', level: 4, parentId: '1120', balance: 0 },
  { id: '1123', code: '1123', name: 'Other Receivables', type: 'Asset', level: 4, parentId: '1120', balance: 0 },
  { id: '1130', code: '1130', name: 'Advances & Prepayments', type: 'Asset', level: 3, parentId: '1100', balance: 0, isSystem: true },
  { id: '1130001', code: '1130001', name: 'Supplier Advances', type: 'Asset', level: 4, parentId: '1130', balance: 0 },
  { id: '1132', code: '1132', name: 'Employees Advances', type: 'Asset', level: 4, parentId: '1130', balance: 0 },
  { id: '1130003', code: '1130003', name: 'Prepaid Rent', type: 'Asset', level: 4, parentId: '1130', balance: 0 },
  { id: '1130004', code: '1130004', name: 'Prepaid Insurance', type: 'Asset', level: 4, parentId: '1130', balance: 0 },
  { id: '1140', code: '1140', name: 'Inventory', type: 'Asset', level: 3, parentId: '1100', balance: 0, isSystem: true },
  { id: '1141', code: '1141', name: 'Raw Material', type: 'Asset', level: 4, parentId: '1140', balance: 0 },
  { id: '1142', code: '1142', name: 'Work in Process', type: 'Asset', level: 4, parentId: '1140', balance: 0 },
  { id: '1143', code: '1143', name: 'Finished Goods', type: 'Asset', level: 4, parentId: '1140', balance: 0 },
  { id: '1144', code: '1144', name: 'Packaging Materials', type: 'Asset', level: 4, parentId: '1140', balance: 0 },
  { id: '1145', code: '1145', name: 'Store & Spares', type: 'Asset', level: 4, parentId: '1140', balance: 0 },
  { id: '1150', code: '1150', name: 'Tax Receivables', type: 'Asset', level: 3, parentId: '1100', balance: 0, isSystem: true },
  { id: '1151', code: '1151', name: 'Withholding Tax Receivable', type: 'Asset', level: 4, parentId: '1150', balance: 0 },
  { id: '1152', code: '1152', name: 'Sales Tax Refundable', type: 'Asset', level: 4, parentId: '1150', balance: 0 },
  { id: '1153', code: '1153', name: 'Income Tax Refundable', type: 'Asset', level: 4, parentId: '1150', balance: 0 },
  
  { id: '1200', code: '1200', name: 'Non-Current Assets', type: 'Asset', level: 2, parentId: '1000', balance: 0, isSystem: true },
  { id: '1210', code: '1210', name: 'Property, Plant & Equipment', type: 'Asset', level: 3, parentId: '1200', balance: 0, isSystem: true },
  { id: '1211', code: '1211', name: 'Land & Building', type: 'Asset', level: 4, parentId: '1210', balance: 0 },
  { id: '1212', code: '1212', name: 'Furniture & Fixtures', type: 'Asset', level: 4, parentId: '1210', balance: 0 },
  { id: '1213', code: '1213', name: 'Office Equipment', type: 'Asset', level: 4, parentId: '1210', balance: 0 },
  { id: '1214', code: '1214', name: 'Computers & Laptops', type: 'Asset', level: 4, parentId: '1210', balance: 0 },
  { id: '1215', code: '1215', name: 'Vehicles', type: 'Asset', level: 4, parentId: '1210', balance: 0 },
  { id: '1216', code: '1216', name: 'Tools & Machinery', type: 'Asset', level: 4, parentId: '1210', balance: 0 },
  { id: '1217', code: '1217', name: 'Accumulated Depreciation', type: 'Asset', level: 4, parentId: '1210', balance: 0 },
  { id: '1230', code: '1230', name: 'Long Term Deposits', type: 'Asset', level: 3, parentId: '1200', balance: 0, isSystem: true },
  { id: '1231', code: '1231', name: 'Rent Security Deposit', type: 'Asset', level: 4, parentId: '1230', balance: 0 },

  // Liabilities
  { id: '2000', code: '2000', name: 'Liabilities', type: 'Liability', level: 1, balance: 0, isSystem: true },
  { id: '2100', code: '2100', name: 'Current Liabilities', type: 'Liability', level: 2, parentId: '2000', balance: 0, isSystem: true },
  { id: '2110', code: '2110', name: 'Accounts Payable', type: 'Liability', level: 3, parentId: '2100', balance: 0, isSystem: true },
  { id: '2111', code: '2111', name: 'Trade Payables', type: 'Liability', level: 4, parentId: '2110', balance: 0 },
  { id: '2110002', code: '2110002', name: 'Contractor Payables', type: 'Liability', level: 4, parentId: '2110', balance: 0 },
  { id: '2120', code: '2120', name: 'Accrued Expenses', type: 'Liability', level: 3, parentId: '2100', balance: 0, isSystem: true },
  { id: '2120001', code: '2120001', name: 'Accrued Salaries', type: 'Liability', level: 4, parentId: '2120', balance: 0 },
  { id: '2120002', code: '2120002', name: 'Accrued Utilities', type: 'Liability', level: 4, parentId: '2120', balance: 0 },
  { id: '2130', code: '2130', name: 'Employee Related Liabilities', type: 'Liability', level: 3, parentId: '2100', balance: 0, isSystem: true },
  { id: '2130001', code: '2130001', name: 'Employee Reimbursement Payable', type: 'Liability', level: 4, parentId: '2130', balance: 0 },
  { id: '2130002', code: '2130002', name: 'Employee Advance Adjustments', type: 'Liability', level: 4, parentId: '2130', balance: 0 },
  { id: '2140', code: '2140', name: 'Tax Payables', type: 'Liability', level: 3, parentId: '2100', balance: 0, isSystem: true },
  { id: '2141', code: '2141', name: 'Withholding Tax Payable', type: 'Liability', level: 4, parentId: '2140', balance: 0 },
  { id: '2142', code: '2142', name: 'Sales Tax Payable', type: 'Liability', level: 4, parentId: '2140', balance: 0 },
  { id: '2143', code: '2143', name: 'Income Tax Payable', type: 'Liability', level: 4, parentId: '2140', balance: 0 },

  // Equity
  { id: '3000', code: '3000', name: 'Equity', type: 'Equity', level: 1, balance: 0, isSystem: true },
  { id: '3100', code: '3100', name: 'Owners Equity', type: 'Equity', level: 2, parentId: '3000', balance: 0, isSystem: true },
  { id: '3110', code: '3110', name: 'Capital', type: 'Equity', level: 3, parentId: '3100', balance: 0, isSystem: true },
  { id: '3111', code: '3111', name: 'Owner Capital', type: 'Equity', level: 4, parentId: '3110', balance: 0 },
  { id: '3120', code: '3120', name: 'Drawings', type: 'Equity', level: 3, parentId: '3100', balance: 0, isSystem: true },
  { id: '3121', code: '3121', name: 'Owner Drawings', type: 'Equity', level: 4, parentId: '3120', balance: 0 },
  { id: '3130', code: '3130', name: 'Retained Earnings', type: 'Equity', level: 3, parentId: '3100', balance: 0, isSystem: true },
  { id: '3131', code: '3131', name: 'Retained Profit', type: 'Equity', level: 4, parentId: '3130', balance: 0 },

  // Revenue
  { id: '4000', code: '4000', name: 'Revenue', type: 'Revenue', level: 1, balance: 0, isSystem: true },
  { id: '4100', code: '4100', name: 'Operating Revenue', type: 'Revenue', level: 2, parentId: '4000', balance: 0, isSystem: true },
  { id: '4110', code: '4110', name: 'Sales', type: 'Revenue', level: 3, parentId: '4100', balance: 0, isSystem: true },
  { id: '4111', code: '4111', name: 'Local Sales', type: 'Revenue', level: 4, parentId: '4110', balance: 0 },
  { id: '4115', code: '4115', name: 'Sales Returns', type: 'Revenue', level: 4, parentId: '4110', balance: 0 },
  { id: '4130', code: '4130', name: 'Other Income', type: 'Revenue', level: 3, parentId: '4100', balance: 0, isSystem: true },
  { id: '4131', code: '4131', name: 'Scrap Sales', type: 'Revenue', level: 4, parentId: '4130', balance: 0 },

  // Expenses
  { id: '5000', code: '5000', name: 'Expenses', type: 'Expense', level: 1, balance: 0, isSystem: true },
  { id: '5100', code: '5100', name: 'Cost of Goods Sold', type: 'Expense', level: 2, parentId: '5000', balance: 0, isSystem: true },
  { id: '5110', code: '5110', name: 'Raw Material Consumed', type: 'Expense', level: 3, parentId: '5100', balance: 0, isSystem: true },
  { id: '511001', code: '511001', name: 'Dyes & Chemical Consumed', type: 'Expense', level: 4, parentId: '5110', balance: 0 },
  { id: '5200', code: '5200', name: 'Operating Expenses', type: 'Expense', level: 2, parentId: '5000', balance: 0, isSystem: true },
  { id: '5210', code: '5210', name: 'Administrative Expenses', type: 'Expense', level: 3, parentId: '5200', balance: 0, isSystem: true },
  { id: '5211', code: '5211', name: 'Office Salaries', type: 'Expense', level: 4, parentId: '5210', balance: 0 },
  { id: '5212', code: '5212', name: 'Office Utilities', type: 'Expense', level: 4, parentId: '5210', balance: 0 },
  { id: '5213', code: '5213', name: 'Office Rent', type: 'Expense', level: 4, parentId: '5210', balance: 0 },
  { id: '5214', code: '5214', name: 'Office Supplies', type: 'Expense', level: 4, parentId: '5210', balance: 0 },
  { id: '5220', code: '5220', name: 'Selling & Distribution Expenses', type: 'Expense', level: 3, parentId: '5200', balance: 0, isSystem: true },
  { id: '5221', code: '5221', name: 'Sales Commission', type: 'Expense', level: 4, parentId: '5220', balance: 0 },
  { id: '5222', code: '5222', name: 'Freight Out', type: 'Expense', level: 4, parentId: '5220', balance: 0 },
  { id: '5230', code: '5230', name: 'Financial Expenses', type: 'Expense', level: 3, parentId: '5200', balance: 0, isSystem: true },
  { id: '5231', code: '5231', name: 'Bank Charges', type: 'Expense', level: 4, parentId: '5230', balance: 0 },
];

class MockDB {
  private users: DbUser[] = [];
  private currentDbPrefix: string | null = null; // e.g. "ST-2526"

  // Tenant Data Cache
  private partners: Partner[] = [];
  private companyProfile: CompanyProfile | null = null;
  private coa: ChartOfAccount[] = [];
  private taxSettings: TaxSetting[] = [];
  private inventory: InventoryItem[] = [];
  private employees: Employee[] = [];
  private designations: Designation[] = [];
  private leaveTypes: LeaveType[] = [];
  private payrollSettings: PayrollGlobalSettings = { defaultOvertimeRate: 0, monthlyCutoffDay: 25, customHolidays: [] };
  private advances: AdvanceRecord[] = [];
  private leaves: LeaveRequest[] = [];
  private attendance: AttendanceRecord[] = [];
  private expenses: ExpenseRecord[] = [];
  private salesInvoices: SalesInvoice[] = [];
  private purchaseBills: PurchaseBill[] = [];
  private debitCreditNotes: DebitCreditNote[] = [];
  private receipts: ReceiptRecord[] = [];
  private payments: PaymentRecord[] = [];
  private journalVouchers: JournalVoucher[] = [];
  private contraVouchers: ContraVoucher[] = [];

  constructor() {
    this.loadSystemUsers();
  }

  // ==========================================
  // SYSTEM MANAGEMENT (Users & DB Context)
  // ==========================================

  private loadSystemUsers() {
    const stored = localStorage.getItem(USERS_DB_KEY);
    this.users = stored ? JSON.parse(stored) : [];
  }

  private persistSystemUsers() {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(this.users));
  }

  setDatabase(dbName: string | null) {
    if (!dbName) {
      this.currentDbPrefix = null;
      this.unloadTenantData();
      return;
    }
    this.currentDbPrefix = dbName;
    this.loadTenantData();
  }

  createCompanyDatabase(userId: string, companyName: string, yearStart: Date): string {
    const words = companyName.trim().split(' ');
    const prefix = words.length > 1 
      ? (words[0][0] + words[1][0]).toUpperCase() 
      : words[0].substring(0, 2).toUpperCase();
    
    const startYear = yearStart.getFullYear();
    const endYear = startYear + 1;
    const yearSuffix = `${String(startYear).slice(2)}${String(endYear).slice(2)}`;
    
    const dbName = `${prefix}-${yearSuffix}`;

    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        this.users[userIndex].companyId = dbName;
        this.users[userIndex].companyName = companyName;
        this.persistSystemUsers();
    }

    const prevContext = this.currentDbPrefix;
    this.currentDbPrefix = dbName;

    this.coa = [...INITIAL_COA];
    this.persistCoa();

    this.partners = []; this.persistPartners();
    this.inventory = []; this.persistInventory();
    this.taxSettings = []; this.persistTaxSettings();
    this.employees = []; this.persistEmployees();
    this.designations = []; this.persistDesignations();
    this.leaveTypes = []; this.persistLeaveTypes();
    this.payrollSettings = { defaultOvertimeRate: 0, monthlyCutoffDay: 25, customHolidays: [] }; this.persistPayrollSettings();
    this.advances = []; this.persistAdvances();
    this.leaves = []; this.persistLeaves();
    this.attendance = []; this.persistAttendance();
    this.expenses = []; this.persistExpenses();
    this.salesInvoices = []; this.persistSales();
    this.purchaseBills = []; this.persistPurchases();
    this.debitCreditNotes = []; this.persistNotes();
    this.receipts = []; this.persistReceipts();
    this.payments = []; this.persistPayments();
    this.journalVouchers = []; this.persistJournal();
    this.contraVouchers = []; this.persistContra();

    this.currentDbPrefix = prevContext;

    return dbName;
  }

  // ==========================================
  // FISCAL YEAR LOGIC
  // ==========================================

  checkFiscalStatus(): 'active' | 'expired' {
    if (!this.companyProfile || !this.companyProfile.fiscalYearStart) return 'active';
    
    const start = new Date(this.companyProfile.fiscalYearStart);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1); 

    const today = new Date();
    today.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    return today > end ? 'expired' : 'active';
  }

  async rolloverFiscalYear(newDbName: string) {
    if (!this.currentDbPrefix) throw new Error("No active database to close.");
    
    const oldCoa = [...this.coa];
    const oldPartners = [...this.partners];
    const oldInventory = [...this.inventory];
    const oldSettings = {
        company: this.companyProfile,
        tax: this.taxSettings,
        employees: this.employees,
        designations: this.designations,
        leaveTypes: this.leaveTypes,
        payroll: this.payrollSettings
    };

    const totalRevenue = oldCoa.filter(c => c.type === 'Revenue').reduce((sum, c) => sum + c.balance, 0);
    const totalExpense = oldCoa.filter(c => c.type === 'Expense').reduce((sum, c) => sum + c.balance, 0);
    const netIncome = totalRevenue - totalExpense;

    const oldPrefix = this.currentDbPrefix;
    this.currentDbPrefix = newDbName;

    this.coa = oldCoa.map(acc => {
        let newBalance = 0;
        if (['Asset', 'Liability', 'Equity'].includes(acc.type)) {
            newBalance = acc.balance;
        }
        return { ...acc, balance: newBalance };
    });

    const retainedEarnings = this.coa.find(c => c.name.includes('Retained Earnings') || c.id === '3130');
    if (retainedEarnings) {
        retainedEarnings.balance += netIncome;
    }

    this.persistCoa();

    this.partners = oldPartners.map(p => ({ ...p, createdAt: new Date().toISOString() })); 
    this.persistPartners();

    this.inventory = oldInventory.map(i => ({ 
        ...i, 
        openingQuantity: i.quantity, 
        quantity: i.quantity, 
        createdAt: new Date().toISOString()
    }));
    this.persistInventory();

    if (oldSettings.company) {
        const oldStart = new Date(oldSettings.company.fiscalYearStart!);
        oldStart.setFullYear(oldStart.getFullYear() + 1);
        this.companyProfile = { ...oldSettings.company, fiscalYearStart: oldStart.toISOString().split('T')[0] };
        this.persistCompany();
    }
    
    this.taxSettings = oldSettings.tax; this.persistTaxSettings();
    this.employees = oldSettings.employees; this.persistEmployees();
    this.designations = oldSettings.designations; this.persistDesignations();
    this.leaveTypes = oldSettings.leaveTypes; this.persistLeaveTypes();
    this.payrollSettings = oldSettings.payroll; this.persistPayrollSettings();

    this.salesInvoices = []; this.persistSales();
    this.purchaseBills = []; this.persistPurchases();
    this.expenses = []; this.persistExpenses();
    this.receipts = []; this.persistReceipts();
    this.payments = []; this.persistPayments();
    this.journalVouchers = []; this.persistJournal();
    this.contraVouchers = []; this.persistContra();
    this.debitCreditNotes = []; this.persistNotes();
    this.advances = []; this.persistAdvances();
    this.leaves = []; this.persistLeaves();
    this.attendance = []; this.persistAttendance();

    this.users = this.users.map(u => {
        if (u.companyId === oldPrefix) {
            return { ...u, companyId: newDbName };
        }
        return u;
    });
    this.persistSystemUsers();

    return newDbName;
  }

  // ==========================================
  // DATA LOADING (Tenant Specific)
  // ==========================================

  private unloadTenantData() {
    this.partners = [];
    this.companyProfile = null;
    this.coa = [];
    this.inventory = [];
    this.salesInvoices = [];
    this.taxSettings = [];
    this.employees = [];
    this.designations = [];
    this.leaveTypes = [];
    this.advances = [];
    this.leaves = [];
    this.attendance = [];
    this.expenses = [];
    this.purchaseBills = [];
    this.debitCreditNotes = [];
    this.receipts = [];
    this.payments = [];
    this.journalVouchers = [];
    this.contraVouchers = [];
  }

  private loadTenantData() {
    if (!this.currentDbPrefix) return;
    const p = this.currentDbPrefix;

    const get = (k: string) => localStorage.getItem(`${p}_${k}`);

    this.partners = get('partners') ? JSON.parse(get('partners')!) : [];
    this.companyProfile = get('company') ? JSON.parse(get('company')!) : null;
    this.coa = get('coa') ? JSON.parse(get('coa')!) : [];
    this.taxSettings = get('tax_settings') ? JSON.parse(get('tax_settings')!) : [];
    this.inventory = get('inventory') ? JSON.parse(get('inventory')!) : [];
    this.employees = get('employees') ? JSON.parse(get('employees')!) : [];
    this.designations = get('designations') ? JSON.parse(get('designations')!) : [];
    this.leaveTypes = get('leave_types') ? JSON.parse(get('leave_types')!) : [];
    this.payrollSettings = get('payroll_settings') ? JSON.parse(get('payroll_settings')!) : { defaultOvertimeRate: 0, monthlyCutoffDay: 25, customHolidays: [] };
    // Safety check for legacy data
    if (!this.payrollSettings.customHolidays) {
        this.payrollSettings.customHolidays = [];
    }
    
    this.advances = get('advances') ? JSON.parse(get('advances')!) : [];
    this.leaves = get('leaves') ? JSON.parse(get('leaves')!) : [];
    this.attendance = get('attendance') ? JSON.parse(get('attendance')!) : [];
    this.expenses = get('expenses') ? JSON.parse(get('expenses')!) : [];
    this.salesInvoices = get('sales') ? JSON.parse(get('sales')!) : [];
    this.purchaseBills = get('purchases') ? JSON.parse(get('purchases')!) : [];
    this.debitCreditNotes = get('notes') ? JSON.parse(get('notes')!) : [];
    this.receipts = get('receipts') ? JSON.parse(get('receipts')!) : [];
    this.payments = get('payments') ? JSON.parse(get('payments')!) : [];
    this.journalVouchers = get('journal') ? JSON.parse(get('journal')!) : [];
    this.contraVouchers = get('contra') ? JSON.parse(get('contra')!) : [];
  }

  private set(key: string, data: any) {
    if (this.currentDbPrefix) {
      localStorage.setItem(`${this.currentDbPrefix}_${key}`, JSON.stringify(data));
    }
  }

  private persistPartners() { this.set('partners', this.partners); }
  private persistCompany() { this.set('company', this.companyProfile); }
  private persistCoa() { this.set('coa', this.coa); }
  private persistTaxSettings() { this.set('tax_settings', this.taxSettings); }
  private persistInventory() { this.set('inventory', this.inventory); }
  private persistEmployees() { this.set('employees', this.employees); }
  private persistDesignations() { this.set('designations', this.designations); }
  private persistLeaveTypes() { this.set('leave_types', this.leaveTypes); }
  private persistPayrollSettings() { this.set('payroll_settings', this.payrollSettings); }
  private persistAdvances() { this.set('advances', this.advances); }
  private persistLeaves() { this.set('leaves', this.leaves); }
  private persistAttendance() { this.set('attendance', this.attendance); }
  private persistExpenses() { this.set('expenses', this.expenses); }
  private persistSales() { this.set('sales', this.salesInvoices); }
  private persistPurchases() { this.set('purchases', this.purchaseBills); }
  private persistNotes() { this.set('notes', this.debitCreditNotes); }
  private persistReceipts() { this.set('receipts', this.receipts); }
  private persistPayments() { this.set('payments', this.payments); }
  private persistJournal() { this.set('journal', this.journalVouchers); }
  private persistContra() { this.set('contra', this.contraVouchers); }

  async fetch<T>(data: T, delay = 300): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
  }

  // --- Users ---
  getUsers(): DbUser[] { 
    if (!this.currentDbPrefix) return [];
    return this.users.filter(u => u.companyId === this.currentDbPrefix); 
  }
  findUserByEmail(email: string): DbUser | undefined { return this.users.find(u => u.email === email); }
  createUser(user: Partial<DbUser>): DbUser {
    const newUser: DbUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: user.name!,
        email: user.email!,
        role: 'admin', 
        provider: user.provider || 'email',
        googleId: user.googleId,
        passwordHash: user.passwordHash,
        companyId: null, 
        companyName: null,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name!)}&background=random`,
        createdAt: new Date().toISOString()
    };
    this.users.push(newUser); 
    this.persistSystemUsers(); 
    return newUser;
  }
  addUserToCompany(user: Partial<DbUser>, companyId: string): DbUser {
      const newUser: DbUser = {
          id: Math.random().toString(36).substr(2, 9),
          name: user.name!,
          email: user.email!,
          role: user.role || 'user',
          provider: 'email',
          passwordHash: user.passwordHash,
          companyId: companyId,
          companyName: this.users.find(u => u.companyId === companyId)?.companyName || 'My Company',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name!)}&background=random`,
          createdAt: new Date().toISOString()
      };
      this.users.push(newUser);
      this.persistSystemUsers();
      return newUser;
  }
  saveUser(user: Partial<DbUser> & { name: string; email: string; role: Role }): DbUser {
      if (user.id) {
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) {
              this.users[index] = { ...this.users[index], ...user };
              this.persistSystemUsers(); return this.users[index];
          }
      } 
      if (user.companyId) {
          return this.addUserToCompany(user, user.companyId);
      }
      return this.createUser(user);
  }
  deleteUser(id: string) { 
      // Prevent deleting self check is done in UI, but strictly:
      this.users = this.users.filter(u => u.id !== id); 
      this.persistSystemUsers(); 
  }
  resetPassword(email: string, newPass: string) {
      const idx = this.users.findIndex(u => u.email === email);
      if (idx !== -1) {
          this.users[idx].passwordHash = newPass;
          this.persistSystemUsers();
          return true;
      }
      return false;
  }

  // --- Partners ---
  getPartners(type?: PartnerType): Partner[] { return type ? this.partners.filter(p => p.type === type) : [...this.partners]; }
  savePartner(partner: Partial<Partner>) {
      if (partner.id) {
          const idx = this.partners.findIndex(p => p.id === partner.id);
          if (idx !== -1) this.partners[idx] = { ...this.partners[idx], ...partner, updatedAt: new Date().toISOString() };
      } else {
          let newId = '';
          if (partner.accountId) {
              const prefix = partner.accountId;
              const existing = this.partners.filter(p => p.id.startsWith(prefix) && !isNaN(Number(p.id)));
              let maxSeq = 0;
              existing.forEach(p => {
                  const suffix = p.id.substring(prefix.length);
                  const seq = parseInt(suffix, 10);
                  if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
              });
              newId = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
          } else {
              newId = Math.random().toString(36).substr(2, 9);
          }
          this.partners.push({ 
              ...partner, 
              id: newId, 
              balance: partner.balance || 0, 
              status: 'active', 
              createdAt: new Date().toISOString(), 
              updatedAt: new Date().toISOString() 
          } as Partner);
      }
      this.persistPartners();
  }
  deletePartner(id: string) { 
      // Check for usage in transactions using optional chaining to prevent undefined access
      const usedInSales = this.salesInvoices?.some(i => i.customerId === id);
      const usedInPurchases = this.purchaseBills?.some(i => i.vendorId === id);
      const usedInReceipts = this.receipts?.some(r => r.customerId === id || r.bankAccountId === id);
      const usedInPayments = this.payments?.some(p => p.vendorId === id || p.bankAccountId === id);
      const usedInNotes = this.debitCreditNotes?.some(n => n.partyId === id);
      const usedInExpenses = this.expenses?.some(e => e.payFromId === id);
      const usedInAdvances = this.advances?.some(a => a.payFromBankId === id);

      if (usedInSales) throw new Error("Cannot delete: Partner is used in Sales Invoices.");
      if (usedInPurchases) throw new Error("Cannot delete: Partner is used in Purchase Bills.");
      if (usedInReceipts) throw new Error("Cannot delete: Partner is used in Receipts.");
      if (usedInPayments) throw new Error("Cannot delete: Partner is used in Payments.");
      if (usedInNotes) throw new Error("Cannot delete: Partner is used in Debit/Credit Notes.");
      if (usedInExpenses) throw new Error("Cannot delete: Bank/Partner is used in Expenses.");
      if (usedInAdvances) throw new Error("Cannot delete: Bank is used in Advances.");

      // Ensure filtered correctly
      this.partners = this.partners.filter(p => String(p.id) !== String(id)); 
      this.persistPartners(); 
  }

  // --- Inventory ---
  getInventoryGroups() { return this.coa.filter(c => c.parentId === '1140' || c.parentId === '1140001' || c.code.startsWith('114')); }
  getInventory() { return [...this.inventory]; }
  saveInventory(item: Partial<InventoryItem>) {
      if (item.id) {
          const idx = this.inventory.findIndex(i => i.id === item.id);
          if (idx !== -1) this.inventory[idx] = { ...this.inventory[idx], ...item, updatedAt: new Date().toISOString() } as InventoryItem;
      } else {
          let newId = '';
          const groupCode = item.group; 
          if (groupCode) {
              const prefix = groupCode;
              const existing = this.inventory.filter(i => i.id.startsWith(prefix) && !isNaN(Number(i.id)));
              let maxSeq = 0;
              existing.forEach(i => {
                  const suffix = i.id.substring(prefix.length);
                  const seq = parseInt(suffix, 10);
                  if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
              });
              newId = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
          } else {
              newId = Math.random().toString(36).substr(2, 9);
          }
          this.inventory.push({ 
              ...item, 
              id: newId, 
              sku: newId, 
              quantity: item.openingQuantity || 0, 
              status: (item.openingQuantity || 0) > 0 ? 'in_stock' : 'out_of_stock', 
              createdAt: new Date().toISOString(), 
              updatedAt: new Date().toISOString() 
          } as InventoryItem);
      }
      this.persistInventory();
  }
  deleteInventory(id: string) { 
      const usedInSales = this.salesInvoices?.some(inv => inv.items.some(i => i.inventoryItemId === id));
      const usedInPurchases = this.purchaseBills?.some(bill => bill.items.some(i => i.inventoryItemId === id));
      
      if (usedInSales) throw new Error("Cannot delete: Item is used in Sales Invoices.");
      if (usedInPurchases) throw new Error("Cannot delete: Item is used in Purchase Bills.");

      this.inventory = this.inventory.filter(i => String(i.id) !== String(id)); 
      this.persistInventory(); 
  }

  // --- Tax ---
  getTaxSettings() { return [...this.taxSettings]; }
  saveTaxSetting(t: Partial<TaxSetting>) {
      if (t.id) {
          const idx = this.taxSettings.findIndex(x => x.id === t.id);
          if (idx !== -1) this.taxSettings[idx] = { ...this.taxSettings[idx], ...t, updatedAt: new Date().toISOString() } as TaxSetting;
      } else {
          this.taxSettings.push({ ...t, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as TaxSetting);
      }
      this.persistTaxSettings();
  }
  deleteTaxSetting(id: string) { 
      // Simplified usage check
      const usedInSales = this.salesInvoices.some(i => i.items.some(it => it.taxId === id));
      const usedInPurchases = this.purchaseBills.some(i => i.items.some(it => it.taxId === id));
      if (usedInSales || usedInPurchases) throw new Error("Cannot delete: Tax rule is used in transactions.");
      
      this.taxSettings = this.taxSettings.filter(t => String(t.id) !== String(id)); 
      this.persistTaxSettings(); 
  }

  // --- Employees ---
  getEmployees() { return [...this.employees]; }
  saveEmployee(e: Partial<Employee>) { 
      if (e.id) { 
          const idx = this.employees.findIndex(x => x.id === e.id); 
          if (idx !== -1) this.employees[idx] = { ...this.employees[idx], ...e, updatedAt: new Date().toISOString() } as Employee; 
      } else { 
          const count = this.employees.length + 1; 
          const employeeId = `EMP-${String(count).padStart(3, '0')}`; 
          this.employees.push({ 
              ...e, 
              id: Math.random().toString(36).substr(2, 9), 
              employeeId, 
              dutyHours: e.dutyHours || 8,
              status: e.status || 'Active', 
              createdAt: new Date().toISOString(), 
              updatedAt: new Date().toISOString() 
          } as Employee); 
      } 
      this.persistEmployees(); 
  }
  deleteEmployee(id: string) { 
      const usedInAdvance = this.advances.some(a => a.employeeId === id);
      const usedInLeave = this.leaves.some(l => l.employeeId === id);
      const usedInAttendance = this.attendance.some(a => a.employeeId === id);
      const usedInExpense = this.expenses.some(e => e.payFromId === id);

      if (usedInAdvance || usedInLeave || usedInAttendance || usedInExpense) throw new Error("Cannot delete: Employee has payroll/expense records.");

      this.employees = this.employees.filter(e => String(e.id) !== String(id)); 
      this.persistEmployees(); 
  }

  // --- Common CRUD (No extra dependencies for simple records usually) ---
  saveDesignation(d: Partial<Designation>) { if (d.id) { const idx = this.designations.findIndex(x => x.id === d.id); if (idx !== -1) this.designations[idx] = { ...this.designations[idx], ...d, updatedAt: new Date().toISOString() } as Designation; } else { this.designations.push({ ...d, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Designation); } this.persistDesignations(); }
  deleteDesignation(id: string) { 
      if (this.employees.some(e => e.designationId === id)) throw new Error("Cannot delete: Designation is assigned to employees.");
      this.designations = this.designations.filter(d => String(d.id) !== String(id)); this.persistDesignations(); 
  }
  
  saveLeaveType(l: Partial<LeaveType>) { if (l.id) { const idx = this.leaveTypes.findIndex(x => x.id === l.id); if (idx !== -1) this.leaveTypes[idx] = { ...this.leaveTypes[idx], ...l, updatedAt: new Date().toISOString() } as LeaveType; } else { this.leaveTypes.push({ ...l, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as LeaveType); } this.persistLeaveTypes(); }
  deleteLeaveType(id: string) { 
      if (this.leaves.some(l => l.leaveTypeId === id)) throw new Error("Cannot delete: Leave Type is used in requests.");
      this.leaveTypes = this.leaveTypes.filter(l => String(l.id) !== String(id)); this.persistLeaveTypes(); 
  }

  getCompanyProfile() { return this.companyProfile ? { ...this.companyProfile } : { name: '', email: '', address: '', logoUrl: '' } as CompanyProfile; }
  saveCompanyProfile(profile: CompanyProfile) { this.companyProfile = profile; this.persistCompany(); }
  getCOA() { return [...this.coa]; }
  getLeafAccounts() { return this.coa.filter(c => c.level === 4); }
  getCashBankAccounts() { return this.coa.filter(c => c.level === 4 && (c.parentId === '1110' || c.name.toLowerCase().includes('cash') || c.name.toLowerCase().includes('bank'))); }
  saveCOA(account: Partial<ChartOfAccount>) {
    if (account.id) {
        const idx = this.coa.findIndex(c => c.id === account.id);
        if (idx !== -1) this.coa[idx] = { ...this.coa[idx], ...account };
    } else {
        this.coa.push({ ...account, id: account.code, balance: 0 } as ChartOfAccount);
    }
    this.persistCoa();
  }
  deleteCOA(id: string) { 
      const hasChildren = this.coa.some(c => c.parentId === id);
      if (hasChildren) throw new Error("Cannot delete account that has sub-accounts.");
      const account = this.coa.find(c => c.id === id);
      if (account?.isSystem) throw new Error("Cannot delete system default accounts.");
      // Check usage in Journal/Expense/etc would be here in real app
      this.coa = this.coa.filter(c => c.id !== id); 
      this.persistCoa(); 
  }
  generateNextCode(parentId: string): string {
      const parent = this.coa.find(c => c.id === parentId);
      if (!parent) return '';
      const children = this.coa.filter(c => c.parentId === parentId);
      const level = (parent.level + 1) as 1|2|3|4;
      let baseIncrement = level === 2 ? 100 : level === 3 ? 10 : 1;
      const isSevenDigitPattern = parent.code.length === 4 && children.some(c => c.code.length > 5);
      if (isSevenDigitPattern || (level === 4 && children.length > 0 && children[0].code.length > 5)) {
          let maxSeq = 0;
          children.forEach(c => { 
             if (c.code.startsWith(parent.code)) {
                const seqStr = c.code.substring(parent.code.length);
                const seq = parseInt(seqStr);
                if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
             }
          });
          return parent.code + String(maxSeq + 1).padStart(3, '0');
      }
      let nextVal = parseInt(parent.code) + baseIncrement;
      if (children.length > 0) {
          const childCodes = children.map(c => parseInt(c.code)).filter(c => !isNaN(c));
          if (childCodes.length > 0) {
              const maxCode = Math.max(...childCodes);
              nextVal = maxCode + (level === 4 ? 1 : level === 3 ? 10 : 100);
          }
      }
      return String(nextVal);
  }

  getDesignations() { return [...this.designations]; }
  getLeaveTypes() { return [...this.leaveTypes]; }
  getPayrollSettings() { return { ...this.payrollSettings }; }
  savePayrollSettings(settings: PayrollGlobalSettings) { this.payrollSettings = settings; this.persistPayrollSettings(); }
  getAdvances() { return [...this.advances]; }
  saveAdvance(a: Partial<AdvanceRecord>): AdvanceRecord { 
      let record: AdvanceRecord;
      if (a.id) { 
          const idx = this.advances.findIndex(x => x.id === a.id); 
          if (idx !== -1) {
              this.advances[idx] = { ...this.advances[idx], ...a, updatedAt: new Date().toISOString() } as AdvanceRecord; 
              record = this.advances[idx];
          } else {
              throw new Error("Advance record not found");
          }
      } else { 
          record = { ...a, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as AdvanceRecord;
          this.advances.push(record); 
      } 
      this.persistAdvances(); 
      return record;
  }
  deleteAdvance(id: string) { this.advances = this.advances.filter(a => String(a.id) !== String(id)); this.persistAdvances(); }
  getLeaves() { return [...this.leaves]; }
  saveLeave(l: Partial<LeaveRequest>) { if (l.id) { const idx = this.leaves.findIndex(x => x.id === l.id); if (idx !== -1) this.leaves[idx] = { ...this.leaves[idx], ...l, updatedAt: new Date().toISOString() } as LeaveRequest; } else { this.leaves.push({ ...l, id: Math.random().toString(36).substr(2, 9), status: 'Pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as LeaveRequest); } this.persistLeaves(); }
  deleteLeave(id: string) { this.leaves = this.leaves.filter(l => String(l.id) !== String(id)); this.persistLeaves(); }
  
  getAttendance() { return [...this.attendance]; }
  saveAttendance(a: Partial<AttendanceRecord>) { 
      // DUPLICATE CHECK: If creating new (no ID), check if date+employee already exists
      if (!a.id && a.employeeId && a.date) {
          const existing = this.attendance.find(r => r.employeeId === a.employeeId && r.date === a.date);
          if (existing) {
              throw new Error(`Attendance for this employee on ${a.date} already exists.`);
          }
      }

      // Auto Calculation of Overtime
      const emp = this.employees.find(e => e.id === a.employeeId);
      if (emp && a.inTime && a.outTime) {
          const start = new Date(`1970-01-01T${a.inTime}Z`);
          const end = new Date(`1970-01-01T${a.outTime}Z`);
          const durationHrs = (end.getTime() - start.getTime()) / 3600000;
          
          const duty = emp.dutyHours || 8;
          // Subtract 1 hour mandatory break
          const actualWorkHrs = durationHrs - 1; 
          const otHours = Math.max(0, actualWorkHrs - duty);
          
          if (otHours > 0) {
              const hourlySalary = emp.basicSalary / 30 / duty;
              const multiplier = this.payrollSettings.defaultOvertimeRate || 1.5;
              a.overtimeHours = parseFloat(otHours.toFixed(2));
              a.overtimeAmount = Math.round(hourlySalary * otHours * multiplier);
          } else {
              a.overtimeHours = 0;
              a.overtimeAmount = 0;
          }
      }

      if (a.id) { 
          const idx = this.attendance.findIndex(x => x.id === a.id); 
          if (idx !== -1) this.attendance[idx] = { ...this.attendance[idx], ...a, updatedAt: new Date().toISOString() } as AttendanceRecord; 
      } else { 
          this.attendance.push({ ...a, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as AttendanceRecord); 
      } 
      this.persistAttendance(); 
  }
  
  bulkSaveAttendance(records: AttendanceRecord[]) {
      // Filter out duplicates in the incoming batch against the DB
      const uniqueRecords = records.filter(rec => {
          // Check against existing DB
          const exists = this.attendance.some(e => e.employeeId === rec.employeeId && e.date === rec.date);
          return !exists;
      });

      if (uniqueRecords.length === 0) return;

      // Initialize OT fields just in case
      const preppedRecords = uniqueRecords.map(r => {
          const emp = this.employees.find(e => e.id === r.employeeId);
          // Recalculate OT just to be safe if passed raw
          let otHrs = 0;
          let otAmt = 0;
          
          if (emp && r.inTime && r.outTime) {
              const start = new Date(`1970-01-01T${r.inTime}Z`);
              const end = new Date(`1970-01-01T${r.outTime}Z`);
              const durationHrs = (end.getTime() - start.getTime()) / 3600000;
              const duty = emp.dutyHours || 8;
              
              // Subtract 1 hour mandatory break
              const actualWorkHrs = durationHrs - 1;
              const calcOt = Math.max(0, actualWorkHrs - duty);
              
              if (calcOt > 0) {
                  otHrs = parseFloat(calcOt.toFixed(2));
                  const hourlySalary = emp.basicSalary / 30 / duty;
                  const multiplier = this.payrollSettings.defaultOvertimeRate || 1.5;
                  otAmt = Math.round(hourlySalary * calcOt * multiplier);
              }
          }

          return {
              ...r,
              overtimeHours: r.overtimeHours ?? otHrs,
              overtimeAmount: r.overtimeAmount ?? otAmt
          };
      });

      this.attendance = [...this.attendance, ...preppedRecords];
      this.persistAttendance();
  }
  
  deleteAttendance(id: string) { this.attendance = this.attendance.filter(a => String(a.id) !== String(id)); this.persistAttendance(); }
  getExpenses() { return [...this.expenses]; }
  getExpenseAccounts() { 
    return this.coa
      .filter(c => c.type === 'Expense' && c.level === 4)
      .sort((a, b) => a.code.localeCompare(b.code));
  }
  saveExpense(exp: Partial<ExpenseRecord>) { if (exp.id) { const idx = this.expenses.findIndex(x => x.id === exp.id); if (idx !== -1) this.expenses[idx] = { ...this.expenses[idx], ...exp, updatedAt: new Date().toISOString() } as ExpenseRecord; } else { const count = this.expenses.length + 1; const voucherNo = `EXP-${String(count).padStart(4, '0')}`; this.expenses.push({ ...exp, id: Math.random().toString(36).substr(2, 9), voucherNo, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ExpenseRecord); } this.persistExpenses(); }
  deleteExpense(id: string) { this.expenses = this.expenses.filter(e => String(e.id) !== String(id)); this.persistExpenses(); }
  getSalesInvoices() { return [...this.salesInvoices]; }
  saveSalesInvoice(inv: Partial<SalesInvoice>) { if (inv.id) { const idx = this.salesInvoices.findIndex(x => x.id === inv.id); if (idx !== -1) this.salesInvoices[idx] = { ...this.salesInvoices[idx], ...inv, updatedAt: new Date().toISOString() } as SalesInvoice; } else { const count = this.salesInvoices.length + 1; const invoiceNo = `INV-${String(count).padStart(4, '0')}`; this.salesInvoices.push({ ...inv, id: Math.random().toString(36).substr(2, 9), invoiceNo, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as SalesInvoice); } this.persistSales(); }
  deleteSalesInvoice(id: string) { this.salesInvoices = this.salesInvoices.filter(i => String(i.id) !== String(id)); this.persistSales(); }
  getPurchaseBills() { return [...this.purchaseBills]; }
  savePurchaseBill(bill: Partial<PurchaseBill>) { if (bill.id) { const idx = this.purchaseBills.findIndex(b => b.id === bill.id); if (idx !== -1) this.purchaseBills[idx] = { ...this.purchaseBills[idx], ...bill, updatedAt: new Date().toISOString() } as PurchaseBill; } else { const count = this.purchaseBills.length + 1; const billNo = `BILL-${String(count).padStart(4, '0')}`; this.purchaseBills.push({ ...bill, id: Math.random().toString(36).substr(2, 9), billNo, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as PurchaseBill); } this.persistPurchases(); }
  deletePurchaseBill(id: string) { this.purchaseBills = this.purchaseBills.filter(b => String(b.id) !== String(id)); this.persistPurchases(); }
  getDebitCreditNotes() { return [...this.debitCreditNotes]; }
  saveDebitCreditNote(note: Partial<DebitCreditNote>) { if (note.id) { const idx = this.debitCreditNotes.findIndex(n => n.id === note.id); if (idx !== -1) this.debitCreditNotes[idx] = { ...this.debitCreditNotes[idx], ...note, updatedAt: new Date().toISOString() } as DebitCreditNote; } else { const prefix = note.type === 'Credit Note' ? 'CN' : 'DN'; const existingCount = this.debitCreditNotes.filter(n => n.type === note.type).length + 1; const noteNo = `${prefix}-${String(existingCount).padStart(3, '0')}`; this.debitCreditNotes.push({ ...note, id: Math.random().toString(36).substr(2, 9), noteNo, isTaxable: note.isTaxable || false, taxAmount: note.taxAmount || 0, grandTotal: note.grandTotal || note.amount || 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as DebitCreditNote); } this.persistNotes(); }
  deleteDebitCreditNote(id: string) { this.debitCreditNotes = this.debitCreditNotes.filter(n => String(n.id) !== String(id)); this.persistNotes(); }
  getReceipts() { return [...this.receipts]; }
  saveReceipt(rec: Partial<ReceiptRecord>) { if (rec.id) { const idx = this.receipts.findIndex(r => r.id === rec.id); if (idx !== -1) this.receipts[idx] = { ...this.receipts[idx], ...rec, updatedAt: new Date().toISOString() } as ReceiptRecord; } else { const count = this.receipts.length + 1; const voucherNo = `REC-${String(count).padStart(3, '0')}`; this.receipts.push({ ...rec, id: Math.random().toString(36).substr(2, 9), voucherNo, whtAmount: rec.whtAmount || 0, netAmount: rec.netAmount || 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ReceiptRecord); } this.persistReceipts(); }
  deleteReceipt(id: string) { this.receipts = this.receipts.filter(r => String(r.id) !== String(id)); this.persistReceipts(); }
  getPayments() { return [...this.payments]; }
  savePayment(pay: Partial<PaymentRecord>) { if (pay.id) { const idx = this.payments.findIndex(p => p.id === pay.id); if (idx !== -1) this.payments[idx] = { ...this.payments[idx], ...pay, updatedAt: new Date().toISOString() } as PaymentRecord; } else { const count = this.payments.length + 1; const voucherNo = `PAY-${String(count).padStart(3, '0')}`; this.payments.push({ ...pay, id: Math.random().toString(36).substr(2, 9), voucherNo, whtAmount: pay.whtAmount || 0, netAmount: pay.netAmount || 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as PaymentRecord); } this.persistPayments(); }
  deletePayment(id: string) { this.payments = this.payments.filter(p => String(p.id) !== String(id)); this.persistPayments(); }
  getJournalVouchers() { return [...this.journalVouchers]; }
  saveJournalVoucher(jv: Partial<JournalVoucher>) { if (jv.id) { const idx = this.journalVouchers.findIndex(j => j.id === jv.id); if (idx !== -1) this.journalVouchers[idx] = { ...this.journalVouchers[idx], ...jv, updatedAt: new Date().toISOString() } as JournalVoucher; } else { const count = this.journalVouchers.length + 1; const voucherNo = `JV-${String(count).padStart(3, '0')}`; this.journalVouchers.push({ ...jv, id: Math.random().toString(36).substr(2, 9), voucherNo, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as JournalVoucher); } this.persistJournal(); }
  deleteJournalVoucher(id: string) { this.journalVouchers = this.journalVouchers.filter(j => String(j.id) !== String(id)); this.persistJournal(); }
  getContraVouchers() { return [...this.contraVouchers]; }
  saveContraVoucher(cv: Partial<ContraVoucher>) { if (cv.id) { const idx = this.contraVouchers.findIndex(c => c.id === cv.id); if (idx !== -1) this.contraVouchers[idx] = { ...this.contraVouchers[idx], ...cv, updatedAt: new Date().toISOString() } as ContraVoucher; } else { const count = this.contraVouchers.length + 1; const voucherNo = `CV-${String(count).padStart(3, '0')}`; this.contraVouchers.push({ ...cv, id: Math.random().toString(36).substr(2, 9), voucherNo, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ContraVoucher); } this.persistContra(); }
  deleteContraVoucher(id: string) { this.contraVouchers = this.contraVouchers.filter(c => String(c.id) !== String(id)); this.persistContra(); }

  getRevenueData(): RevenueData[] { return [{ month: 'Jan', earning: 0, expense: 0 }]; }

  getTransactions(type?: EntityType): Transaction[] {
    const all: Transaction[] = [];
    if (!type || type === 'sales') { this.salesInvoices.forEach(inv => { all.push({ id: inv.id, createdAt: inv.createdAt, updatedAt: inv.updatedAt || inv.createdAt, date: inv.date, reference: inv.invoiceNo, partyName: this.partners.find(p => p.id === inv.customerId)?.name || 'Unknown', amount: inv.grandTotal, status: (['paid', 'posted'].includes(inv.status.toLowerCase()) ? 'paid' : inv.status === 'Overdue' ? 'overdue' : 'pending'), description: inv.notes, type: 'sales' }); }); }
    if (!type || type === 'purchases') { this.purchaseBills.forEach(bill => { all.push({ id: bill.id, createdAt: bill.createdAt, updatedAt: bill.updatedAt || bill.createdAt, date: bill.date, reference: bill.billNo, partyName: this.partners.find(p => p.id === bill.vendorId)?.name || 'Unknown', amount: bill.grandTotal, status: (['paid', 'posted'].includes(bill.status.toLowerCase()) ? 'paid' : bill.status === 'Overdue' ? 'overdue' : 'pending'), description: bill.notes, type: 'purchases' }); }); }
    if (!type || type === 'receipts') { this.receipts.forEach(rec => { all.push({ id: rec.id, createdAt: rec.createdAt, updatedAt: rec.updatedAt || rec.createdAt, date: rec.date, reference: rec.voucherNo, partyName: this.partners.find(p => p.id === rec.customerId)?.name || 'Unknown', amount: rec.grossAmount, status: 'paid', description: rec.description, type: 'receipts' }); }); }
    if (!type || type === 'payments') { this.payments.forEach(pay => { all.push({ id: pay.id, createdAt: pay.createdAt, updatedAt: pay.updatedAt || pay.createdAt, date: pay.date, reference: pay.voucherNo, partyName: this.partners.find(p => p.id === pay.vendorId)?.name || 'Unknown', amount: pay.grossAmount, status: 'paid', description: pay.description, type: 'payments' }); }); }
    if (!type || type === 'expenses') { this.expenses.forEach(exp => { all.push({ id: exp.id, createdAt: exp.createdAt, updatedAt: exp.updatedAt || exp.createdAt, date: exp.date, reference: exp.voucherNo, partyName: exp.payee || 'Expense', amount: exp.amount, status: 'paid', description: exp.description, type: 'expenses' }); }); }
    if (!type || type === 'journal') { this.journalVouchers.forEach(jv => { all.push({ id: jv.id, createdAt: jv.createdAt, updatedAt: jv.updatedAt || jv.createdAt, date: jv.date, reference: jv.voucherNo, partyName: 'General Journal', amount: jv.totalAmount, status: jv.status === 'Posted' ? 'paid' : 'pending', description: jv.description, type: 'journal' }); }); }
    if (!type || type === 'contra') { this.contraVouchers.forEach(cv => { all.push({ id: cv.id, createdAt: cv.createdAt, updatedAt: cv.updatedAt || cv.createdAt, date: cv.date, reference: cv.voucherNo, partyName: 'Contra Transfer', amount: cv.amount, status: cv.status === 'Posted' ? 'paid' : 'pending', description: cv.description, type: 'contra' }); }); }
    if (!type || type === 'debit_credit_notes') { this.debitCreditNotes.forEach(dn => { all.push({ id: dn.id, createdAt: dn.createdAt, updatedAt: dn.updatedAt || dn.createdAt, date: dn.date, reference: dn.noteNo, partyName: this.partners.find(p => p.id === dn.partyId)?.name || 'Unknown', amount: dn.grandTotal, status: dn.status === 'Posted' ? 'paid' : 'pending', description: dn.reason, type: 'debit_credit_notes' }); }); }
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const db = new MockDB();
