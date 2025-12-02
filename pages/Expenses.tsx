

import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { ExpenseRecord, ChartOfAccount, Partner, Employee, PaymentMethod, ExpenseType } from '../types';
import { Search, Plus, Edit2, Trash2, Save, Filter, CreditCard, User, Briefcase, FileText, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';

const toProperCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const Expenses = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<ChartOfAccount[]>([]);
  const [banks, setBanks] = useState<Partner[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof ExpenseRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [formData, setFormData] = useState<Partial<ExpenseRecord>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { loadData(); }, [isModalOpen]);

  const loadData = () => {
    setExpenses(db.getExpenses());
    setExpenseAccounts(db.getExpenseAccounts());
    setBanks(db.getPartners('bank'));
    setEmployees(db.getEmployees());
  };

  const filteredData = expenses.filter(e => e.voucherNo.toLowerCase().includes(search.toLowerCase()) || e.payee?.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase()));
  const sortedData = [...filteredData].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      return sortDirection === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: keyof ExpenseRecord) => {
      if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      else { setSortField(field); setSortDirection('asc'); }
  };

  const openModal = (expense?: ExpenseRecord) => {
      setEditingExpense(expense || null);
      if (expense) { setFormData({ ...expense }); } else { setFormData({ type: 'Direct', date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', amount: 0, description: '', payee: '' }); }
      setErrors({});
      setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof ExpenseRecord, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: keyof ExpenseRecord) => {
      if (field === 'payee' || field === 'description') { setFormData(prev => ({ ...prev, [field]: toProperCase(String(prev[field] || '')) })); }
  };

  const handleSubmit = () => {
      const errs: Record<string, string> = {};
      if (!formData.amount || formData.amount <= 0) errs.amount = 'Amount is required';
      if (!formData.date) errs.date = 'Date is required';
      if (!formData.expenseAccountId) errs.expenseAccountId = 'Expense Account is required';
      if (!formData.payFromId) errs.payFromId = formData.type === 'Direct' ? 'Bank Account is required' : 'Employee is required';
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
      const postedAccountId = formData.type === 'Direct' ? '1111' : '2130001';
      db.saveExpense({ ...formData, postedAccountId });
      setIsModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this expense record?')) {
          try {
              db.deleteExpense(id);
              loadData();
              alert('Expense deleted successfully.');
          } catch(e: any) {
              alert(e.message);
          }
      }
  };

  const getAccountName = (id: string) => expenseAccounts.find(a => a.id === id)?.name || id;

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-text-main tracking-tight">Expenses</h1><p className="text-text-muted text-sm mt-1">Manage direct and indirect operational costs.</p></div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95"><Plus size={18} /> Record Expense</button>
       </div>
       <div className="bg-surface rounded-2xl shadow-soft border border-border overflow-hidden">
          <div className="p-5 border-b border-border bg-surface/50 flex flex-col sm:flex-row gap-4 justify-between items-center"><div className="relative w-full sm:w-80 group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} /><input type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-main focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" /></div></div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-surface-highlight border-b border-border">
                      <tr>
                          {[
                              { key: 'date', label: 'Date', w: '12%' },
                              { key: 'voucherNo', label: 'Voucher', w: '12%' },
                              { key: 'payee', label: 'Payee', w: '15%' },
                              { key: 'expenseAccountId', label: 'Expense Account', w: '20%' },
                              { key: 'type', label: 'Type', w: '10%' },
                              { key: 'amount', label: 'Amount', w: '15%', align: 'right' },
                              { key: 'actions', label: '', w: '10%', align: 'right' }
                          ].map((col) => (
                              <th key={col.key} className={`px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-main transition-colors ${col.align === 'right' ? 'text-right' : ''}`} onClick={() => col.key !== 'actions' && handleSort(col.key as keyof ExpenseRecord)} style={{ width: col.w }}><div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>{col.label}{col.key !== 'actions' && sortField === col.key && <ArrowUpDown size={12} className={sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'} />}</div></th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                      {paginatedData.length === 0 ? (<tr><td colSpan={7} className="p-12 text-center text-text-muted">No expenses found.</td></tr>) : (
                          paginatedData.map((item) => (
                              <tr key={item.id} className="hover:bg-surface-highlight transition-colors group">
                                  <td className="px-6 py-4 text-text-main">{item.date}</td>
                                  <td className="px-6 py-4 font-mono text-xs text-primary">{item.voucherNo}</td>
                                  <td className="px-6 py-4 font-medium">{item.payee || '-'}</td>
                                  <td className="px-6 py-4 text-text-muted">{getAccountName(item.expenseAccountId)}</td>
                                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.type === 'Direct' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>{item.type}</span></td>
                                  <td className="px-6 py-4 text-right font-mono font-bold text-text-main">${item.amount.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                          <button onClick={() => openModal(item)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg"><Edit2 size={16} /></button>
                                          <button onClick={(e) => handleDelete(e, item.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg"><Trash2 size={16} /></button>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
          {totalPages > 1 && (<div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-muted bg-surface/50"><span>Page {currentPage} of {totalPages}</span><div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-border hover:bg-surface-highlight disabled:opacity-50 transition-colors"><ChevronLeft size={16} /></button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-border hover:bg-surface-highlight disabled:opacity-50 transition-colors"><ChevronRight size={16} /></button></div></div>)}
       </div>
       {/* Modal content preserved */}
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingExpense ? 'Edit Expense' : 'New Expense'} maxWidth="max-w-2xl">
           <div className="space-y-5">
               <div className="flex bg-surface-highlight rounded-xl p-1 border border-border"><button onClick={() => handleInputChange('type', 'Direct')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'Direct' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}>Direct Expense</button><button onClick={() => handleInputChange('type', 'Indirect')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'Indirect' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}>Indirect Expense</button></div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div><label className="text-xs font-semibold text-text-muted mb-1.5 block">Voucher No</label><input type="text" value={formData.voucherNo || 'Auto Generated'} disabled className="w-full bg-surface-highlight/50 border border-transparent rounded-xl py-2.5 px-4 text-text-muted text-sm" /></div>
                   <div><label className="text-xs font-semibold text-text-muted mb-1.5 block">Date <span className="text-danger">*</span></label><input type="date" value={formData.date || ''} onChange={e => handleInputChange('date', e.target.value)} className={`w-full bg-surface-highlight border ${errors.date ? 'border-danger' : 'border-transparent'} rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm`} />{errors.date && <p className="text-xs text-danger mt-1">{errors.date}</p>}</div>
                   <div className="md:col-span-2"><label className="text-xs font-semibold text-text-muted mb-1.5 block">Expense Account <span className="text-danger">*</span></label><select value={formData.expenseAccountId || ''} onChange={e => handleInputChange('expenseAccountId', e.target.value)} className={`w-full bg-surface-highlight border ${errors.expenseAccountId ? 'border-danger' : 'border-transparent'} rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm`}><option value="">Select Expense Account</option>{expenseAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}</select>{errors.expenseAccountId && <p className="text-xs text-danger mt-1">{errors.expenseAccountId}</p>}</div>
                   <div><label className="text-xs font-semibold text-text-muted mb-1.5 block">Amount <span className="text-danger">*</span></label><input type="number" value={formData.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} className={`w-full bg-surface-highlight border ${errors.amount ? 'border-danger' : 'border-transparent'} rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm`} placeholder="0.00" />{errors.amount && <p className="text-xs text-danger mt-1">{errors.amount}</p>}</div>
                   <div><label className="text-xs font-semibold text-text-muted mb-1.5 block">Payee</label><input type="text" value={formData.payee || ''} onChange={e => handleInputChange('payee', e.target.value)} onBlur={() => handleBlur('payee')} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" placeholder="Person or Company" /></div>
                   <div className="md:col-span-2"><label className="text-xs font-semibold text-text-muted mb-1.5 block">{formData.type === 'Direct' ? 'Pay From (Bank)' : 'Pay From (Employee)'} <span className="text-danger">*</span></label><select value={formData.payFromId || ''} onChange={e => handleInputChange('payFromId', e.target.value)} className={`w-full bg-surface-highlight border ${errors.payFromId ? 'border-danger' : 'border-transparent'} rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm`}><option value="">Select {formData.type === 'Direct' ? 'Bank' : 'Employee'}</option>{formData.type === 'Direct' ? banks.map(b => <option key={b.id} value={b.id}>{b.name} (Bal: ${b.balance})</option>) : employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>)}</select>{errors.payFromId && <p className="text-xs text-danger mt-1">{errors.payFromId}</p>}</div>
                   <div className="md:col-span-2 pt-2 border-t border-border mt-2"><label className="text-xs font-semibold text-text-muted mb-1.5 block">Payment Method</label><select value={formData.paymentMethod || 'Cash'} onChange={e => handleInputChange('paymentMethod', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"><option>Cash</option><option>Cheque</option><option>Online Transfer</option></select></div>
                   {formData.paymentMethod === 'Cheque' && (<><div><label className="text-xs font-semibold text-text-muted mb-1.5 block">Cheque Number</label><input type="text" value={formData.chequeNo || ''} onChange={e => handleInputChange('chequeNo', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" /></div><div><label className="text-xs font-semibold text-text-muted mb-1.5 block">Cheque Date</label><input type="date" value={formData.chequeDate || ''} onChange={e => handleInputChange('chequeDate', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" /></div></>)}
                   <div className="md:col-span-2"><label className="text-xs font-semibold text-text-muted mb-1.5 block">Description</label><textarea rows={2} value={formData.description || ''} onChange={e => handleInputChange('description', e.target.value)} onBlur={() => handleBlur('description')} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none" placeholder="Expense details..." /></div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t border-border"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main">Cancel</button><button onClick={handleSubmit} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary-light flex items-center gap-2"><Save size={16} /> Save Expense</button></div>
           </div>
       </Modal>
    </div>
  );
};
export default Expenses;