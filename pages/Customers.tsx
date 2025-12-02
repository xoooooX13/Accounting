
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Partner } from '../types';
import { Search, Plus, Edit2, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, Save, User, Mail, Phone, MapPin, CreditCard, Hash } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

const toProperCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
const formatNTN = (val: string) => { const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, ''); return clean.length > 7 ? clean.slice(0, clean.length - 1) + '-' + clean.slice(clean.length - 1) : clean; };
const formatSTRN = (val: string) => { const clean = val.replace(/\D/g, ''); let f = clean; if (clean.length > 2) f = clean.slice(0, 2) + '-' + clean.slice(2); if (clean.length > 4) f = f.slice(0, 5) + '-' + clean.slice(4); if (clean.length > 8) f = f.slice(0, 10) + '-' + clean.slice(8); if (clean.length > 11) f = f.slice(0, 14) + '-' + clean.slice(11); return f.slice(0, 17); };
const formatCNIC = (val: string) => { const clean = val.replace(/\D/g, ''); let f = clean; if (clean.length > 5) f = clean.slice(0, 5) + '-' + clean.slice(5); if (clean.length > 12) f = f.slice(0, 13) + '-' + clean.slice(12); return f.slice(0, 15); };

const Customers = () => {
  const [customers, setCustomers] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof Partner>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<Partial<Partner>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    const data = await db.fetch(db.getPartners('customer'));
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => { loadCustomers(); }, []);

  const filteredData = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
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

  const openModal = (customer?: Partner) => {
      setEditingCustomer(customer || null);
      setFormData(customer ? { ...customer } : { name: '', email: '', phone: '', address: '', ntn: '', strn: '', cnic: '' });
      setErrors({});
      setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof Partner, value: string) => {
      let finalValue = value;
      if (field === 'ntn') finalValue = formatNTN(value);
      if (field === 'strn') finalValue = formatSTRN(value);
      if (field === 'cnic') finalValue = formatCNIC(value);
      setFormData(prev => ({ ...prev, [field]: finalValue }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: keyof Partner) => {
      if (field === 'name' || field === 'address') setFormData(prev => ({ ...prev, [field]: toProperCase(prev[field] as string || '') }));
  };

  const validateForm = () => {
      const newErrors: Record<string, string> = {};
      if (!formData.name?.trim()) newErrors.name = 'Name is required';
      if (!formData.address?.trim()) newErrors.address = 'Address is required';
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
      if (formData.ntn && !/^((?:[A-Z]\d{6}|\d{7})-\d)$/.test(formData.ntn)) newErrors.ntn = 'Invalid NTN';
      if (formData.strn && !/^\d{2}-\d{2}-\d{4}-\d{3}-\d{2}$/.test(formData.strn)) newErrors.strn = 'Invalid STRN';
      if (formData.cnic && !/^\d{5}-\d{7}-\d$/.test(formData.cnic)) newErrors.cnic = 'Invalid CNIC';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
      if (!validateForm()) return;
      setIsSaving(true);
      await new Promise(r => setTimeout(r, 600)); 
      try {
          db.savePartner({ ...formData, type: 'customer', accountId: '1121' });
          setIsModalOpen(false);
          loadCustomers();
      } catch (e: any) { alert(e.message); } finally { setIsSaving(false); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
          try {
              db.deletePartner(id);
              await loadCustomers();
              alert('Customer deleted successfully.');
          } catch (e: any) {
              alert(e.message);
          }
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-text-main tracking-tight">Customers</h1><p className="text-text-muted text-sm mt-1">Manage client relationships and receivables.</p></div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95"><Plus size={18} /> Add Customer</button>
       </div>
       <div className="bg-surface rounded-2xl shadow-soft border border-border overflow-hidden">
          <div className="p-5 border-b border-border bg-surface/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-80 group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} /><input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-main focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"/></div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-surface-highlight border-b border-border">
                      <tr>
                          {[
                              { key: 'name', label: 'Customer Name', w: '30%' },
                              { key: 'email', label: 'Contact Info', w: '25%' },
                              { key: 'address', label: 'Address', w: '25%' },
                              { key: 'balance', label: 'Balance', w: '10%', align: 'right' },
                              { key: 'actions', label: 'Actions', w: '10%', align: 'right' }
                          ].map((col) => (
                              <th key={col.key} className={`px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-main transition-colors ${col.align === 'right' ? 'text-right' : ''}`} onClick={() => col.key !== 'actions' && handleSort(col.key as keyof Partner)} style={{ width: col.w }}><div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>{col.label}{col.key !== 'actions' && sortField === col.key && (<ArrowUpDown size={12} className={sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'} />)}</div></th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                      {loading ? (<tr><td colSpan={5} className="p-8 text-center text-text-muted animate-pulse">Loading customers...</td></tr>) : paginatedData.length === 0 ? (<tr><td colSpan={5} className="p-12 text-center text-text-muted">No customers found.</td></tr>) : (
                          paginatedData.map((customer) => (
                              <tr key={customer.id} className="hover:bg-surface-highlight transition-colors group">
                                  <td className="px-6 py-4"><div className="font-semibold text-text-main">{customer.name}</div><div className="text-xs text-text-muted mt-0.5 font-mono opacity-70">ID: {customer.id}</div></td>
                                  <td className="px-6 py-4"><div className="flex flex-col gap-1.5">{customer.email && <div className="flex items-center gap-2 text-text-muted text-xs"><Mail size={12}/> {customer.email}</div>}{customer.phone && <div className="flex items-center gap-2 text-text-muted text-xs"><Phone size={12}/> {customer.phone}</div>}</div></td>
                                  <td className="px-6 py-4 text-text-muted truncate max-w-xs" title={customer.address}>{customer.address}</td>
                                  <td className="px-6 py-4 text-right"><span className={`font-mono font-bold ${customer.balance > 0 ? 'text-success' : 'text-text-main'}`}>${customer.balance.toLocaleString()}</span></td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                          <button onClick={() => openModal(customer)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                          <button onClick={(e) => handleDelete(e, customer.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
          {totalPages > 1 && (<div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-muted bg-surface/50"><span>Page {currentPage} of {totalPages}</span><div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /></button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16} /></button></div></div>)}
       </div>
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add New Customer'} maxWidth="max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2"><label className="block text-xs font-semibold text-text-muted mb-1.5">Customer Name <span className="text-danger">*</span></label><div className="relative group"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} /><input type="text" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} onBlur={() => handleBlur('name')} className={`w-full bg-surface-highlight border ${errors.name ? 'border-danger' : 'border-transparent'} rounded-xl py-2.5 pl-10 pr-4 text-text-main focus:outline-none focus:border-primary/30`} placeholder="Business or Person Name" /></div>{errors.name && <span className="text-xs text-danger mt-1">{errors.name}</span>}</div>
              <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Email</label><div className="relative group"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} /><input type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className={`w-full bg-surface-highlight border ${errors.email ? 'border-danger' : 'border-transparent'} rounded-xl py-2.5 pl-10 pr-4 text-text-main focus:outline-none focus:border-primary/30`} placeholder="email@example.com" /></div>{errors.email && <span className="text-xs text-danger mt-1">{errors.email}</span>}</div>
              <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Phone</label><div className="relative group"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} /><input type="text" value={formData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-text-main focus:outline-none focus:border-primary/30" placeholder="0300-0000000" /></div></div>
              <div className="md:col-span-2"><label className="block text-xs font-semibold text-text-muted mb-1.5">Address <span className="text-danger">*</span></label><div className="relative group"><MapPin className="absolute left-3 top-3 text-text-muted group-focus-within:text-primary transition-colors" size={16} /><textarea rows={2} value={formData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} onBlur={() => handleBlur('address')} className={`w-full bg-surface-highlight border ${errors.address ? 'border-danger' : 'border-transparent'} rounded-xl py-2.5 pl-10 pr-4 text-text-main focus:outline-none focus:border-primary/30 resize-none`} placeholder="Street address, City" /></div>{errors.address && <span className="text-xs text-danger mt-1">{errors.address}</span>}</div>
              <div className="md:col-span-2 mt-2 pt-4 border-t border-border"><h4 className="text-sm font-bold text-text-main mb-3 flex items-center gap-2"><CreditCard size={16} className="text-primary"/> Tax & Identification</h4></div>
              <div><label className="block text-xs font-semibold text-text-muted mb-1.5">NTN</label><div className="relative group"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} /><input type="text" value={formData.ntn || ''} onChange={(e) => handleInputChange('ntn', e.target.value)} className={`w-full bg-surface-highlight border ${errors.ntn ? 'border-danger' : 'border-transparent'} rounded-xl py-2.5 pl-10 pr-4 text-text-main focus:outline-none focus:border-primary/30 font-mono text-sm`} placeholder="A000000-0" /></div>{errors.ntn && <span className="text-xs text-danger mt-1">{errors.ntn}</span>}</div>
              <div><label className="block text-xs font-semibold text-text-muted mb-1.5">STRN</label><div className="relative group"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} /><input type="text" value={formData.strn || ''} onChange={(e) => handleInputChange('strn', e.target.value)} className={`w-full bg-surface-highlight border ${errors.strn ? 'border-danger' : 'border-transparent'} rounded-xl py-2.5 pl-10 pr-4 text-text-main focus:outline-none focus:border-primary/30 font-mono text-sm`} placeholder="00-00-0000-000-00" /></div>{errors.strn && <span className="text-xs text-danger mt-1">{errors.strn}</span>}</div>
              <div><label className="block text-xs font-semibold text-text-muted mb-1.5">CNIC</label><div className="relative group"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} /><input type="text" value={formData.cnic || ''} onChange={(e) => handleInputChange('cnic', e.target.value)} className={`w-full bg-surface-highlight border ${errors.cnic ? 'border-danger' : 'border-transparent'} rounded-xl py-2.5 pl-10 pr-4 text-text-main focus:outline-none focus:border-primary/30 font-mono text-sm`} placeholder="00000-0000000-0" /></div>{errors.cnic && <span className="text-xs text-danger mt-1">{errors.cnic}</span>}</div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors">Cancel</button><button onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light shadow-lg shadow-primary/20 disabled:opacity-70 transition-all active:scale-95">{isSaving ? 'Saving...' : <><Save size={16} /> Save Customer</>}</button></div>
       </Modal>
    </div>
  );
};
export default Customers;
