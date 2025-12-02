


import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { DebitCreditNote, Partner, NoteType, TaxSetting, CompanyProfile } from '../types';
import { Plus, Search, Edit2, Trash2, Save, User, Calendar, DollarSign, FileText, Printer, FileDown, Percent } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { GenericTable, Column } from '../components/GenericTable';

const toProperCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const DebitCreditNotes = () => {
  const [notes, setNotes] = useState<DebitCreditNote[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [taxes, setTaxes] = useState<TaxSetting[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DebitCreditNote | null>(null);
  const [formData, setFormData] = useState<Partial<DebitCreditNote>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    loadData();
  }, [isModalOpen]);

  const loadData = () => {
    setNotes(db.getDebitCreditNotes());
    setPartners([...db.getPartners('customer'), ...db.getPartners('vendor')]);
    setTaxes(db.getTaxSettings());
    setCompany(db.getCompanyProfile());
  };

  const openModal = (note?: DebitCreditNote) => {
    setEditingNote(note || null);
    setFormData(note ? { ...note } : { 
        type: 'Credit Note', 
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        isTaxable: false,
        taxAmount: 0,
        grandTotal: 0,
        reason: '',
        status: 'Draft'
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof DebitCreditNote, value: any) => {
      setFormData(prev => {
          const updated = { ...prev, [field]: value };
          
          // Recalculate Totals
          if (field === 'amount' || field === 'taxId' || field === 'isTaxable') {
              const amount = Number(updated.amount || 0);
              let taxAmt = 0;
              let taxRate = 0;

              if (updated.isTaxable && updated.taxId) {
                  const tax = taxes.find(t => t.id === updated.taxId);
                  if (tax) {
                      taxRate = tax.rate;
                      taxAmt = amount * (taxRate / 100);
                  }
              } else {
                  updated.taxId = undefined;
              }
              
              updated.taxRate = taxRate;
              updated.taxAmount = taxAmt;
              updated.grandTotal = amount + taxAmt;
          }
          return updated;
      });
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: keyof DebitCreditNote) => {
      if (field === 'reason') {
          setFormData(prev => ({ ...prev, [field]: toProperCase(String(prev[field] || '')) }));
      }
  };

  const availablePartners = partners.filter(p => 
      formData.type === 'Credit Note' ? p.type === 'customer' : p.type === 'vendor'
  );

  const availableTaxes = taxes; // Can filter based on type if strict rule needed (e.g. Debit = GST, Credit = WHT)

  const handleSubmit = () => {
      const errs: Record<string, string> = {};
      if (!formData.partyId) errs.partyId = 'Party is required';
      if (!formData.amount || formData.amount <= 0) errs.amount = 'Valid amount required';
      if (!formData.reason?.trim()) errs.reason = 'Reason is required';
      if (formData.isTaxable && !formData.taxId) errs.taxId = 'Select Tax Rule';
      
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      db.saveDebitCreditNote(formData);
      setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
      if (confirm('Delete this note?')) {
          db.deleteDebitCreditNote(id);
          loadData();
      }
  };

  const handlePrint = (note: DebitCreditNote) => {
      const party = partners.find(p => p.id === note.partyId);
      const tax = taxes.find(t => t.id === note.taxId);
      
      const printWindow = window.open('', '', 'width=900,height=800');
      if (!printWindow) return;

      const htmlContent = `
        <html>
        <head>
            <title>Print ${note.type} - ${note.noteNo}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { font-family: 'Inter', sans-serif; background: white; color: black; -webkit-print-color-adjust: exact; }
                @page { size: A4; margin: 20mm; }
            </style>
        </head>
        <body class="p-8 max-w-4xl mx-auto">
            <!-- Header -->
            <div class="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                <div class="w-1/2">
                    <h1 class="text-4xl font-bold uppercase tracking-tight text-gray-900">${note.type}</h1>
                    <p class="text-sm text-gray-600 mt-1 font-medium uppercase">Original Copy</p>
                </div>
                <div class="w-1/2 text-right">
                    <h2 class="text-xl font-bold text-gray-900">${company?.name}</h2>
                    <p class="text-sm text-gray-600 whitespace-pre-wrap">${company?.address}</p>
                    <div class="mt-2 text-xs text-gray-500 space-y-0.5">
                        ${company?.phone ? `<p>Phone: ${company.phone}</p>` : ''}
                        ${company?.email ? `<p>Email: ${company.email}</p>` : ''}
                        ${company?.ntn ? `<p>NTN: ${company.ntn}</p>` : ''}
                    </div>
                </div>
            </div>

            <!-- Meta Info -->
            <div class="flex justify-between mb-10">
                <div class="w-1/2 pr-8">
                    <h3 class="text-xs font-bold text-gray-500 uppercase mb-2">Issued To</h3>
                    <div class="text-gray-900">
                        <p class="font-bold text-lg">${party?.name}</p>
                        <p class="text-sm text-gray-600 mt-1 whitespace-pre-wrap">${party?.address}</p>
                        <div class="mt-2 text-xs text-gray-500">
                            ${party?.ntn ? `<p>NTN: ${party.ntn}</p>` : ''}
                            ${party?.phone ? `<p>Contact: ${party.phone}</p>` : ''}
                        </div>
                    </div>
                </div>
                <div class="w-1/2 pl-8 flex flex-col gap-3 items-end">
                    <div class="text-right">
                        <p class="text-xs font-bold text-gray-500 uppercase">Note Number</p>
                        <p class="font-mono font-bold text-lg">${note.noteNo}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs font-bold text-gray-500 uppercase">Date Issued</p>
                        <p class="font-medium">${note.date}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs font-bold text-gray-500 uppercase">Status</p>
                        <span class="inline-block px-2 py-0.5 rounded text-xs font-bold border border-gray-300 text-gray-700 uppercase">${note.status}</span>
                    </div>
                </div>
            </div>

            <!-- Details Table -->
            <div class="mb-10">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b-2 border-gray-800">
                            <th class="py-3 text-xs font-bold text-gray-500 uppercase">Description / Reason</th>
                            <th class="py-3 text-xs font-bold text-gray-500 uppercase text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="border-b border-gray-200">
                            <td class="py-4 pr-4 align-top">
                                <p class="font-medium text-gray-900">${note.reason}</p>
                            </td>
                            <td class="py-4 pl-4 text-right align-top font-mono text-gray-900">
                                ${note.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Totals -->
            <div class="flex justify-end mb-16">
                <div class="w-64 space-y-3">
                    <div class="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span class="font-mono">${note.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    ${note.isTaxable && tax ? `
                    <div class="flex justify-between text-sm text-gray-600">
                        <span>${tax.name} (${tax.rate}%)</span>
                        <span class="font-mono">${note.taxAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    ` : ''}
                    <div class="flex justify-between text-lg font-bold text-gray-900 border-t-2 border-gray-800 pt-3">
                        <span>Total</span>
                        <span class="font-mono">${note.grandTotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <!-- Signatures -->
            <div class="flex justify-between items-end mt-auto pt-12">
                <div class="text-center">
                    <div class="w-40 border-b border-gray-400 mb-2"></div>
                    <p class="text-xs font-bold text-gray-500 uppercase">Prepared By</p>
                </div>
                <div class="text-center">
                    <div class="w-40 border-b border-gray-400 mb-2"></div>
                    <p class="text-xs font-bold text-gray-500 uppercase">Approved By</p>
                </div>
            </div>
            
            <div class="text-center mt-12 text-[10px] text-gray-400">
                <p>This is a system generated document and does not require a physical signature in some jurisdictions.</p>
                <p>Printed on ${new Date().toLocaleString()}</p>
            </div>

            <script>
                window.onload = () => { window.print(); }
            </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  const columns: Column<DebitCreditNote>[] = [
      { header: 'Date', accessor: 'date' },
      { header: 'Note #', accessor: 'noteNo', className: 'font-mono text-xs text-primary' },
      { 
          header: 'Type', 
          accessor: (n: DebitCreditNote) => (
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${n.type === 'Credit Note' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {n.type}
              </span>
          ) 
      },
      { header: 'Party', accessor: (n: DebitCreditNote) => partners.find(p => p.id === n.partyId)?.name || 'Unknown' },
      { header: 'Reason', accessor: 'reason', className: 'text-text-muted truncate max-w-xs' },
      { header: 'Total', accessor: (n: DebitCreditNote) => `$${(n.grandTotal || n.amount).toLocaleString()}`, className: 'text-right font-mono font-bold' },
      { 
          header: 'Status', 
          accessor: (n: DebitCreditNote) => (
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${n.status === 'Posted' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                  {n.status}
              </span>
          ) 
      },
      {
          header: 'Actions',
          accessor: (n: DebitCreditNote) => (
              <div className="flex justify-end gap-2">
                  <button onClick={() => handlePrint(n)} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Print / PDF"><Printer size={16} /></button>
                  <button onClick={() => openModal(n)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(n.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
          ),
          className: 'text-right'
      }
  ];

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Debit & Credit Notes</h1>
            <p className="text-text-muted text-sm mt-1">Manage returns, allowances, and adjustments.</p>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95">
             <Plus size={18} /> Create Note
          </button>
       </div>

       <GenericTable 
          data={notes} 
          columns={columns} 
          title="Notes History" 
       />

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingNote ? 'Edit Note' : 'Create Debit/Credit Note'}>
           <div className="space-y-5">
               {/* Type Toggle */}
               <div className="flex bg-surface-highlight rounded-xl p-1 border border-border">
                   <button 
                      onClick={() => setFormData({ ...formData, type: 'Credit Note', partyId: '' })} // Reset party on switch
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'Credit Note' ? 'bg-orange-500 text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
                   >
                       Credit Note (Sales Return/WHT)
                   </button>
                   <button 
                      onClick={() => setFormData({ ...formData, type: 'Debit Note', partyId: '' })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'Debit Note' ? 'bg-blue-500 text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
                   >
                       Debit Note (Purchase Return/GST)
                   </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                       <label className="text-xs font-semibold text-text-muted mb-1.5 block">Date</label>
                       <div className="relative">
                           <Calendar size={16} className="absolute left-3 top-2.5 text-text-muted" />
                           <input type="date" value={formData.date || ''} onChange={e => handleInputChange('date', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50" />
                       </div>
                   </div>
                   
                   <div>
                        <label className="text-xs font-semibold text-text-muted mb-1.5 block">
                            {formData.type === 'Credit Note' ? 'Customer' : 'Vendor'} <span className="text-danger">*</span>
                        </label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-2.5 text-text-muted" />
                            <select 
                                value={formData.partyId || ''} 
                                onChange={e => handleInputChange('partyId', e.target.value)} 
                                className={`w-full bg-surface-highlight border ${errors.partyId ? 'border-danger' : 'border-transparent'} rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50`}
                            >
                                <option value="">Select Party</option>
                                {availablePartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        {errors.partyId && <p className="text-xs text-danger mt-1">{errors.partyId}</p>}
                   </div>

                   <div className="md:col-span-2">
                       <label className="text-xs font-semibold text-text-muted mb-1.5 block">Reason / Description <span className="text-danger">*</span></label>
                       <textarea rows={2} value={formData.reason || ''} onChange={e => handleInputChange('reason', e.target.value)} onBlur={() => handleBlur('reason')} className={`w-full bg-surface-highlight border ${errors.reason ? 'border-danger' : 'border-transparent'} rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-primary/50 resize-none`} placeholder="e.g. Damaged goods returned..." />
                       {errors.reason && <p className="text-xs text-danger mt-1">{errors.reason}</p>}
                   </div>

                   <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-border">
                       <div>
                           <label className="text-xs font-semibold text-text-muted mb-1.5 block">Amount <span className="text-danger">*</span></label>
                           <div className="relative">
                               <DollarSign size={16} className="absolute left-3 top-2.5 text-text-muted" />
                               <input type="number" value={formData.amount || ''} onChange={e => handleInputChange('amount', e.target.value)} className={`w-full bg-surface-highlight border ${errors.amount ? 'border-danger' : 'border-transparent'} rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50`} placeholder="0.00" />
                           </div>
                           {errors.amount && <p className="text-xs text-danger mt-1">{errors.amount}</p>}
                       </div>

                       <div>
                           <div className="flex items-center justify-between mb-1.5">
                               <label className="text-xs font-semibold text-text-muted block">Tax Configuration</label>
                               <label className="flex items-center gap-2 cursor-pointer">
                                   <input type="checkbox" checked={formData.isTaxable || false} onChange={e => handleInputChange('isTaxable', e.target.checked)} className="rounded border-border text-primary focus:ring-primary" />
                                   <span className="text-xs text-text-main">Apply Tax?</span>
                               </label>
                           </div>
                           
                           {formData.isTaxable ? (
                               <div className="relative">
                                   <Percent size={16} className="absolute left-3 top-2.5 text-text-muted" />
                                   <select 
                                       value={formData.taxId || ''} 
                                       onChange={e => handleInputChange('taxId', e.target.value)} 
                                       className={`w-full bg-surface-highlight border ${errors.taxId ? 'border-danger' : 'border-transparent'} rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50`}
                                   >
                                       <option value="">Select Tax Rule</option>
                                       {availableTaxes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                                   </select>
                                   {errors.taxId && <p className="text-xs text-danger mt-1">{errors.taxId}</p>}
                               </div>
                           ) : (
                               <div className="w-full bg-surface-highlight/50 border border-transparent rounded-xl py-2 px-4 text-sm text-text-muted italic">
                                   No tax applied
                               </div>
                           )}
                       </div>
                   </div>
                   
                   <div className="md:col-span-2 bg-surface-highlight p-4 rounded-xl space-y-2">
                       <div className="flex justify-between text-sm">
                           <span className="text-text-muted">Subtotal</span>
                           <span className="font-mono">${Number(formData.amount || 0).toFixed(2)}</span>
                       </div>
                       {formData.isTaxable && (
                           <div className="flex justify-between text-sm">
                               <span className="text-text-muted">Tax Amount ({formData.taxRate || 0}%)</span>
                               <span className="font-mono text-warning">+${(formData.taxAmount || 0).toFixed(2)}</span>
                           </div>
                       )}
                       <div className="flex justify-between text-lg font-bold text-text-main pt-2 border-t border-border/50">
                           <span>Total</span>
                           <span className="font-mono text-primary">${(formData.grandTotal || 0).toFixed(2)}</span>
                       </div>
                   </div>
                   
                   <div>
                        <label className="text-xs font-semibold text-text-muted mb-1.5 block">Status</label>
                        <select value={formData.status || 'Draft'} onChange={e => handleInputChange('status', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-primary/50">
                            <option>Draft</option>
                            <option>Posted</option>
                        </select>
                   </div>
               </div>

               <div className="flex justify-end gap-3 pt-4 border-t border-border">
                   <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main">Cancel</button>
                   <button onClick={handleSubmit} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary-light flex items-center gap-2 shadow-lg shadow-primary/20"><Save size={16} /> Save Note</button>
               </div>
           </div>
       </Modal>
    </div>
  );
};

export default DebitCreditNotes;
