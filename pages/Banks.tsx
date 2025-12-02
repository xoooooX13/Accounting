
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Partner } from '../types';
import { Search, Plus, Edit2, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, Save, Landmark, Mail, Phone, MapPin, CreditCard, GitBranch } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

const toProperCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
const formatPhone = (val: string) => { const clean = val.replace(/\D/g, ''); let f = '+'; if (clean.length > 0) f += clean.substring(0, 2); if (clean.length > 2) f += '-' + clean.substring(2, 5); if (clean.length > 5) f += '-' + clean.substring(5, 12); return f.substring(0, 16); };

const Banks = () => {
  const [banks, setBanks] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof Partner>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<Partial<Partner>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadBanks = async () => {
    setLoading(true);
    const data = await db.fetch(db.getPartners('bank'));
    setBanks(data);
    setLoading(false);
  };

  useEffect(() => { loadBanks(); }, []);

  const filteredData = banks.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.bankAccountNo?.includes(search) || b.branchCode?.includes(search));
  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    if (typeof aVal === 'number' && typeof bVal === 'number') return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    return sortDirection === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: keyof Partner) => {
      if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      else { setSortField(field); setSortDirection('asc'); }
  };

  const openModal = (bank?: Partner) => {
      setEditingBank(bank || null);
      setFormData(bank ? { ...bank } : { name: '', email: '', phone: '', address: '', bankAccountNo: '', branchCode: '' });
      setErrors({});
      setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof Partner, value: string) => {
      let finalValue = value;
      if (field === 'phone') finalValue = formatPhone(value);
      setFormData(prev => ({ ...prev, [field]: finalValue }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: keyof Partner) => {
      if (field === 'name' || field === 'address') setFormData(prev => ({ ...prev, [field]: toProperCase(prev[field] as string || '') }));
  };

  const validateForm = () => {
      const newErrors: Record<string, string> = {};
      if (!formData.name?.trim()) newErrors.name = 'Bank Name is required';
      if (!formData.address?.trim()) newErrors.address = 'Address is required';
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
      if (!validateForm()) return;
      setIsSaving(true);
      await new Promise(r => setTimeout(r, 600));
      try {
          db.savePartner({ ...formData, type: 'bank', accountId: '1111' });
          setIsModalOpen(false);
          loadBanks();
      } catch (e: any) { alert(e.message); } finally { setIsSaving(false); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this bank?')) {
          try { 
              db.deletePartner(id); 
              await loadBanks();
              alert('Bank account deleted successfully.'); 
          } catch (e: any) { 
              alert(e.message); 
          }
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-text-main tracking-tight">Banks</h1><p className="text-text-muted text-sm mt-1">Manage bank accounts and treasury.</p></div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95"><Plus size={18} /> Add Bank</button>
       </div>
       <div className="bg-surface rounded-2xl shadow-soft border border-border overflow-hidden">
          <div className="p-5 border-b border-border bg-surface/50 flex flex-col sm:flex-row gap-4 justify-between items-center"><div className="relative w-full sm:w-80 group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} /><input type="text" placeholder="Search banks..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-main focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" /></div></div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-surface-highlight border-b border-border">
                      <tr>
                          {[
                              { key: 'name', label: 'Bank Name', w: '25%' },
                              { key: 'bankAccountNo', label: 'Account Details', w: '25%' },
                              { key: 'email', label: 'Contact', w: '20%' },
                              { key: 'address', label: 'Address', w: '20%' },
                              { key: 'balance', label: 'Balance', w: '10%', align: 'right' },
                              { key: 'actions', label: '', w: '5%', align: 'right' }
                          ].map((col) => (
                              <th key={col.key} className={`px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-main transition-colors ${col.align === 'right' ? 'text-right' : ''}`} onClick={() => col.key !== 'actions' && handleSort(col.key as keyof Partner)} style={{ width: col.w }}><div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>{col.label}{col.key !== 'actions' && sortField === col.key && <ArrowUpDown size={12} className={sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'} />}</div></th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                      {loading ? <tr><td colSpan={6} className="p-8 text-center text-text-muted">Loading...</td></tr> : paginatedData.length === 0 ? <tr><td colSpan={6} className="p-12 text-center text-text-muted">No banks found.</td></tr> : paginatedData.map((bank) => (
                              <tr key={bank.id} className="hover:bg-surface-highlight transition-colors group">
                                  <td className="px-6 py-4"><div className="font-semibold text-text-main">{bank.name}</div><div className="text-xs text-text-muted mt-0.5 font-mono opacity-70">ID: {bank.id}</div></td>
                                  <td className="px-6 py-4"><div className="flex flex-col gap-1.5">{bank.bankAccountNo && <div className="flex items-center gap-2 text-text-main text-xs font-mono"><CreditCard size={12} className="text-text-muted"/> {bank.bankAccountNo}</div>}{bank.branchCode && <div className="flex items-center gap-2 text-text-muted text-xs"><GitBranch size={12}/> {bank.branchCode}</div>}</div></td>
                                  <td className="px-6 py-4"><div className="flex flex-col gap-1.5">{bank.phone && <div className="flex items-center gap-2 text-text-muted text-xs"><Phone size={12}/> {bank.phone}</div>}{bank.email && <div className="flex items-center gap-2 text-text-muted text-xs"><Mail size={12}/> {bank.email}</div>}</div></td>
                                  <td className="px-6 py-4 text-text-muted truncate max-w-xs">{bank.address}</td>
                                  <td className="px-6 py-4 text-right"><span className={`font-mono font-bold ${bank.balance >= 0 ? 'text-success' : 'text-danger'}`}>${bank.balance.toLocaleString()}</span></td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                          <button onClick={() => openModal(bank)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg"><Edit2 size={16} /></button>
                                          <button onClick={(e) => handleDelete(e, bank.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg"><Trash2 size={16} /></button>
                                      </div>
                                  </td>
                              </tr>
                      ))}
                  </tbody>
              </table>
          </div>
           {totalPages > 1 && <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-muted bg-surface/50"><span>Page {currentPage} of {totalPages}</span><div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-border hover:bg-surface-highlight disabled:opacity-50 transition-colors"><ChevronLeft size={16} /></button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-border hover:bg-surface-highlight disabled:opacity-50 transition-colors"><ChevronRight size={16} /></button></div></div>}
       </div>
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBank ? 'Edit Bank' : 'Add New Bank'} maxWidth="max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2"><label className="block text-xs font-semibold text-text-muted mb-1.5">Bank Name <span className="text-danger">*</span></label><input type="text" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} onBlur={() => handleBlur('name')} className={`w-full bg-surface-highlight border ${errors.name ? 'border-danger' : 'border-transparent'} rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:border-primary/30`} placeholder="Meezan Bank Ltd" />{errors.name && <span className="text-xs text-danger mt-1">{errors.name}</span>}</div>
              <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Branch Code</label><input type="text" value={formData.branchCode || ''} onChange={(e) => handleInputChange('branchCode', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:border-primary/30 font-mono text-sm" placeholder="0101" /></div>
              <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Account Number</label><input type="text" value={formData.bankAccountNo || ''} onChange={(e) => handleInputChange('bankAccountNo', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:border-primary/30 font-mono text-sm" placeholder="010101010101" /></div>
              <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Email</label><input type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:border-primary/30" /></div>
              <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Phone</label><input type="text" value={formData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:border-primary/30" /></div>
              <div className="md:col-span-2"><label className="block text-xs font-semibold text-text-muted mb-1.5">Address <span className="text-danger">*</span></label><textarea rows={2} value={formData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} onBlur={() => handleBlur('address')} className={`w-full bg-surface-highlight border ${errors.address ? 'border-danger' : 'border-transparent'} rounded-xl py-2.5 px-4 text-text-main focus:outline-none focus:border-primary/30 resize-none`} /></div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors">Cancel</button><button onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light shadow-lg shadow-primary/20 disabled:opacity-70 transition-all active:scale-95">{isSaving ? 'Saving...' : <><Save size={16} /> Save Bank</>}</button></div>
       </Modal>
    </div>
  );
};
export default Banks;
