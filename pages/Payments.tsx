import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { PaymentRecord, Partner, TaxSetting, CompanyProfile, PaymentMethod } from '../types';
import { Search, Plus, Edit2, Trash2, Save, Printer, Calendar, User, Landmark, DollarSign, Percent, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { GenericTable, Column } from '../components/GenericTable';

const toProperCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const Payments = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [vendors, setVendors] = useState<Partner[]>([]);
  const [banks, setBanks] = useState<Partner[]>([]);
  const [taxes, setTaxes] = useState<TaxSetting[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof PaymentRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [formData, setFormData] = useState<Partial<PaymentRecord>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [isModalOpen]);

  const loadData = () => {
    setPayments(db.getPayments());
    setVendors(db.getPartners('vendor'));
    setBanks(db.getPartners('bank'));
    setTaxes(db.getTaxSettings()); 
    setCompany(db.getCompanyProfile());
  };

  const handleSort = (field: keyof PaymentRecord) => {
      if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      else { setSortField(field); setSortDirection('asc'); }
  };

  const filteredData = payments.filter(r => 
      r.voucherNo.toLowerCase().includes(search.toLowerCase()) || 
      vendors.find(c => c.id === r.vendorId)?.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      return sortDirection === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  // ... (Rest of Form Logic omitted for brevity, keeping imports and exports) ...
  
  const openModal = (pay?: PaymentRecord) => {
      setEditingPayment(pay || null);
      if (pay) { setFormData({ ...pay }); } 
      else { setFormData({ voucherNo: 'Auto Generated', date: new Date().toISOString().split('T')[0], grossAmount: 0, isWht: false, whtAmount: 0, netAmount: 0, paymentMethod: 'Cash', status: 'Draft' }); }
      setErrors({});
      setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof PaymentRecord, value: any) => {
      setFormData(prev => {
          const updated = { ...prev, [field]: value };
          if (['grossAmount', 'isWht', 'taxId'].includes(field)) {
              const gross = Number(updated.grossAmount || 0);
              let wht = 0;
              if (updated.isWht && updated.taxId) {
                  const tax = taxes.find(t => t.id === updated.taxId);
                  if (tax) { updated.whtRate = tax.rate; wht = gross * (tax.rate / 100); }
              } else if (!updated.isWht) { updated.taxId = undefined; updated.whtRate = undefined; }
              updated.whtAmount = wht;
              updated.netAmount = gross - wht;
          }
          return updated;
      });
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: keyof PaymentRecord) => {
      if (field === 'description') { setFormData(prev => ({ ...prev, [field]: toProperCase(String(prev[field] || '')) })); }
  };

  const handleSubmit = async () => {
      const errs: Record<string, string> = {};
      if (!formData.vendorId) errs.vendorId = 'Vendor is required';
      if (!formData.bankAccountId) errs.bankAccountId = 'Pay From Account is required';
      if (!formData.grossAmount || formData.grossAmount <= 0) errs.grossAmount = 'Valid amount required';
      if (formData.isWht && !formData.taxId) errs.taxId = 'Select WHT rate';
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
      setIsSaving(true);
      await new Promise(r => setTimeout(r, 500));
      db.savePayment(formData);
      setIsSaving(false);
      setIsModalOpen(false);
      loadData();
  };

  const handleDelete = (id: string) => {
      if (confirm("Delete this payment record?")) { db.deletePayment(id); loadData(); }
  };

  const handlePrint = (pay: PaymentRecord) => {
      const vendor = vendors.find(v => v.id === pay.vendorId);
      const bank = banks.find(b => b.id === pay.bankAccountId);
      const printWindow = window.open('', '', 'width=900,height=800');
      if (!printWindow) return;
      const htmlContent = `<html><head><title>Payment Voucher - ${pay.voucherNo}</title><script src="https://cdn.tailwindcss.com"></script><style>body { font-family: 'Inter', sans-serif; background: white; color: black; -webkit-print-color-adjust: exact; } @page { size: A4; margin: 20mm; }</style></head><body class="p-8 max-w-4xl mx-auto"><div class="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8"><div class="w-1/2"><h1 class="text-4xl font-bold uppercase tracking-tight text-gray-900">Payment Voucher</h1><p class="text-sm text-gray-600 mt-1 font-medium uppercase">Original Copy</p></div><div class="w-1/2 text-right"><h2 class="text-xl font-bold text-gray-900">${company?.name}</h2><p class="text-sm text-gray-600 whitespace-pre-wrap">${company?.address}</p><div class="mt-2 text-xs text-gray-500 space-y-0.5">${company?.phone ? `<p>Phone: ${company.phone}</p>` : ''}${company?.email ? `<p>Email: ${company.email}</p>` : ''}</div></div></div><div class="flex justify-between mb-10"><div class="w-1/2 pr-8"><h3 class="text-xs font-bold text-gray-500 uppercase mb-2">Paid To</h3><div class="text-gray-900"><p class="font-bold text-lg">${vendor?.name}</p><p class="text-sm text-gray-600 mt-1">${vendor?.address}</p>${vendor?.ntn ? `<p class="text-xs text-gray-500 mt-1">NTN: ${vendor.ntn}</p>` : ''}</div></div><div class="w-1/2 pl-8 flex flex-col gap-3 items-end"><div class="text-right"><p class="text-xs font-bold text-gray-500 uppercase">Voucher No</p><p class="font-mono font-bold text-lg">${pay.voucherNo}</p></div><div class="text-right"><p class="text-xs font-bold text-gray-500 uppercase">Date</p><p class="font-medium">${pay.date}</p></div></div></div><div class="mb-10 border border-gray-200 rounded-lg overflow-hidden"><table class="w-full text-left"><thead class="bg-gray-100 border-b border-gray-200"><tr><th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Description</th><th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Payment Mode</th><th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase text-right">Amount</th></tr></thead><tbody><tr class="border-b border-gray-200"><td class="py-4 px-4"><p class="font-medium text-gray-900">${pay.description || 'Payment on Account'}</p><p class="text-xs text-gray-500 mt-1">Paid From: ${bank?.name} (${bank?.bankAccountNo})</p></td><td class="py-4 px-4 text-sm text-gray-700">${pay.paymentMethod}${pay.chequeNo ? `<br/><span class="text-xs text-gray-500">Cheque #: ${pay.chequeNo}</span>` : ''}${pay.chequeDate ? `<br/><span class="text-xs text-gray-500">Date: ${pay.chequeDate}</span>` : ''}</td><td class="py-4 px-4 text-right font-mono font-bold text-gray-900">${pay.grossAmount.toLocaleString()}</td></tr></tbody></table></div><div class="flex justify-end mb-16"><div class="w-72 space-y-3"><div class="flex justify-between text-sm text-gray-600"><span>Gross Amount</span><span class="font-mono">${pay.grossAmount.toLocaleString()}</span></div>${pay.isWht ? `<div class="flex justify-between text-sm text-red-600"><span>Less: WHT Deduction (${pay.whtRate}%)</span><span class="font-mono">(${pay.whtAmount.toLocaleString()})</span></div>` : ''}<div class="flex justify-between text-lg font-bold text-gray-900 border-t-2 border-gray-800 pt-3"><span>Net Paid</span><span class="font-mono">${pay.netAmount.toLocaleString()}</span></div></div></div><div class="mt-auto pt-12 border-t border-gray-200"><div class="flex justify-between"><div class="text-center"><div class="w-40 border-b border-gray-400 mb-2"></div><p class="text-xs font-bold text-gray-500 uppercase">Prepared By</p></div><div class="text-center"><div class="w-40 border-b border-gray-400 mb-2"></div><p class="text-xs font-bold text-gray-500 uppercase">Receiver's Signature</p></div></div><p class="text-center text-[10px] text-gray-400 mt-12">System Generated Payment Voucher - ${new Date().toLocaleString()}</p></div><script>window.onload = () => { window.print(); }</script></body></html>`;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  const columns: Column<PaymentRecord>[] = [
      { header: 'Date', accessor: 'date', sortKey: 'date' },
      { header: 'Voucher #', accessor: 'voucherNo', className: 'font-mono text-xs text-primary', sortKey: 'voucherNo' },
      { header: 'Paid To', accessor: (p: PaymentRecord) => vendors.find(v => v.id === p.vendorId)?.name || 'Unknown' },
      { header: 'Payment', accessor: (p: PaymentRecord) => p.paymentMethod },
      { header: 'Gross', accessor: (p: PaymentRecord) => p.grossAmount.toLocaleString(), className: 'text-right font-mono', sortKey: 'grossAmount' },
      { 
          header: 'Net Paid', 
          accessor: (p: PaymentRecord) => `$${p.netAmount.toLocaleString()}`, 
          className: 'text-right font-mono font-bold text-danger',
          sortKey: 'netAmount'
      },
      {
          header: 'Actions',
          accessor: (p: PaymentRecord) => (
              <div className="flex justify-end gap-2">
                  <button onClick={() => handlePrint(p)} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Print"><Printer size={16} /></button>
                  <button onClick={() => openModal(p)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
          ),
          className: 'text-right'
      }
  ];

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Payments</h1>
            <p className="text-text-muted text-sm mt-1">Manage vendor payments and cash outflows.</p>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95">
             <Plus size={18} /> New Payment
          </button>
       </div>

       <GenericTable 
          data={sortedData} 
          columns={columns} 
          title="Payment History"
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection} 
       />

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPayment ? 'Edit Payment' : 'New Payment Voucher'} maxWidth="max-w-3xl">
           <div className="space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-4">
                       <div>
                           <label className="text-xs font-semibold text-text-muted mb-1.5 block">Date <span className="text-danger">*</span></label>
                           <div className="relative">
                               <Calendar size={16} className="absolute left-3 top-2.5 text-text-muted" />
                               <input type="date" value={formData.date || ''} onChange={e => handleInputChange('date', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50" />
                           </div>
                       </div>
                       <div>
                           <label className="text-xs font-semibold text-text-muted mb-1.5 block">Paid To (Vendor) <span className="text-danger">*</span></label>
                           <div className="relative">
                               <User size={16} className="absolute left-3 top-2.5 text-text-muted" />
                               <select value={formData.vendorId || ''} onChange={e => handleInputChange('vendorId', e.target.value)} className={`w-full bg-surface-highlight border ${errors.vendorId ? 'border-danger' : 'border-transparent'} rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50`}>
                                   <option value="">Select Vendor</option>
                                   {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                               </select>
                           </div>
                           {errors.vendorId && <span className="text-xs text-danger mt-1">{errors.vendorId}</span>}
                       </div>
                       <div>
                           <label className="text-xs font-semibold text-text-muted mb-1.5 block">Pay From (Bank/Cash) <span className="text-danger">*</span></label>
                           <div className="relative">
                               <Landmark size={16} className="absolute left-3 top-2.5 text-text-muted" />
                               <select value={formData.bankAccountId || ''} onChange={e => handleInputChange('bankAccountId', e.target.value)} className={`w-full bg-surface-highlight border ${errors.bankAccountId ? 'border-danger' : 'border-transparent'} rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50`}>
                                   <option value="">Select Account</option>
                                   {banks.map(b => <option key={b.id} value={b.id}>{b.name} (${b.balance})</option>)}
                               </select>
                           </div>
                           {errors.bankAccountId && <span className="text-xs text-danger mt-1">{errors.bankAccountId}</span>}
                       </div>
                   </div>
                   <div className="space-y-4 bg-surface-highlight/30 p-4 rounded-xl border border-border">
                       <div>
                           <label className="text-xs font-semibold text-text-muted mb-1.5 block">Gross Amount (Debit) <span className="text-danger">*</span></label>
                           <div className="relative">
                               <DollarSign size={16} className="absolute left-3 top-2.5 text-text-muted" />
                               <input type="number" value={formData.grossAmount || ''} onChange={e => handleInputChange('grossAmount', Number(e.target.value))} className={`w-full bg-surface border ${errors.grossAmount ? 'border-danger' : 'border-border'} rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50`} placeholder="0.00" />
                           </div>
                           {errors.grossAmount && <span className="text-xs text-danger mt-1">{errors.grossAmount}</span>}
                       </div>
                       <div>
                           <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                               <input type="checkbox" checked={formData.isWht || false} onChange={e => handleInputChange('isWht', e.target.checked)} className="rounded border-border text-primary focus:ring-primary" />
                               <span className="text-xs font-semibold text-text-main">Deduct WHT?</span>
                           </label>
                           {formData.isWht && (
                               <div className="relative">
                                   <Percent size={16} className="absolute left-3 top-2.5 text-text-muted" />
                                   <select value={formData.taxId || ''} onChange={e => handleInputChange('taxId', e.target.value)} className={`w-full bg-surface border ${errors.taxId ? 'border-danger' : 'border-border'} rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50`}>
                                       <option value="">Select Tax Rate</option>
                                       {taxes.filter(t => t.type === 'WHT' || t.type === 'Income Tax').map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                                   </select>
                               </div>
                           )}
                           {errors.taxId && <span className="text-xs text-danger mt-1">{errors.taxId}</span>}
                       </div>
                       <div className="pt-2 border-t border-border">
                           <div className="flex justify-between text-sm mb-1">
                               <span className="text-text-muted">WHT Deducted</span>
                               <span className="font-mono text-success">-{formData.whtAmount?.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-lg font-bold text-text-main">
                               <span>Net Paid</span>
                               <span className="font-mono text-danger">${formData.netAmount?.toLocaleString()}</span>
                           </div>
                       </div>
                   </div>
               </div>
               <div className="pt-4 border-t border-border">
                   <label className="text-xs font-semibold text-text-muted mb-2 block">Payment Method</label>
                   <div className="flex gap-2 mb-4">
                       {(['Cash', 'Cheque', 'Online Transfer'] as PaymentMethod[]).map(m => (
                           <button key={m} onClick={() => handleInputChange('paymentMethod', m)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${formData.paymentMethod === m ? 'bg-primary text-white border-primary' : 'bg-surface-highlight text-text-muted border-transparent hover:bg-surface-highlight/80'}`}>{m}</button>
                       ))}
                   </div>
                   {formData.paymentMethod === 'Cheque' && (
                       <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                           <div>
                               <label className="text-xs font-semibold text-text-muted mb-1.5 block">Cheque Number</label>
                               <input type="text" value={formData.chequeNo || ''} onChange={e => handleInputChange('chequeNo', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 px-4 text-sm" />
                           </div>
                           <div>
                               <label className="text-xs font-semibold text-text-muted mb-1.5 block">Cheque Date</label>
                               <input type="date" value={formData.chequeDate || ''} onChange={e => handleInputChange('chequeDate', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 px-4 text-sm" />
                           </div>
                       </div>
                   )}
               </div>
               <div>
                   <label className="text-xs font-semibold text-text-muted mb-1.5 block">Description / Reference</label>
                   <textarea rows={2} value={formData.description || ''} onChange={e => handleInputChange('description', e.target.value)} onBlur={() => handleBlur('description')} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 px-4 text-sm resize-none focus:ring-2 focus:ring-primary/50" placeholder="Payment details, Invoice #, etc." />
               </div>
               <div className="flex justify-end gap-3 pt-4">
                   <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main">Cancel</button>
                   <button onClick={handleSubmit} disabled={isSaving} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary-light flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
                       {isSaving ? 'Saving...' : <><Save size={16}/> Save Payment</>}
                   </button>
               </div>
           </div>
       </Modal>
    </div>
  );
};

export default Payments;