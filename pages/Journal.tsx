import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { JournalVoucher, JournalEntry, ChartOfAccount, CompanyProfile } from '../types';
import { Search, Plus, Edit2, Trash2, Save, Printer, Calendar, FileText, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { GenericTable, Column } from '../components/GenericTable';

const toProperCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const Journal = () => {
  const [vouchers, setVouchers] = useState<JournalVoucher[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof JournalVoucher>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<JournalVoucher | null>(null);
  const [formData, setFormData] = useState<Partial<JournalVoucher>>({});
  const [formEntries, setFormEntries] = useState<JournalEntry[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);

  useEffect(() => {
    loadData();
  }, [isModalOpen]);

  useEffect(() => {
      let d = 0, c = 0;
      formEntries.forEach(e => { d += e.debit || 0; c += e.credit || 0; });
      setTotalDebit(d);
      setTotalCredit(c);
  }, [formEntries]);

  const loadData = () => {
    setVouchers(db.getJournalVouchers());
    setAccounts(db.getLeafAccounts());
    setCompany(db.getCompanyProfile());
  };

  const handleSort = (field: keyof JournalVoucher) => {
      if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      else { setSortField(field); setSortDirection('asc'); }
  };

  const filteredData = vouchers.filter(v => 
      v.voucherNo.toLowerCase().includes(search.toLowerCase()) || 
      v.description.toLowerCase().includes(search.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      return sortDirection === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  const openModal = (jv?: JournalVoucher) => {
      setEditingVoucher(jv || null);
      if (jv) {
          setFormData({ ...jv });
          setFormEntries([...jv.entries]);
      } else {
          setFormData({ voucherNo: 'Auto Generated', date: new Date().toISOString().split('T')[0], description: '', status: 'Draft' });
          setFormEntries([{ id: '1', accountId: '', description: '', debit: 0, credit: 0 }, { id: '2', accountId: '', description: '', debit: 0, credit: 0 }]);
      }
      setErrors({});
      setIsModalOpen(true);
  };

  const addEntry = () => { setFormEntries([...formEntries, { id: Math.random().toString(36).substr(2, 9), accountId: '', description: '', debit: 0, credit: 0 }]); };
  const removeEntry = (id: string) => { setFormEntries(formEntries.filter(e => e.id !== id)); };
  const updateEntry = (id: string, field: keyof JournalEntry, value: any) => {
      const updated = formEntries.map(e => { if (e.id === id) { return { ...e, [field]: value }; } return e; });
      setFormEntries(updated);
  };

  const handleInputChange = (field: keyof JournalVoucher, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: keyof JournalVoucher) => {
      if (field === 'description') { setFormData(prev => ({ ...prev, [field]: toProperCase(String(prev[field] || '')) })); }
  };

  const handleSubmit = async () => {
      const errs: Record<string, string> = {};
      if (!formData.date) errs.date = 'Date is required';
      if (!formData.description) errs.description = 'Description is required';
      let hasEmptyAccount = false;
      formEntries.forEach(e => { if (!e.accountId) hasEmptyAccount = true; });
      if (hasEmptyAccount) errs.entries = 'All rows must have an account selected';
      if (Math.abs(totalDebit - totalCredit) > 0.01) { errs.entries = `Debit (${totalDebit}) and Credit (${totalCredit}) must match.`; }
      if (totalDebit === 0) errs.entries = 'Voucher cannot be zero.';
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
      setIsSaving(true);
      await new Promise(r => setTimeout(r, 500));
      db.saveJournalVoucher({ ...formData, entries: formEntries, totalAmount: totalDebit });
      setIsSaving(false);
      setIsModalOpen(false);
      loadData();
  };

  const handleDelete = (id: string) => {
      if (confirm("Delete this journal voucher?")) { db.deleteJournalVoucher(id); loadData(); }
  };

  const handlePrint = (jv: JournalVoucher) => {
      const printWindow = window.open('', '', 'width=900,height=800');
      if (!printWindow) return;
      const htmlContent = `<html><head><title>Journal Voucher - ${jv.voucherNo}</title><script src="https://cdn.tailwindcss.com"></script><style>body { font-family: 'Inter', sans-serif; background: white; color: black; -webkit-print-color-adjust: exact; } @page { size: A4; margin: 20mm; }</style></head><body class="p-8 max-w-4xl mx-auto"><div class="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8"><div class="w-1/2"><h1 class="text-4xl font-bold uppercase tracking-tight text-gray-900">Journal Voucher</h1><p class="text-sm text-gray-600 mt-1 font-medium uppercase">Original Copy</p></div><div class="w-1/2 text-right"><h2 class="text-xl font-bold text-gray-900">${company?.name}</h2><p class="text-sm text-gray-600 whitespace-pre-wrap">${company?.address}</p></div></div><div class="flex justify-between mb-10"><div class="w-1/2 pr-8"><h3 class="text-xs font-bold text-gray-500 uppercase mb-2">Description</h3><p class="text-gray-900 text-lg">${jv.description}</p></div><div class="w-1/2 pl-8 flex flex-col gap-3 items-end"><div class="text-right"><p class="text-xs font-bold text-gray-500 uppercase">Voucher No</p><p class="font-mono font-bold text-lg">${jv.voucherNo}</p></div><div class="text-right"><p class="text-xs font-bold text-gray-500 uppercase">Date</p><p class="font-medium">${jv.date}</p></div></div></div><div class="mb-10 border border-gray-200 rounded-lg overflow-hidden"><table class="w-full text-left"><thead class="bg-gray-100 border-b border-gray-200"><tr><th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Account Code</th><th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Account Title / Description</th><th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase text-right">Debit</th><th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase text-right">Credit</th></tr></thead><tbody>${jv.entries.map(e => { const acc = accounts.find(a => a.id === e.accountId); return `<tr class="border-b border-gray-200"><td class="py-3 px-4 font-mono text-sm text-gray-600">${acc?.code || e.accountId}</td><td class="py-3 px-4 text-sm text-gray-900"><div class="font-medium">${acc?.name || 'Unknown Account'}</div><div class="text-xs text-gray-500">${e.description || ''}</div></td><td class="py-3 px-4 text-right font-mono text-gray-900">${e.debit ? e.debit.toLocaleString() : '-'}</td><td class="py-3 px-4 text-right font-mono text-gray-900">${e.credit ? e.credit.toLocaleString() : '-'}</td></tr>`; }).join('')}</tbody><tfoot class="bg-gray-50 font-bold"><tr><td colspan="2" class="py-3 px-4 text-right text-xs uppercase text-gray-500">Totals</td><td class="py-3 px-4 text-right font-mono text-gray-900">${jv.totalAmount.toLocaleString()}</td><td class="py-3 px-4 text-right font-mono text-gray-900">${jv.totalAmount.toLocaleString()}</td></tr></tfoot></table></div><div class="mt-auto pt-12 border-t border-gray-200 grid grid-cols-3 gap-8"><div class="text-center"><div class="border-b border-gray-400 mb-2 h-8"></div><p class="text-xs font-bold text-gray-500 uppercase">Prepared By</p></div><div class="text-center"><div class="border-b border-gray-400 mb-2 h-8"></div><p class="text-xs font-bold text-gray-500 uppercase">Checked By</p></div><div class="text-center"><div class="border-b border-gray-400 mb-2 h-8"></div><p class="text-xs font-bold text-gray-500 uppercase">Approved By</p></div></div><script>window.onload = () => { window.print(); }</script></body></html>`;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  const columns: Column<JournalVoucher>[] = [
      { header: 'Date', accessor: 'date', sortKey: 'date' },
      { header: 'JV #', accessor: 'voucherNo', className: 'font-mono text-xs text-primary', sortKey: 'voucherNo' },
      { header: 'Description', accessor: 'description', className: 'truncate max-w-xs', sortKey: 'description' },
      { header: 'Total', accessor: (v) => v.totalAmount.toLocaleString(), className: 'text-right font-mono font-bold', sortKey: 'totalAmount' },
      { 
          header: 'Status', 
          accessor: (v) => (
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${v.status === 'Posted' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                  {v.status}
              </span>
          ) 
      },
      {
          header: 'Actions',
          accessor: (v) => (
              <div className="flex justify-end gap-2">
                  <button onClick={() => handlePrint(v)} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Print"><Printer size={16} /></button>
                  <button onClick={() => openModal(v)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(v.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
          ),
          className: 'text-right'
      }
  ];

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Journal Vouchers</h1>
            <p className="text-text-muted text-sm mt-1">Record general ledger adjustments and non-cash transactions.</p>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95">
             <Plus size={18} /> New JV
          </button>
       </div>

       <GenericTable 
          data={sortedData} 
          columns={columns} 
          title="JV History"
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection} 
       />

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVoucher ? 'Edit JV' : 'New Journal Voucher'} maxWidth="max-w-4xl">
           <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <div>
                       <label className="text-xs font-semibold text-text-muted mb-1.5 block">Date <span className="text-danger">*</span></label>
                       <div className="relative">
                           <Calendar size={16} className="absolute left-3 top-2.5 text-text-muted" />
                           <input type="date" value={formData.date || ''} onChange={e => handleInputChange('date', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50" />
                       </div>
                       {errors.date && <span className="text-xs text-danger mt-1">{errors.date}</span>}
                   </div>
                   <div className="md:col-span-2">
                       <label className="text-xs font-semibold text-text-muted mb-1.5 block">Description <span className="text-danger">*</span></label>
                       <div className="relative">
                           <FileText size={16} className="absolute left-3 top-2.5 text-text-muted" />
                           <input type="text" value={formData.description || ''} onChange={e => handleInputChange('description', e.target.value)} onBlur={() => handleBlur('description')} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50" placeholder="Voucher Narration" />
                       </div>
                       {errors.description && <span className="text-xs text-danger mt-1">{errors.description}</span>}
                   </div>
               </div>
               <div className="border border-border rounded-xl overflow-hidden bg-surface">
                   <div className="bg-surface-highlight px-4 py-2 border-b border-border grid grid-cols-12 gap-2 text-xs font-bold text-text-muted uppercase">
                       <div className="col-span-4">Account</div>
                       <div className="col-span-3">Description</div>
                       <div className="col-span-2 text-right">Debit</div>
                       <div className="col-span-2 text-right">Credit</div>
                       <div className="col-span-1"></div>
                   </div>
                   <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                       {formEntries.map((entry) => (
                           <div key={entry.id} className="px-4 py-2 border-b border-border/50 grid grid-cols-12 gap-2 items-start hover:bg-surface-highlight/30 transition-colors">
                               <div className="col-span-4">
                                   <select value={entry.accountId} onChange={e => updateEntry(entry.id, 'accountId', e.target.value)} className="w-full bg-transparent border border-border rounded-lg text-xs py-1.5 px-2 focus:border-primary focus:ring-1 focus:ring-primary/50">
                                       <option value="">Select Account</option>
                                       {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                   </select>
                               </div>
                               <div className="col-span-3">
                                   <input type="text" value={entry.description || ''} onChange={e => updateEntry(entry.id, 'description', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none text-xs py-1.5 px-1" placeholder="Narration" />
                               </div>
                               <div className="col-span-2">
                                   <input type="number" value={entry.debit || ''} onChange={e => { updateEntry(entry.id, 'debit', Number(e.target.value)); if (Number(e.target.value) > 0) updateEntry(entry.id, 'credit', 0); }} className="w-full bg-transparent text-right border border-border rounded-lg text-xs py-1.5 px-2 focus:border-primary focus:ring-1 focus:ring-primary/50" placeholder="0.00" />
                               </div>
                               <div className="col-span-2">
                                   <input type="number" value={entry.credit || ''} onChange={e => { updateEntry(entry.id, 'credit', Number(e.target.value)); if (Number(e.target.value) > 0) updateEntry(entry.id, 'debit', 0); }} className="w-full bg-transparent text-right border border-border rounded-lg text-xs py-1.5 px-2 focus:border-primary focus:ring-1 focus:ring-primary/50" placeholder="0.00" />
                               </div>
                               <div className="col-span-1 flex justify-center">
                                   <button onClick={() => removeEntry(entry.id)} className="text-text-muted hover:text-danger p-1 rounded transition-colors"><X size={14}/></button>
                               </div>
                           </div>
                       ))}
                   </div>
                   <button onClick={addEntry} className="w-full py-2 text-xs font-bold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1">
                       <Plus size={12}/> Add Line
                   </button>
               </div>
               {errors.entries && <p className="text-xs text-danger text-center font-bold bg-danger/10 p-2 rounded-lg border border-danger/20">{errors.entries}</p>}
               <div className="grid grid-cols-12 gap-2 px-4">
                   <div className="col-span-7 text-right font-bold text-sm text-text-muted py-2">Total:</div>
                   <div className={`col-span-2 text-right font-mono font-bold text-sm py-2 border-t-2 ${totalDebit !== totalCredit ? 'text-danger border-danger' : 'text-success border-success'}`}>{totalDebit.toLocaleString()}</div>
                   <div className={`col-span-2 text-right font-mono font-bold text-sm py-2 border-t-2 ${totalDebit !== totalCredit ? 'text-danger border-danger' : 'text-success border-success'}`}>{totalCredit.toLocaleString()}</div>
                   <div className="col-span-1"></div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t border-border">
                   <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main">Cancel</button>
                   <button onClick={handleSubmit} disabled={isSaving} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary-light flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
                       {isSaving ? 'Saving...' : <><Save size={16}/> Save Voucher</>}
                   </button>
               </div>
           </div>
       </Modal>
    </div>
  );
};

export default Journal;