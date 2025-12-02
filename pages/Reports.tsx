
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { CompanyProfile, ChartOfAccount, Partner, Transaction, InventoryItem } from '../types';
import { Printer, FileText, Calendar, Filter, ChevronRight, BarChart3, PieChart, BookOpen, Layers, UserSquare, ArrowRight, RefreshCcw } from 'lucide-react';
import { Card } from '../components/ui/Card';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('income_statement');
  const [dateRange, setDateRange] = useState({ 
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
      to: new Date().toISOString().split('T')[0] 
  });
  
  // Data State
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [baseCoa, setBaseCoa] = useState<ChartOfAccount[]>([]);
  const [reportCoa, setReportCoa] = useState<ChartOfAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    // 1. Fetch Static Data
    const _company = db.getCompanyProfile();
    const _coa = db.getCOA();
    const _partners = [...db.getPartners('customer'), ...db.getPartners('vendor'), ...db.getPartners('bank')];
    const _inventory = db.getInventory();
    
    // 2. Fetch Transactional Data
    const _sales = db.getSalesInvoices();
    const _purchases = db.getPurchaseBills();
    const _expenses = db.getExpenses();
    const _receipts = db.getReceipts();
    const _payments = db.getPayments();
    const _journal = db.getJournalVouchers();
    const _contra = db.getContraVouchers();
    const _notes = db.getDebitCreditNotes();

    // 3. LEDGER ENGINE: Process Transactions to Update COA Balances
    // We map balances to a dictionary { accountId: amount }
    const balances: Record<string, number> = {};
    
    const add = (id: string, amount: number) => {
        if (!id) return;
        balances[id] = (balances[id] || 0) + amount;
        
        // Propagate to parents
        const acc = _coa.find(c => c.id === id);
        if (acc && acc.parentId) {
            // For report aggregation, we might just sum leaves, but let's store leaf balances mostly
        }
    };

    // --- PROCESSING RULES ---
    
    // A. Sales (Cr Revenue, Dr AR, Cr Tax) & COGS (Dr COGS, Cr Inventory)
    _sales.forEach(inv => {
        if (inv.date < dateRange.from || inv.date > dateRange.to) return;
        
        // 1. Revenue Entry
        add('1121', inv.grandTotal); // Dr Accounts Receivable
        add('4111', -inv.subTotal); // Cr Sales Revenue (Revenue is Credit)
        if (inv.taxTotal > 0) add('2142', -inv.taxTotal); // Cr Sales Tax Payable

        // 2. COGS Entry (Perpetual Inventory)
        let cogsTotal = 0;
        inv.items.forEach(item => {
            const product = _inventory.find(p => p.id === item.inventoryItemId);
            if (product) {
                const cost = product.unitPrice * item.quantity; // Est cost
                cogsTotal += cost;
                // Cr Inventory Asset (Group Account)
                add(product.group, -cost); 
            }
        });
        if (cogsTotal > 0) {
            add('5100', cogsTotal); // Dr COGS
        }
    });

    // B. Purchases (Dr Inventory, Cr AP)
    _purchases.forEach(bill => {
        if (bill.date < dateRange.from || bill.date > dateRange.to) return;
        
        // Dr Inventory (Item Groups)
        bill.items.forEach(item => {
            const product = _inventory.find(p => p.id === item.inventoryItemId);
            if (product) {
               add(product.group, item.amount);
            }
        });
        
        if (bill.taxTotal > 0) add('1152', bill.taxTotal); // Dr Tax Receivable (Input Tax)
        add('2111', -bill.grandTotal); // Cr Accounts Payable
    });

    // C. Expenses (Dr Expense, Cr Bank/Cash)
    _expenses.forEach(exp => {
        if (exp.date < dateRange.from || exp.date > dateRange.to) return;
        
        add(exp.expenseAccountId, exp.amount); // Dr Expense
        if (exp.type === 'Direct') {
            add('1111', -exp.amount); // Cr Bank (Cash & Banks)
        } else {
            add('2130', -exp.amount); // Cr Employee Payable (Generic)
        }
    });

    // D. Receipts (Dr Bank, Dr WHT, Cr AR)
    _receipts.forEach(rec => {
        if (rec.date < dateRange.from || rec.date > dateRange.to) return;
        
        add('1111', rec.netAmount); // Dr Bank
        if (rec.whtAmount > 0) add('5230', rec.whtAmount); // Dr WHT Expense (or Receivable depending on setup)
        add('1121', -rec.grossAmount); // Cr AR
    });

    // E. Payments (Dr AP, Cr Bank, Cr WHT)
    _payments.forEach(pay => {
        if (pay.date < dateRange.from || pay.date > dateRange.to) return;
        
        add('2111', pay.grossAmount); // Dr AP
        add('1111', -pay.netAmount); // Cr Bank
        if (pay.whtAmount > 0) add('2141', -pay.whtAmount); // Cr WHT Payable
    });

    // F. Journal Vouchers
    _journal.forEach(jv => {
        if (jv.date < dateRange.from || jv.date > dateRange.to) return;
        jv.entries.forEach(e => {
            add(e.accountId, (e.debit || 0) - (e.credit || 0));
        });
    });

    // G. Contra (Cash Transfers)
    _contra.forEach(cv => {
        if (cv.date < dateRange.from || cv.date > dateRange.to) return;
        add(cv.toAccountId, cv.amount); // Dr Dest
        add(cv.fromAccountId, -cv.amount); // Cr Source
    });

    // 4. Update COA with Calculated Balances
    const calculatedCoa = _coa.map(acc => {
        // Balances in map are Signed (+ Debit, - Credit).
        // For display, we often want absolute magnitude or specific sign based on type.
        const rawBalance = balances[acc.id] || 0;
        
        // Propagate child balances to parents for aggregation
        // (Simple approach: we just use leaf nodes for reports usually, but let's sum children for list)
        return { ...acc, balance: rawBalance }; // Storing raw signed balance
    });

    // Propagate up (Bubble up totals)
    // We sort by level desc (4 -> 1)
    calculatedCoa.sort((a, b) => b.level - a.level);
    calculatedCoa.forEach(acc => {
        if (acc.parentId) {
            const parent = calculatedCoa.find(p => p.id === acc.parentId);
            if (parent) {
                // Ensure we don't double count if parent had its own transactions (unlikely for group accounts)
                // We add the child's balance to the parent
                parent.balance = (parent.balance || 0) + acc.balance;
            }
        }
    });

    setCompany(_company);
    setBaseCoa(_coa);
    setReportCoa(calculatedCoa);
    setPartners(_partners);
    setInventory(_inventory);
    setTransactions(db.getTransactions());
    setLoading(false);
  };

  // --- Financial Aggregators ---
  const getTotals = () => {
      // Filter level 4 accounts to avoid double counting parents
      const leaves = reportCoa.filter(c => c.level === 4);
      
      const revenue = Math.abs(leaves.filter(c => c.type === 'Revenue').reduce((s, c) => s + c.balance, 0));
      // Expenses are Debit (+), so sum is positive
      const cogs = leaves.filter(c => c.code.startsWith('51')).reduce((s, c) => s + c.balance, 0); 
      const opExpenses = leaves.filter(c => c.type === 'Expense' && !c.code.startsWith('51')).reduce((s, c) => s + c.balance, 0);
      
      const netIncome = revenue - cogs - opExpenses;

      // Balance Sheet
      const assets = leaves.filter(c => c.type === 'Asset').reduce((s, c) => s + c.balance, 0);
      const liabilities = Math.abs(leaves.filter(c => c.type === 'Liability').reduce((s, c) => s + c.balance, 0));
      // Equity (Capital - Drawings + Retained Earnings)
      // Note: Retained Earnings in COA is historical. We need to add Current Net Income.
      const historicalEquity = Math.abs(leaves.filter(c => c.type === 'Equity').reduce((s, c) => s + c.balance, 0));
      const totalEquity = historicalEquity + netIncome;

      return { revenue, cogs, opExpenses, netIncome, assets, liabilities, totalEquity };
  };

  const t = getTotals();

  // --- Renderers ---

  const renderIncomeStatement = () => (
      <div className="space-y-6 text-black font-sans">
          <div className="border-b-2 border-gray-800 pb-2 mb-6">
              <h3 className="text-2xl font-bold uppercase tracking-tight text-gray-900">Statement of Profit & Loss</h3>
              <p className="text-sm text-gray-500 mt-1">For the period <span className="font-semibold text-black">{dateRange.from}</span> to <span className="font-semibold text-black">{dateRange.to}</span></p>
          </div>
          
          <div className="space-y-1">
              <div className="flex justify-between font-bold text-lg text-gray-900 bg-gray-100 p-2 rounded">
                  <span>Operating Revenue</span>
                  <span>{t.revenue.toLocaleString()}</span>
              </div>
              {reportCoa.filter(c => c.type === 'Revenue' && c.level === 4 && Math.abs(c.balance) > 0).map(c => (
                  <div key={c.id} className="flex justify-between text-sm text-gray-600 px-4 py-1 border-b border-dashed border-gray-200">
                      <span>{c.name}</span>
                      <span>{Math.abs(c.balance).toLocaleString()}</span>
                  </div>
              ))}
          </div>

          <div className="space-y-1 mt-4">
              <div className="flex justify-between font-bold text-lg text-gray-900 bg-gray-100 p-2 rounded">
                  <span>Cost of Goods Sold</span>
                  <span>({t.cogs.toLocaleString()})</span>
              </div>
              {reportCoa.filter(c => c.type === 'Expense' && c.code.startsWith('51') && c.level === 4 && Math.abs(c.balance) > 0).map(c => (
                  <div key={c.id} className="flex justify-between text-sm text-gray-600 px-4 py-1 border-b border-dashed border-gray-200">
                      <span>{c.name}</span>
                      <span>{Math.abs(c.balance).toLocaleString()}</span>
                  </div>
              ))}
          </div>

          <div className="flex justify-between font-bold text-xl border-t-2 border-gray-300 pt-3 mt-4 px-2">
              <span>Gross Profit</span>
              <span className={(t.revenue - t.cogs) >= 0 ? 'text-green-700' : 'text-red-600'}>
                  {(t.revenue - t.cogs).toLocaleString()}
              </span>
          </div>

          <div className="space-y-1 mt-8">
              <div className="flex justify-between font-bold text-lg text-gray-900 bg-gray-100 p-2 rounded">
                  <span>Operating Expenses</span>
                  <span>({t.opExpenses.toLocaleString()})</span>
              </div>
              {reportCoa.filter(c => c.type === 'Expense' && !c.code.startsWith('51') && c.level === 4 && Math.abs(c.balance) > 0).map(c => (
                  <div key={c.id} className="flex justify-between text-sm text-gray-600 px-4 py-1 border-b border-dashed border-gray-200">
                      <span>{c.name}</span>
                      <span>{Math.abs(c.balance).toLocaleString()}</span>
                  </div>
              ))}
          </div>

          <div className="flex justify-between font-bold text-2xl border-t-4 border-gray-900 pt-4 mt-8 px-2 bg-gray-50">
              <span>Net Profit / (Loss)</span>
              <span className={t.netIncome >= 0 ? 'text-green-700' : 'text-red-600'}>
                  {t.netIncome.toLocaleString()}
              </span>
          </div>
      </div>
  );

  const renderBalanceSheet = () => (
      <div className="space-y-8 text-black font-sans">
          <div className="border-b-2 border-gray-800 pb-2 mb-6">
              <h3 className="text-2xl font-bold uppercase tracking-tight text-gray-900">Statement of Financial Position</h3>
              <p className="text-sm text-gray-500 mt-1">As of <span className="font-semibold text-black">{dateRange.to}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-12">
              {/* Assets Side */}
              <div>
                  <h4 className="font-bold text-lg border-b-2 border-primary mb-4 pb-1 text-primary">Assets</h4>
                  
                  {['Current Assets', 'Non-Current Assets'].map(cat => {
                      const prefix = cat === 'Current Assets' ? '11' : '12';
                      const items = reportCoa.filter(c => c.type === 'Asset' && c.level === 4 && c.code.startsWith(prefix) && Math.abs(c.balance) > 0);
                      if (items.length === 0) return null;
                      
                      return (
                          <div key={cat} className="mb-6">
                              <h5 className="font-bold text-xs text-gray-500 uppercase mb-2 border-b border-gray-200 pb-1">{cat}</h5>
                              <div className="space-y-2">
                                  {items.map(acc => (
                                      <div key={acc.id} className="flex justify-between text-sm border-b border-dashed border-gray-100 pb-1">
                                          <span>{acc.name}</span>
                                          <span className="font-mono">{Math.abs(acc.balance).toLocaleString()}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      );
                  })}

                  <div className="flex justify-between font-bold text-lg border-t-2 border-gray-800 pt-2 bg-gray-100 p-2 rounded">
                      <span>Total Assets</span>
                      <span>{t.assets.toLocaleString()}</span>
                  </div>
              </div>

              {/* Liability & Equity Side */}
              <div>
                  <h4 className="font-bold text-lg border-b-2 border-red-500 mb-4 pb-1 text-red-600">Liabilities & Equity</h4>
                  
                  {/* Liabilities */}
                  <div className="mb-6">
                      <h5 className="font-bold text-xs text-gray-500 uppercase mb-2 border-b border-gray-200 pb-1">Liabilities</h5>
                      <div className="space-y-2">
                          {reportCoa.filter(c => c.type === 'Liability' && c.level === 4 && Math.abs(c.balance) > 0).map(acc => (
                              <div key={acc.id} className="flex justify-between text-sm border-b border-dashed border-gray-100 pb-1">
                                  <span>{acc.name}</span>
                                  <span className="font-mono">{Math.abs(acc.balance).toLocaleString()}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Equity */}
                  <div className="mb-6">
                      <h5 className="font-bold text-xs text-gray-500 uppercase mb-2 border-b border-gray-200 pb-1">Equity</h5>
                      <div className="space-y-2">
                          {reportCoa.filter(c => c.type === 'Equity' && c.level === 4 && Math.abs(c.balance) > 0).map(acc => (
                              <div key={acc.id} className="flex justify-between text-sm border-b border-dashed border-gray-100 pb-1">
                                  <span>{acc.name}</span>
                                  <span className="font-mono text-gray-600">{Math.abs(acc.balance).toLocaleString()}</span>
                              </div>
                          ))}
                          {/* Add Current Year Profit */}
                          <div className="flex justify-between text-sm border-b border-dashed border-gray-100 pb-1 font-semibold text-blue-700 bg-blue-50 px-1 rounded">
                              <span>Net Profit (Current Year)</span>
                              <span className="font-mono">{t.netIncome.toLocaleString()}</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-between font-bold text-lg border-t-2 border-gray-800 pt-2 bg-gray-100 p-2 rounded">
                      <span>Total Equity & Liab.</span>
                      <span>{(t.liabilities + t.totalEquity).toLocaleString()}</span>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderTrialBalance = () => (
      <div className="space-y-4 text-black font-sans">
          <div className="border-b-2 border-gray-800 pb-2 mb-4">
              <h3 className="text-2xl font-bold uppercase tracking-tight text-gray-900">Trial Balance</h3>
              <p className="text-sm text-gray-500">As of {dateRange.to}</p>
          </div>

          <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-800 text-white">
                  <tr>
                      <th className="py-2 px-3 uppercase text-xs">Code</th>
                      <th className="py-2 px-3 uppercase text-xs">Account Title</th>
                      <th className="py-2 px-3 uppercase text-xs text-right">Debit</th>
                      <th className="py-2 px-3 uppercase text-xs text-right">Credit</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                  {reportCoa.filter(c => c.level === 4 && Math.abs(c.balance) > 0).sort((a,b) => a.code.localeCompare(b.code)).map((acc) => {
                      const isDebit = acc.balance > 0; 
                      return (
                          <tr key={acc.id} className="hover:bg-gray-50">
                              <td className="py-2 px-3 font-mono text-xs text-gray-500">{acc.code}</td>
                              <td className="py-2 px-3 font-medium text-gray-800">{acc.name}</td>
                              <td className="py-2 px-3 text-right font-mono">{isDebit ? acc.balance.toLocaleString() : '-'}</td>
                              <td className="py-2 px-3 text-right font-mono">{!isDebit ? Math.abs(acc.balance).toLocaleString() : '-'}</td>
                          </tr>
                      );
                  })}
              </tbody>
              <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-800">
                  <tr>
                      <td colSpan={2} className="py-2 px-3 text-right uppercase text-xs">Totals</td>
                      <td className="py-2 px-3 text-right font-mono">
                          {reportCoa.filter(c => c.level === 4 && c.balance > 0).reduce((s,c)=>s+c.balance,0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                          {Math.abs(reportCoa.filter(c => c.level === 4 && c.balance < 0).reduce((s,c)=>s+c.balance,0)).toLocaleString()}
                      </td>
                  </tr>
              </tfoot>
          </table>
      </div>
  );

  const renderGeneralLedger = () => {
      const account = baseCoa.find(c => c.id === selectedAccountId);
      // Filter transactions related to this account
      // In a real system, this would be a direct DB query. Here we approximate by checking description or type context.
      const relevantTxns = transactions.filter(t => {
          // Broad check for demo: If transaction Party Name, Reference or Description matches Account
          if (!account) return true;
          // Expenses
          if (t.type === 'expenses' && account.type === 'Expense') return true;
          // Revenue
          if (t.type === 'sales' && account.type === 'Revenue') return true;
          // Cash/Bank
          if (['1111', '1110'].includes(account.code) && ['receipts', 'payments', 'contra', 'expenses'].includes(t.type)) return true;
          // AR
          if (account.code === '1121' && ['sales', 'receipts'].includes(t.type)) return true;
          // AP
          if (account.code === '2111' && ['purchases', 'payments'].includes(t.type)) return true;
          
          return t.description?.toLowerCase().includes(account.name.toLowerCase());
      }).filter(t => t.date >= dateRange.from && t.date <= dateRange.to);
      
      let runningBalance = 0;

      return (
          <div className="space-y-4 text-black font-sans">
              <div className="border-b-2 border-gray-800 pb-2 mb-4 flex justify-between items-end">
                  <div>
                      <h3 className="text-xl font-bold uppercase tracking-tight text-gray-900">General Ledger</h3>
                      <p className="text-sm text-gray-600 mt-1">Account: <span className="font-bold text-black text-lg">{account ? `${account.code} - ${account.name}` : 'All Accounts'}</span></p>
                  </div>
                  <p className="text-sm text-gray-500">{dateRange.from} to {dateRange.to}</p>
              </div>

              <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                          <th className="py-2 px-3 border-r border-gray-300 w-24">Date</th>
                          <th className="py-2 px-3 border-r border-gray-300 w-32">Voucher</th>
                          <th className="py-2 px-3 border-r border-gray-300">Description</th>
                          <th className="py-2 px-3 text-right border-r border-gray-300 w-24">Debit</th>
                          <th className="py-2 px-3 text-right border-r border-gray-300 w-24">Credit</th>
                          <th className="py-2 px-3 text-right w-32">Balance</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      <tr className="bg-gray-50 italic text-gray-500">
                          <td colSpan={5} className="py-2 px-3 text-right">Opening Balance</td>
                          <td className="py-2 px-3 text-right font-mono">0.00</td>
                      </tr>
                      {relevantTxns.map((txn, idx) => {
                          let debit = 0, credit = 0;
                          // Rough logic to determine Dr/Cr based on transaction type for display
                          if (['sales', 'purchases'].includes(txn.type)) { debit = txn.amount; }
                          else if (['receipts', 'payments'].includes(txn.type)) { credit = txn.amount; }
                          else { debit = txn.amount; } // Fallback

                          runningBalance += (debit - credit);

                          return (
                              <tr key={idx} className="hover:bg-gray-50">
                                  <td className="py-2 px-3 border-r border-gray-200">{txn.date}</td>
                                  <td className="py-2 px-3 font-mono text-xs border-r border-gray-200 text-primary">{txn.reference}</td>
                                  <td className="py-2 px-3 border-r border-gray-200">
                                      <div className="font-medium text-gray-800">{txn.partyName}</div>
                                      <div className="text-xs text-gray-500">{txn.description}</div>
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono border-r border-gray-200 text-gray-600">{debit ? debit.toLocaleString() : '-'}</td>
                                  <td className="py-2 px-3 text-right font-mono border-r border-gray-200 text-gray-600">{credit ? credit.toLocaleString() : '-'}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">{Math.abs(runningBalance).toLocaleString()} {runningBalance >= 0 ? 'Dr' : 'Cr'}</td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      );
  };

  const renderPartnerLedger = () => {
      const partner = partners.find(p => p.id === selectedPartnerId);
      const relevantTxns = transactions.filter(t => t.partyName === partner?.name && t.date >= dateRange.from && t.date <= dateRange.to);
      let runningBalance = 0; // In real app, calculate opening balance from prior transactions

      return (
          <div className="space-y-4 text-black font-sans">
              <div className="border-b-2 border-gray-800 pb-2 mb-4 flex justify-between items-end">
                  <div>
                      <h3 className="text-xl font-bold uppercase tracking-tight text-gray-900">Partner Ledger</h3>
                      <p className="text-sm text-gray-600 mt-1">
                          {partner?.type === 'customer' ? 'Customer' : 'Vendor'}: <span className="font-bold text-black text-lg">{partner?.name || 'All Partners'}</span>
                      </p>
                      <div className="text-xs text-gray-500 mt-1 flex gap-4">
                          <span>{partner?.address}</span>
                          <span>{partner?.phone}</span>
                      </div>
                  </div>
                  <p className="text-sm text-gray-500">{dateRange.from} to {dateRange.to}</p>
              </div>

              <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                          <th className="py-2 px-3 border-r border-gray-300 w-24">Date</th>
                          <th className="py-2 px-3 border-r border-gray-300 w-32">Ref #</th>
                          <th className="py-2 px-3 border-r border-gray-300">Narration</th>
                          <th className="py-2 px-3 text-right border-r border-gray-300 w-24">Debit</th>
                          <th className="py-2 px-3 text-right border-r border-gray-300 w-24">Credit</th>
                          <th className="py-2 px-3 text-right w-32">Balance</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      <tr className="bg-gray-50 italic text-gray-500">
                          <td colSpan={5} className="py-2 px-3 text-right">Opening Balance</td>
                          <td className="py-2 px-3 text-right font-mono">0.00</td>
                      </tr>
                      {relevantTxns.map((txn, idx) => {
                          // Correct Logic for Partner Ledger
                          // Customer: Sales = Debit (Increase Receivable), Receipt = Credit (Decrease Receivable)
                          // Vendor: Purchase = Credit (Increase Payable), Payment = Debit (Decrease Payable)
                          
                          let debit = 0, credit = 0;
                          
                          if (partner?.type === 'customer') {
                              if (['sales', 'debit_credit_notes'].includes(txn.type)) debit = txn.amount; 
                              if (['receipts', 'credit_note'].includes(txn.type)) credit = txn.amount;
                          } else {
                              // Vendor
                              if (['payments', 'debit_note'].includes(txn.type)) debit = txn.amount;
                              if (['purchases'].includes(txn.type)) credit = txn.amount;
                          }

                          runningBalance += (debit - credit);

                          return (
                              <tr key={idx} className="hover:bg-gray-50">
                                  <td className="py-2 px-3 border-r border-gray-200">{txn.date}</td>
                                  <td className="py-2 px-3 font-mono text-xs border-r border-gray-200 text-primary">{txn.reference}</td>
                                  <td className="py-2 px-3 border-r border-gray-200">
                                      <span className="uppercase text-[10px] font-bold bg-gray-200 px-1.5 py-0.5 rounded mr-2 text-gray-600">{txn.type.slice(0,3)}</span>
                                      {txn.description || txn.type}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono border-r border-gray-200 text-gray-600">{debit ? debit.toLocaleString() : '-'}</td>
                                  <td className="py-2 px-3 text-right font-mono border-r border-gray-200 text-gray-600">{credit ? credit.toLocaleString() : '-'}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">{Math.abs(runningBalance).toLocaleString()} {runningBalance >= 0 ? 'Dr' : 'Cr'}</td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      );
  };

  const renderDayBook = () => (
      <div className="space-y-4 text-black font-sans">
          <div className="border-b-2 border-gray-800 pb-2 mb-4 flex justify-between items-end">
              <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-gray-900">Day Book</h3>
                  <p className="text-sm text-gray-600 mt-1">Transaction Register</p>
              </div>
              <p className="text-sm text-gray-500">{dateRange.from} to {dateRange.to}</p>
          </div>

          <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-800 text-white">
                  <tr>
                      <th className="py-3 px-4 rounded-tl-lg">Date</th>
                      <th className="py-3 px-4">Ref #</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Party / Details</th>
                      <th className="py-3 px-4 text-right rounded-tr-lg">Amount</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                  {transactions
                      .filter(t => t.date >= dateRange.from && t.date <= dateRange.to)
                      .map((txn, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-3 px-4">{txn.date}</td>
                          <td className="py-3 px-4 font-mono text-xs font-bold text-gray-600">{txn.reference}</td>
                          <td className="py-3 px-4"><span className="uppercase text-xs font-bold bg-gray-100 border border-gray-300 px-2 py-1 rounded text-gray-600">{txn.type.replace('_', ' ')}</span></td>
                          <td className="py-3 px-4 font-medium text-gray-800">{txn.partyName}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">{txn.amount.toLocaleString()}</td>
                      </tr>
                  ))}
                  {transactions.filter(t => t.date >= dateRange.from && t.date <= dateRange.to).length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-gray-400 italic">No transactions found for this period.</td></tr>
                  )}
              </tbody>
          </table>
      </div>
  );

  // --- Print Handler ---
  const handlePrint = () => {
      const printWindow = window.open('', '', 'width=1100,height=800');
      if (!printWindow) return;

      const reportContent = document.getElementById('report-preview')?.innerHTML;

      const html = `
        <html>
        <head>
            <title>Nexus ERP - ${activeReport.replace('_', ' ').toUpperCase()}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { font-family: 'Inter', sans-serif; background: white; -webkit-print-color-adjust: exact; }
                @page { size: A4; margin: 15mm; }
                .report-container { width: 100%; max-width: 100%; }
                /* Enhance table borders for print */
                table { border-collapse: collapse; width: 100%; }
                th, td { padding: 8px; }
                thead th { background-color: #f3f4f6 !important; color: #111827 !important; border-bottom: 2px solid #374151 !important; }
                tr { page-break-inside: avoid; }
            </style>
        </head>
        <body class="p-8">
            <!-- Company Header -->
            <div class="flex justify-between items-start border-b-4 border-gray-900 pb-6 mb-8">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 uppercase tracking-tighter">${company?.name || 'My Company'}</h1>
                    <p class="text-sm text-gray-600 mt-1 whitespace-pre-wrap max-w-sm">${company?.address || ''}</p>
                    <div class="mt-2 flex gap-4 text-xs text-gray-500 font-mono">
                        ${company?.phone ? `<span>Ph: ${company.phone}</span>` : ''}
                        ${company?.ntn ? `<span>NTN: ${company.ntn}</span>` : ''}
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Report Generated</p>
                    <p class="text-sm font-medium mb-1">${new Date().toLocaleString()}</p>
                    <p class="text-xs text-gray-400">Page 1 of 1</p>
                </div>
            </div>

            <!-- Report Content -->
            <div class="report-container">
                ${reportContent}
            </div>

            <!-- Footer -->
            <div class="fixed bottom-0 left-0 w-full text-center border-t border-gray-200 pt-4 pb-4">
                <p class="text-[10px] text-gray-400">Generated by Nexus ERP System</p>
            </div>

            <script>
                window.onload = () => { window.print(); }
            </script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
  };

  const reportTypes = [
      { id: 'income_statement', label: 'Income Statement', icon: BarChart3 },
      { id: 'balance_sheet', label: 'Balance Sheet', icon: PieChart },
      { id: 'trial_balance', label: 'Trial Balance', icon: Layers },
      { id: 'general_ledger', label: 'General Ledger', icon: BookOpen },
      { id: 'partner_ledger', label: 'Partner Ledger', icon: UserSquare },
      { id: 'day_book', label: 'Day Book', icon: Calendar },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6">
       
       {/* Sidebar */}
       <Card className="w-full md:w-64 flex flex-col p-0 overflow-hidden shrink-0 border-border shadow-soft h-fit md:h-full">
           <div className="p-4 border-b border-border bg-surface-highlight/30">
               <h2 className="font-bold text-text-main flex items-center gap-2"><FileText size={18} className="text-primary"/> Reports</h2>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
               {reportTypes.map(r => (
                   <button 
                      key={r.id} 
                      onClick={() => setActiveReport(r.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeReport === r.id ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface-highlight hover:text-text-main'}`}
                   >
                       <r.icon size={18} />
                       {r.label}
                       {activeReport === r.id && <ChevronRight size={14} className="ml-auto opacity-50"/>}
                   </button>
               ))}
           </div>
       </Card>

       {/* Main Area */}
       <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
           
           {/* Filters Bar */}
           <div className="bg-surface border border-border rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-soft shrink-0">
               <div>
                   <label className="text-xs font-bold text-text-muted uppercase mb-1 block">From Date</label>
                   <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 outline-none" />
               </div>
               <div>
                   <label className="text-xs font-bold text-text-muted uppercase mb-1 block">To Date</label>
                   <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 outline-none" />
               </div>
               
               {activeReport === 'general_ledger' && (
                   <div className="flex-1 min-w-[200px]">
                       <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Select Account</label>
                       <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="w-full bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 outline-none">
                           <option value="">All Accounts</option>
                           {baseCoa.filter(c => c.level === 4).sort((a,b) => a.code.localeCompare(b.code)).map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                       </select>
                   </div>
               )}

               {activeReport === 'partner_ledger' && (
                   <div className="flex-1 min-w-[200px]">
                       <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Select Partner</label>
                       <select value={selectedPartnerId} onChange={e => setSelectedPartnerId(e.target.value)} className="w-full bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:ring-2 focus:ring-primary/50 outline-none">
                           <option value="">Select Customer/Vendor...</option>
                           {partners.sort((a,b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                       </select>
                   </div>
               )}

               <div className="ml-auto flex gap-2">
                   <button onClick={loadData} className="flex items-center gap-2 bg-surface-highlight text-text-muted hover:text-primary px-3 py-2.5 rounded-xl font-bold border border-border transition-colors" title="Refresh Data">
                       <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                   </button>
                   <button onClick={handlePrint} className="flex items-center gap-2 bg-text-main text-surface hover:bg-text-main/90 px-5 py-2.5 rounded-xl font-bold shadow-lg transition-transform active:scale-95">
                       <Printer size={18} /> Print Report
                   </button>
               </div>
           </div>

           {/* Preview Area */}
           <div className="flex-1 bg-gray-100 rounded-2xl border border-border overflow-y-auto p-4 md:p-8 flex justify-center custom-scrollbar">
               {loading ? (
                   <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                       <RefreshCcw size={48} className="animate-spin text-gray-300"/>
                       <p>Calculating Financials...</p>
                   </div>
               ) : (
                   <div id="report-preview" className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 text-black transition-all origin-top scale-100">
                       {activeReport === 'income_statement' && renderIncomeStatement()}
                       {activeReport === 'balance_sheet' && renderBalanceSheet()}
                       {activeReport === 'general_ledger' && renderGeneralLedger()}
                       {activeReport === 'partner_ledger' && renderPartnerLedger()}
                       {activeReport === 'day_book' && renderDayBook()}
                       {activeReport === 'trial_balance' && renderTrialBalance()}
                   </div>
               )}
           </div>

       </div>
    </div>
  );
};

export default Reports;
