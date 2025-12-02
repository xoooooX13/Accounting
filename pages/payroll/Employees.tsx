

import React, { useEffect, useRef, useState } from 'react';
import { db } from '../../services/mockDb';
import { Employee, Designation, Gender } from '../../types';
import { Search, Plus, Edit2, Trash2, Save, Upload, User, Mail, Phone, MapPin, Hash, Briefcase, DollarSign, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

const toProperCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
const formatPhone = (val: string) => { const clean = val.replace(/\D/g, ''); let f = '+'; if (clean.length > 0) f += clean.substring(0, 2); if (clean.length > 2) f += '-' + clean.substring(2, 5); if (clean.length > 5) f += '-' + clean.substring(5, 12); return f.substring(0, 16); };
const formatCNIC = (val: string) => { const clean = val.replace(/\D/g, ''); let f = clean; if (clean.length > 5) f = clean.slice(0, 5) + '-' + clean.slice(5); if (clean.length > 12) f = f.slice(0, 13) + '-' + clean.slice(12); return f.slice(0, 15); };

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEmployees(db.getEmployees());
    setDesignations(db.getDesignations());
  }, [isModalOpen]);

  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.employeeId.toLowerCase().includes(search.toLowerCase()));

  const openModal = (emp?: Employee) => {
    setEditingEmployee(emp || null);
    setFormData(emp ? { ...emp } : { name: '', gender: 'Male', basicSalary: 0, dutyHours: 8, status: 'Active', joiningDate: new Date().toISOString().split('T')[0] });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof Employee, value: any) => {
      let finalVal = value;
      if (field === 'phone') finalVal = formatPhone(value);
      if (field === 'cnic') finalVal = formatCNIC(value);
      setFormData(prev => ({ ...prev, [field]: finalVal }));
  };

  const handleBlur = (field: keyof Employee) => {
      if (['name', 'fatherName', 'address'].includes(field)) {
          setFormData(prev => ({ ...prev, [field]: toProperCase(String(prev[field] || '')) }));
      }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
          reader.readAsDataURL(file);
      }
  };

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!formData.name?.trim()) errs.name = 'Name is required';
    if (!formData.designationId) errs.designationId = 'Designation is required';
    if (!formData.joiningDate) errs.joiningDate = 'Joining Date is required';
    
    // Termination Validation
    if (formData.status !== 'Active') {
        if (!formData.terminationDate) errs.terminationDate = 'Date is required';
        if (!formData.terminationReason) errs.terminationReason = 'Reason is required';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    
    // Clear termination fields if active
    if (formData.status === 'Active') {
        formData.terminationDate = undefined;
        formData.terminationReason = undefined;
    }

    db.saveEmployee(formData);
    setIsModalOpen(false);
    setEmployees(db.getEmployees());
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm('Delete this employee?')) {
          try {
              db.deleteEmployee(id);
              setEmployees(db.getEmployees());
              alert('Employee deleted.');
          } catch (e: any) {
              alert(e.message);
          }
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <div><h1 className="text-2xl font-bold text-text-main">Employees</h1><p className="text-sm text-text-muted">Manage workforce profiles</p></div>
         <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-primary/20"><Plus size={18}/> Add Employee</button>
       </div>
       <div className="bg-surface rounded-2xl shadow-soft border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-surface/50"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} /><input type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div></div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead className="bg-surface-highlight border-b border-border">
                   <tr><th className="px-6 py-3 font-bold text-text-muted uppercase text-xs">Employee</th><th className="px-6 py-3 font-bold text-text-muted uppercase text-xs">Designation</th><th className="px-6 py-3 font-bold text-text-muted uppercase text-xs">Status</th><th className="px-6 py-3 font-bold text-text-muted uppercase text-xs text-right">Duty Time</th><th className="px-6 py-3 font-bold text-text-muted uppercase text-xs text-right">Salary</th><th className="px-6 py-3 font-bold text-text-muted uppercase text-xs text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                   {filtered.map(emp => (
                      <tr key={emp.id} className="hover:bg-surface-highlight transition-colors">
                         <td className="px-6 py-4"><div className="flex items-center gap-3"><img src={emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} className="w-10 h-10 rounded-full object-cover border border-border" /><div><div className="font-medium text-text-main">{emp.name}</div><div className="text-xs text-text-muted font-mono">{emp.employeeId}</div></div></div></td>
                         <td className="px-6 py-4 text-text-main">{designations.find(d => d.id === emp.designationId)?.title || '-'}</td>
                         <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${emp.status === 'Active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{emp.status}</span></td>
                         <td className="px-6 py-4 text-right"><span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">{emp.dutyHours || 8} Hours</span></td>
                         <td className="px-6 py-4 text-right font-mono text-text-main">${emp.basicSalary.toLocaleString()}</td>
                         <td className="px-6 py-4 text-right">
                            <button onClick={() => openModal(emp)} className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-lg mr-1"><Edit2 size={16}/></button>
                            <button onClick={(e) => handleDelete(e, emp.id)} className="text-danger hover:bg-danger/10 p-2 rounded-lg"><Trash2 size={16}/></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
       
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmployee ? 'Edit Employee' : 'New Employee'} maxWidth="max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="flex flex-col items-center"><div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary overflow-hidden relative group bg-surface-highlight">{formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover" /> : <Upload className="text-text-muted" />}<div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-xs font-bold">Change</span></div></div><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} /><p className="text-xs text-text-muted mt-2">Click to upload picture</p></div>
             <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="text-xs font-semibold text-text-muted">Full Name <span className="text-danger">*</span></label><div className="relative"><User size={16} className="absolute left-3 top-2.5 text-text-muted"/><input type="text" value={formData.name || ''} onChange={e => handleInputChange('name', e.target.value)} onBlur={() => handleBlur('name')} className={`w-full bg-surface-highlight border ${errors.name ? 'border-danger' : 'border-transparent'} rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50`} /></div></div>
                <div><label className="text-xs font-semibold text-text-muted">Designation <span className="text-danger">*</span></label><div className="relative"><Briefcase size={16} className="absolute left-3 top-2.5 text-text-muted"/><select value={formData.designationId || ''} onChange={e => handleInputChange('designationId', e.target.value)} className={`w-full bg-surface-highlight border ${errors.designationId ? 'border-danger' : 'border-transparent'} rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none`}><option value="">Select Designation</option>{designations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</select></div></div>
                <div>
                    <label className="text-xs font-semibold text-text-muted">Default Duty Time</label>
                    <div className="relative">
                        <Clock size={16} className="absolute left-3 top-2.5 text-text-muted"/>
                        <select value={formData.dutyHours || 8} onChange={e => handleInputChange('dutyHours', Number(e.target.value))} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                            <option value={8}>8 Hours</option>
                            <option value={12}>12 Hours</option>
                        </select>
                    </div>
                </div>
                <div><label className="text-xs font-semibold text-text-muted">Basic Salary</label><div className="relative"><DollarSign size={16} className="absolute left-3 top-2.5 text-text-muted"/><input type="number" value={formData.basicSalary || ''} onChange={e => handleInputChange('basicSalary', Number(e.target.value))} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div></div>
                <div><label className="text-xs font-semibold text-text-muted">Phone</label><div className="relative"><Phone size={16} className="absolute left-3 top-2.5 text-text-muted"/><input type="text" placeholder="+00-000-0000000" value={formData.phone || ''} onChange={e => handleInputChange('phone', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div></div>
                 <div><label className="text-xs font-semibold text-text-muted">Email</label><div className="relative"><Mail size={16} className="absolute left-3 top-2.5 text-text-muted"/><input type="email" value={formData.email || ''} onChange={e => handleInputChange('email', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div></div>
                <div><label className="text-xs font-semibold text-text-muted">CNIC</label><div className="relative"><Hash size={16} className="absolute left-3 top-2.5 text-text-muted"/><input type="text" placeholder="00000-0000000-0" value={formData.cnic || ''} onChange={e => handleInputChange('cnic', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div></div>
                 <div><label className="text-xs font-semibold text-text-muted">Father/Husband Name</label><input type="text" value={formData.fatherName || ''} onChange={e => handleInputChange('fatherName', e.target.value)} onBlur={() => handleBlur('fatherName')} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-xs font-semibold text-text-muted">Joining Date <span className="text-danger">*</span></label><div className="relative"><Calendar size={16} className="absolute left-3 top-2.5 text-text-muted"/><input type="date" value={formData.joiningDate || ''} onChange={e => handleInputChange('joiningDate', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div></div>
                <div><label className="text-xs font-semibold text-text-muted">Gender</label><select value={formData.gender || 'Male'} onChange={e => handleInputChange('gender', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"><option>Male</option><option>Female</option><option>Other</option></select></div>
                <div className="md:col-span-2"><label className="text-xs font-semibold text-text-muted">Address</label><div className="relative"><MapPin size={16} className="absolute left-3 top-2.5 text-text-muted"/><textarea rows={2} value={formData.address || ''} onChange={e => handleInputChange('address', e.target.value)} onBlur={() => handleBlur('address')} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" /></div></div>
                
                {/* Termination Section */}
                <div className="md:col-span-2 pt-4 mt-2 border-t border-border">
                    <h3 className="text-sm font-bold text-text-main mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-warning"/> Status & Termination</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-highlight/30 p-4 rounded-xl border border-border">
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-text-muted mb-1.5 block">Employment Status</label>
                            <div className="flex gap-2">
                                {['Active', 'Resigned', 'Terminated'].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => handleInputChange('status', s)}
                                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                                            formData.status === s 
                                            ? (s === 'Active' ? 'bg-success text-white border-success' : 'bg-danger text-white border-danger')
                                            : 'bg-surface border-border text-text-muted hover:border-text-muted'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {formData.status !== 'Active' && (
                            <>
                                <div className="animate-in slide-in-from-top-2">
                                    <label className="text-xs font-semibold text-text-muted mb-1.5 block">Termination Date <span className="text-danger">*</span></label>
                                    <input type="date" value={formData.terminationDate || ''} onChange={e => handleInputChange('terminationDate', e.target.value)} className={`w-full bg-surface border ${errors.terminationDate ? 'border-danger' : 'border-border'} rounded-lg p-2 text-sm`} />
                                    {errors.terminationDate && <span className="text-xs text-danger">{errors.terminationDate}</span>}
                                </div>
                                <div className="animate-in slide-in-from-top-2">
                                    <label className="text-xs font-semibold text-text-muted mb-1.5 block">Reason <span className="text-danger">*</span></label>
                                    <input type="text" value={formData.terminationReason || ''} onChange={e => handleInputChange('terminationReason', e.target.value)} className={`w-full bg-surface border ${errors.terminationReason ? 'border-danger' : 'border-border'} rounded-lg p-2 text-sm`} placeholder="Reason for leaving..." />
                                    {errors.terminationReason && <span className="text-xs text-danger">{errors.terminationReason}</span>}
                                </div>
                            </>
                        )}
                    </div>
                </div>

             </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main">Cancel</button><button onClick={handleSubmit} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light shadow-lg shadow-primary/20"><Save size={16}/> Save Employee</button></div>
       </Modal>
    </div>
  );
};
export default Employees;