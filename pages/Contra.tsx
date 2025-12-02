import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { ContraVoucher, ChartOfAccount, CompanyProfile, PaymentMethod } from '../types';
import { Search, Plus, Edit2, Trash2, Save, Printer, Calendar, FileText, ArrowRightLeft } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { GenericTable, Column } from '../components/GenericTable';

const toProperCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const Contra = () => {
  const [vouchers, setVouchers] = useState<ContraVoucher[]>([]);
  const [cashBankAccounts, setCashBankAccounts] = useState<ChartOfAccount[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof ContraVoucher>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<ContraVoucher | null>(null);
  const [formData, setFormData] = useState<Partial<ContraVoucher>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [isModalOpen]);

  const loadData = () => {
    setVouchers(db.getContraVouchers());
    setCashBankAccounts(db.getCashBankAccounts());
    setCompany(db.getCompanyProfile());
  };

  const handleSort = (field: keyof ContraVoucher) => {
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

  const openModal = (cv?: ContraVoucher) => {
      setEditingVoucher(cv || null);
      if (cv) {
          setFormData({ ...cv });
      } else {
          setFormData({
              voucherNo: 'Auto Generated',
              date: new Date().toISOString().split('T')[0],
              description: '',
              paymentMethod: 'Cash',
              status: 'Draft',
              amount: 0
          });
      }
      setErrors({});
      setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof ContraVoucher, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: keyof ContraVoucher) => {
      if (field === 'description') {
          setFormData(prev => ({ ...prev, [field]: toProperCase(String(prev[field] || '')) }));
      }
  };

  const handleSubmit = async () => {
      const errs: Record<string, string> = {};
      if (!formData.date) errs.date = 'Date is required';
      if (!formData.fromAccountId) errs.fromAccountId = 'Source account is required';
      if (!formData.toAccountId) errs.toAccountId = 'Destination account is required';
      if (formData.fromAccountId === formData.toAccountId) errs.toAccountId = 'Source and destination cannot be same';
      if (!formData.amount || formData.amount <= 0) errs.amount = 'Valid amount is required';
      
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setIsSaving(true);
      await new Promise(r => setTimeout(r, 500));
      
      db.saveContraVoucher(formData);
      
      setIsSaving(false);
      setIsModalOpen(false);
      loadData();
  };

  const handleDelete = (id: string) => {
      if (confirm("Delete this contra voucher?")) {
          db.deleteContraVoucher(id);
          loadData();
      }
  };

  const handlePrint = (cv: ContraVoucher) => {
      const from = cashBankAccounts.find(a => a.id === cv.fromAccountId);
      const to = cashBankAccounts.find(a => a.id === cv.toAccountId);
      
      const printWindow = window.open('', '', 'width=900,height=800');
      if (!printWindow) return;

      const htmlContent = `
        <html>
        <head>
            <title>Contra Voucher - ${cv.voucherNo}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { font-family: 'Inter', sans-serif; background: white; color: black; -webkit-print-color-adjust: exact; }
                @page { size: A4; margin: 20mm; }
            </style>
        </head>
        <body class="p-8 max-w-4xl mx-auto">
            <div class="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                <div class="w-1/2">
                    <h1 class="text-4xl font-bold uppercase tracking-tight text-gray-900">Contra Voucher</h1>
                    <p class="text-sm text-gray-600 mt-1 font-medium uppercase">Cash / Bank Transfer</p>
                </div>
                <div class="w-1/2 text-right">
                    <h2 class="text-xl font-bold text-gray-900">${company?.name}</h2>
                    <p class="text-sm text-gray-600 whitespace-pre-wrap">${company?.address}</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-8 mb-12">
                <div class="p-4 border border-gray-300 rounded-lg">
                    <p class="text-xs font-bold text-gray-500 uppercase mb-1">Withdrawn From (Credit)</p>
                    <p class="font-bold text-lg">${from?.name}</p>
                    <p class="font-mono text-sm text-gray-600">${from?.code}</p>
                </div>
                <div class="p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <p class="text-xs font-bold text-gray-500 uppercase mb-1">Deposited To (Debit)</p>
                    <p class="font-bold text-lg">${to?.name}</p>
                    <p class="font-mono text-sm text-gray-600">${to?.code}</p>
                </div>
            </div>

            <div class="flex justify-between mb-8">
                <div>
                    <p class="text-xs font-bold text-gray-500 uppercase">Description</p>
                    <p class="text-lg mt-1">${cv.description}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs font-bold text-gray-500 uppercase">Amount</p>
                    <p class="text-3xl font-bold font-mono mt-1">${cv.amount.toLocaleString()}</p>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4 text-sm text-gray-600 border-t border-b border-gray-200 py-4 mb-16">
                <div>Voucher No: <span class="font-mono font-bold text-black">${cv.voucherNo}</span></div>
                <div>Date: <span class="font-medium text-black">${cv.date}</span></div>
                <div>Method: <span class="font-medium text-black">${cv.paymentMethod}</span> ${cv.chequeNo ? `(${cv.chequeNo})` : ''}</div>
            </div>

            <div class="grid grid-cols-2 gap-12 mt-auto">
                <div class="text-center">
                    <div class="border-b border-gray-400 mb-2 h-8"></div>
                    <p class="text-xs font-bold text-gray-500 uppercase">Authorized Signature</p>
                </div>
                <div class="text-center">
                    <div class="border-b border-gray-400 mb-2 h-8"></div>
                    <p class="text-xs font-bold text-gray-500 uppercase">Received By</p>
                </div>
            </div>
            <script>window.onload = () => { window.print(); }</script>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  const columns: Column<ContraVoucher>[] = [
      { header: 'Date', accessor: 'date', sortKey: 'date' },
      { header: 'CV #', accessor: 'voucherNo', className: 'font-mono text-xs text-primary', sortKey: 'voucherNo' },
      { header: 'From (Cr)', accessor: (v) => cashBankAccounts.find(a => a.id === v.fromAccountId)?.name || v.fromAccountId },
      { header: 'To (Dr)', accessor: (v) => cashBankAccounts.find(a => a.id === v.toAccountId)?.name || v.toAccountId },
      { header: 'Amount', accessor: (v) => v.amount.toLocaleString(), className: 'text-right font-mono font-bold', sortKey: 'amount' },
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
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Contra Vouchers</h1>
            <p className="text-text-muted text-sm mt-1">Manage cash deposits, withdrawals and transfers.</p>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95">
             <Plus size={18} /> New Transfer
          </button>
       </div>

       <GenericTable 
          data={sortedData} 
          columns={columns} 
          title="Transfer History"
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
       />

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVoucher ? 'Edit Transfer' : 'New Cash/Bank Transfer'} maxWidth="max-w-2xl">
           <div className="space-y-5">
               <div>
                   <label className="text-xs font-semibold text-text-muted mb-1.5 block">Date <span className="text-danger">*</span></label>
                   <div className="relative">
                       <Calendar size={16} className="absolute left-3 top-2.5 text-text-muted" />
                       <input type="date" value={formData.date || ''} onChange={e => handleInputChange('date', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50" />
                   </div>
                   {errors.date && <span className="text-xs text-danger mt-1">{errors.date}</span>}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                       <label className="text-xs font-semibold text-text-muted mb-1.5 block">From Account (Source) <span className="text-danger">*</span></label>
                       <select value={formData.fromAccountId || ''} onChange={e => handleInputChange('fromAccountId', e.target.value)} className={`w-full bg-surface-highlight border ${errors.fromAccountId ? 'border-danger' : 'border-transparent'} rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/50`}>
                           <option value="">Select Account</option>
                           {cashBankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>)}
                       </select>
                       {errors.fromAccountId && <span className="text-xs text-danger mt-1">{errors.fromAccountId}</span>}
                   </div>
                   
                   <div>
                       <label className="text-xs font-semibold text-text-muted mb-1.5 block">To Account (Destination) <span className="text-danger">*</span></label>
                       <select value={formData.toAccountId || ''} onChange={e => handleInputChange('toAccountId', e.target.value)} className={`w-full bg-surface-highlight border ${errors.toAccountId ? 'border-danger' : 'border-transparent'} rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/50`}>
                           <option value="">Select Account</option>
                           {cashBankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>)}
                       </select>
                       {errors.toAccountId && <span className="text-xs text-danger mt-1">{errors.toAccountId}</span>}
                   </div>
               </div>

               <div className="flex items-center justify-center py-2">
                   <ArrowRightLeft className="text-text-muted animate-pulse" />
               </div>

               <div>
                   <label className="text-xs font-semibold text-text-muted mb-1.5 block">Amount <span className="text-danger">*</span></label>
                   <input type="number" value={formData.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} className={`w-full bg-surface-highlight border ${errors.amount ? 'border-danger' : 'border-transparent'} rounded-xl py-2 px-4 text-sm font-mono focus:ring-2 focus:ring-primary/50`} placeholder="0.00" />
                   {errors.amount && <span className="text-xs text-danger mt-1">{errors.amount}</span>}
               </div>

               <div>
                   <label className="text-xs font-semibold text-text-muted mb-1.5 block">Description</label>
                   <input type="text" value={formData.description || ''} onChange={e => handleInputChange('description', e.target.value)} onBlur={() => handleBlur('description')} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-primary/50" placeholder="e.g. Cash deposit for daily expenses" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                       <label className="text-xs font-semibold text-text-muted mb-1.5 block">Method</label>
                       <select value={formData.paymentMethod || 'Cash'} onChange={e => handleInputChange('paymentMethod', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/50">
                           <option>Cash</option>
                           <option>Cheque</option>
                           <option>Online Transfer</option>
                       </select>
                   </div>
                   {formData.paymentMethod === 'Cheque' && (
                       <div>
                           <label className="text-xs font-semibold text-text-muted mb-1.5 block">Cheque No</label>
                           <input type="text" value={formData.chequeNo || ''} onChange={e => handleInputChange('chequeNo', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/50" />
                       </div>
                   )}
               </div>

               <div className="flex justify-end gap-3 pt-4 border-t border-border">
                   <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main">Cancel</button>
                   <button onClick={handleSubmit} disabled={isSaving} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary-light flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
                       {isSaving ? 'Saving...' : <><Save size={16}/> Save Transfer</>}
                   </button>
               </div>
           </div>
       </Modal>
    </div>
  );
};

export default Contra;