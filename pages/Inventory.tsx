
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { InventoryItem, ChartOfAccount } from '../types';
import { Search, Plus, Edit2, Trash2, Save, Package, Hash, Tag, Layers } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';

const toProperCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
const formatHS = (val: string) => { const clean = val.replace(/\D/g, ''); return clean.length > 4 ? clean.slice(0, 4) + '.' + clean.slice(4) : clean.slice(0, 9); };

const Inventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [groups, setGroups] = useState<ChartOfAccount[]>([]);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadData(); }, [isModalOpen]);

  const loadData = () => {
    setItems(db.getInventory());
    const invGroups = db.getInventoryGroups().filter(g => g.level === 4);
    setGroups(invGroups);
  };

  const handleInputChange = (field: keyof InventoryItem, value: any) => {
      let finalVal = value;
      if (field === 'hsCode') finalVal = formatHS(value);
      setFormData(prev => ({ ...prev, [field]: finalVal }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: keyof InventoryItem) => {
      if (field === 'name') setFormData(prev => ({ ...prev, [field]: toProperCase(String(prev[field] || '')) }));
  };

  const openModal = (item?: InventoryItem) => {
      setEditingItem(item || null);
      if (item) { setFormData({ ...item }); } 
      else { setFormData({ name: '', group: groups[0]?.id || '', hsCode: '', openingQuantity: 0, unitPrice: 0 }); }
      setErrors({});
      setIsModalOpen(true);
  };

  const validate = () => {
      const errs: Record<string, string> = {};
      if (!formData.name?.trim()) errs.name = 'Item Name is required';
      if (!formData.group) errs.group = 'Inventory Group is required';
      setErrors(errs);
      return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
      if (!validate()) return;
      setIsSaving(true);
      setTimeout(() => {
          db.saveInventory(formData);
          setIsSaving(false);
          setIsModalOpen(false);
          loadData();
      }, 500);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this inventory item? This action cannot be undone.')) {
          try {
              db.deleteInventory(id);
              loadData();
              alert('Item deleted successfully.');
          } catch (e: any) {
              alert(e.message);
          }
      }
  };

  const groupedItems = groups.reduce((acc, group) => {
      acc[group.id] = items.filter(i => i.group === group.id);
      return acc;
  }, {} as Record<string, InventoryItem[]>);

  const displayGroups = activeGroup === 'all' ? groups : groups.filter(g => g.id === activeGroup);

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-text-main tracking-tight">Inventory Management</h1><p className="text-text-muted text-sm mt-1">Track assets, stock levels, and valuations.</p></div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95"><Plus size={18} /> New Item</button>
       </div>
       <Card className="p-2 border-border shadow-soft">
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setActiveGroup('all')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeGroup === 'all' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface-highlight hover:text-text-main'}`}>All Groups</button>
                {groups.map(g => (
                    <button key={g.id} onClick={() => setActiveGroup(g.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeGroup === g.id ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface-highlight hover:text-text-main'}`}>{g.name}</button>
                ))}
            </div>
            <div className="mt-4 px-2 pb-2 relative max-w-md"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={16} /><input type="text" placeholder="Search by name, SKU or HS code..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
        </Card>
        {displayGroups.map(group => {
            const groupItems = (groupedItems[group.id] || []).filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()) || (i.hsCode && i.hsCode.includes(search)));
            if (groupItems.length === 0) return null;
            return (
                <div key={group.id} className="bg-surface rounded-2xl shadow-soft border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="px-6 py-4 bg-surface-highlight/50 border-b border-border flex justify-between items-center"><h3 className="font-bold text-text-main flex items-center gap-2"><Layers size={18} className="text-primary"/> {group.name} <span className="text-xs font-mono text-text-muted opacity-70">({group.code})</span></h3><span className="text-xs font-semibold bg-surface border border-border px-2 py-1 rounded-lg text-text-muted">{groupItems.length} Items</span></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface border-b border-border"><tr><th className="px-6 py-3 font-bold text-text-muted uppercase text-xs w-[15%]">SKU</th><th className="px-6 py-3 font-bold text-text-muted uppercase text-xs w-[30%]">Item Name</th><th className="px-6 py-3 font-bold text-text-muted uppercase text-xs w-[15%]">HS Code</th><th className="px-6 py-3 font-bold text-text-muted uppercase text-xs text-right w-[15%]">Stock</th><th className="px-6 py-3 font-bold text-text-muted uppercase text-xs text-right w-[15%]">Valuation</th><th className="px-6 py-3 font-bold text-text-muted uppercase text-xs text-right w-[10%]">Actions</th></tr></thead>
                            <tbody className="divide-y divide-border">
                                {groupItems.map(item => (
                                    <tr key={item.id} className="hover:bg-surface-highlight transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{item.sku}</td>
                                        <td className="px-6 py-4 font-medium text-text-main">{item.name}</td>
                                        <td className="px-6 py-4 font-mono text-text-muted text-xs">{item.hsCode || '-'}</td>
                                        <td className="px-6 py-4 text-right"><span className={`px-2 py-0.5 rounded text-xs font-bold ${item.quantity > 10 ? 'bg-success/10 text-success' : item.quantity > 0 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>{item.quantity}</span></td>
                                        <td className="px-6 py-4 text-right font-mono text-text-main text-xs">${(item.quantity * item.unitPrice).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openModal(item)} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded mr-1"><Edit2 size={16}/></button>
                                                <button onClick={(e) => handleDelete(e, item.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        })}
        {/* Modal content preserved */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Edit Inventory Item' : 'New Inventory Item'}>
             <div className="space-y-4">
                 <div><label className="text-xs font-semibold text-text-muted">Item Name <span className="text-danger">*</span></label><div className="relative"><Package size={16} className="absolute left-3 top-2.5 text-text-muted"/><input type="text" value={formData.name || ''} onChange={e => handleInputChange('name', e.target.value)} onBlur={() => handleBlur('name')} className={`w-full bg-surface-highlight border ${errors.name ? 'border-danger' : 'border-transparent'} rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50`} placeholder="Product Name" /></div>{errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}</div>
                 <div><label className="text-xs font-semibold text-text-muted">Inventory Group (COA) <span className="text-danger">*</span></label><div className="relative"><Layers size={16} className="absolute left-3 top-2.5 text-text-muted"/><select value={formData.group || ''} onChange={e => handleInputChange('group', e.target.value)} className={`w-full bg-surface-highlight border ${errors.group ? 'border-danger' : 'border-transparent'} rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none`} disabled={!!editingItem}>{groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.code})</option>)}</select></div></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-semibold text-text-muted">HS Code</label><div className="relative"><Hash size={16} className="absolute left-3 top-2.5 text-text-muted"/><input type="text" value={formData.hsCode || ''} onChange={e => handleInputChange('hsCode', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono" placeholder="0000.0000" /></div></div>
                    {!editingItem && (<div><label className="text-xs font-semibold text-text-muted">Opening Qty</label><div className="relative"><Tag size={16} className="absolute left-3 top-2.5 text-text-muted"/><input type="number" value={formData.openingQuantity || ''} onChange={e => handleInputChange('openingQuantity', Number(e.target.value))} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div></div>)}
                 </div>
                 {!editingItem && (<div className="bg-primary/5 p-3 rounded-lg border border-primary/10"><p className="text-xs text-text-muted"><span className="font-bold text-primary">Note:</span> SKU will be auto-generated based on the selected group.</p></div>)}
                 <div className="flex justify-end pt-4"><button onClick={handleSubmit} disabled={isSaving} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary-light flex items-center gap-2 disabled:opacity-70">{isSaving ? 'Saving...' : <><Save size={16}/> Save Item</>}</button></div>
             </div>
        </Modal>
    </div>
  );
};
export default Inventory;
