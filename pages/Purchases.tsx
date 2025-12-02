




import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { PurchaseBill, PurchaseBillItem, Partner, InventoryItem, TaxSetting, PurchaseType, BillStatus } from '../types';
import { Search, Plus, Edit2, Trash2, Save, Printer, Calendar, User, ShoppingCart, Percent, DollarSign, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';

// Helper: Proper Case
const toProperCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const Purchases = () => {
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [vendors, setVendors] = useState<Partner[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [taxes, setTaxes] = useState<TaxSetting[]>([]);
  
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<PurchaseBill | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<PurchaseBill>>({});
  const [formItems, setFormItems] = useState<PurchaseBillItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [isModalOpen]);

  const loadData = () => {
    setBills(db.getPurchaseBills());
    setVendors(db.getPartners('vendor'));
    setInventory(db.getInventory());
    setTaxes(db.getTaxSettings());
  };

  const filteredData = bills.filter(bill => 
      bill.billNo.toLowerCase().includes(search.toLowerCase()) || 
      vendors.find(v => v.id === bill.vendorId)?.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // --- Form Logic ---

  const calculateTotals = (items: PurchaseBillItem[]) => {
      let sub = 0;
      let tax = 0;
      items.forEach(item => {
          sub += item.amount;
          tax += item.taxAmount;
      });
      return { subTotal: sub, taxTotal: tax, grandTotal: sub + tax };
  };

  const updateFormTotals = (items: PurchaseBillItem[]) => {
      const { subTotal, taxTotal, grandTotal } = calculateTotals(items);
      setFormData(prev => ({ ...prev, subTotal, taxTotal, grandTotal }));
  };

  const openModal = (bill?: PurchaseBill) => {
      setEditingBill(bill || null);
      if (bill) {
          setFormData({ ...bill });
          setFormItems([...bill.items]);
      } else {
          setFormData({
              billNo: 'Auto Generated',
              date: new Date().toISOString().split('T')[0],
              dueDate: new Date().toISOString().split('T')[0], // Default Cash = immediate
              type: 'Cash',
              isGst: true,
              status: 'Draft',
              subTotal: 0, taxTotal: 0, grandTotal: 0, discount: 0
          });
          setFormItems([]);
      }
      setErrors({});
      setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof PurchaseBill, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Auto-calc due date
      if (field === 'type' || field === 'date') {
          const type = field === 'type' ? value : formData.type;
          const date = field === 'date' ? value : formData.date;
          
          if (date) {
              const d = new Date(date);
              if (type === 'Credit') {
                  d.setDate(d.getDate() + 30); // Default 30 days for purchases
              }
              setFormData(prev => ({ ...prev, dueDate: d.toISOString().split('T')[0], [field]: value }));
          }
      }
  };
  
  const handleBlurNote = () => {
      if (formData.notes) {
          setFormData(prev => ({ ...prev, notes: toProperCase(prev.notes!) }));
      }
  };

  // Line Items Logic
  const addItem = () => {
      const newItem: PurchaseBillItem = {
          id: Math.random().toString(36).substr(2, 9),
          inventoryItemId: '',
          description: '',
          quantity: 1,
          rate: 0,
          amount: 0,
          taxId: '',
          taxRate: 0,
          taxAmount: 0,
          rowTotal: 0
      };
      setFormItems([...formItems, newItem]);
  };

  const removeItem = (id: string) => {
      const newItems = formItems.filter(i => i.id !== id);
      setFormItems(newItems);
      updateFormTotals(newItems);
  };

  const updateItem = (id: string, field: keyof PurchaseBillItem, value: any) => {
      const newItems = formItems.map(item => {
          if (item.id === id) {
              const updated = { ...item, [field]: value };
              
              // If product changed, update rate & desc
              if (field === 'inventoryItemId') {
                  const prod = inventory.find(p => p.id === value);
                  if (prod) {
                      updated.description = prod.name;
                      updated.rate = prod.unitPrice; // Default to standard cost/price, user can edit
                  }
              }

              // Logic to set tax rate if taxId changes
              if (field === 'taxId') {
                  const tax = taxes.find(t => t.id === value);
                  updated.taxRate = tax ? tax.rate : 0;
              }

              // Recalculate Row
              updated.amount = updated.quantity * updated.rate;
              
              if (formData.isGst) {
                 updated.taxAmount = updated.amount * (updated.taxRate / 100);
              } else {
                 updated.taxAmount = 0;
                 updated.taxRate = 0;
                 updated.taxId = undefined;
              }
              
              updated.rowTotal = updated.amount + updated.taxAmount;
              return updated;
          }
          return item;
      });
      setFormItems(newItems);
      updateFormTotals(newItems);
  };

  // Re-run calc if GST toggle changes
  useEffect(() => {
     if (formItems.length > 0) {
         // Trigger a recalculation of all items based on GST state
         const newItems = formItems.map(item => {
             const taxAmt = formData.isGst ? (item.amount * (item.taxRate / 100)) : 0;
             return { ...item, taxAmount: taxAmt, rowTotal: item.amount + taxAmt };
         });
         setFormItems(newItems);
         updateFormTotals(newItems);
     }
  }, [formData.isGst]);

  const handleSubmit = async () => {
      const errs: Record<string, string> = {};
      if (!formData.vendorId) errs.vendorId = 'Vendor is required';
      if (!formData.date) errs.date = 'Date is required';
      if (formItems.length === 0) errs.items = 'Add at least one item';
      
      // Validate items
      formItems.forEach(item => {
          if (!item.inventoryItemId) errs.items = 'Select product for all lines';
          if (item.quantity <= 0) errs.items = 'Quantity must be > 0';
      });

      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setIsSaving(true);
      await new Promise(r => setTimeout(r, 500));
      
      db.savePurchaseBill({
          ...formData,
          items: formItems
      });
      
      setIsSaving(false);
      setIsModalOpen(false);
      loadData();
  };
  
  const handleDelete = (id: string) => {
      if (confirm("Delete this bill?")) {
          db.deletePurchaseBill(id);
          loadData();
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Purchase Bills</h1>
            <p className="text-text-muted text-sm mt-1">Manage vendor bills and procurement.</p>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95">
             <Plus size={18} /> Create Bill
          </button>
       </div>

       <div className="bg-surface rounded-2xl shadow-soft border border-border overflow-hidden">
          <div className="p-5 border-b border-border bg-surface/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-80 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                  <input type="text" placeholder="Search bills..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-main focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-surface-highlight border-b border-border">
                      <tr>
                          <th className="px-6 py-4 font-bold text-text-muted text-xs uppercase">Date</th>
                          <th className="px-6 py-4 font-bold text-text-muted text-xs uppercase">Bill #</th>
                          <th className="px-6 py-4 font-bold text-text-muted text-xs uppercase">Vendor</th>
                          <th className="px-6 py-4 font-bold text-text-muted text-xs uppercase">Due Date</th>
                          <th className="px-6 py-4 font-bold text-text-muted text-xs uppercase">Status</th>
                          <th className="px-6 py-4 font-bold text-text-muted text-xs uppercase text-right">Amount</th>
                          <th className="px-6 py-4 font-bold text-text-muted text-xs uppercase text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                      {paginatedData.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-text-muted">No bills found.</td></tr> : 
                      paginatedData.map(bill => (
                          <tr key={bill.id} className="hover:bg-surface-highlight transition-colors">
                              <td className="px-6 py-4">{bill.date}</td>
                              <td className="px-6 py-4 font-mono text-xs text-primary">{bill.billNo}</td>
                              <td className="px-6 py-4 font-medium">{vendors.find(v => v.id === bill.vendorId)?.name || 'Unknown'}</td>
                              <td className="px-6 py-4 text-text-muted">{bill.dueDate}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${bill.status === 'Paid' ? 'bg-success/10 text-success' : bill.status === 'Draft' ? 'bg-text-muted/10 text-text-muted' : 'bg-primary/10 text-primary'}`}>
                                      {bill.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-bold">${bill.grandTotal.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                      <button onClick={() => openModal(bill)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg"><Edit2 size={16}/></button>
                                      <button onClick={() => handleDelete(bill.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg"><Trash2 size={16}/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          {totalPages > 1 && (
             <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-muted bg-surface/50">
                 <span>Page {currentPage} of {totalPages}</span>
                 <div className="flex gap-2">
                     <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-border hover:bg-surface-highlight disabled:opacity-50 transition-colors"><ChevronLeft size={16} /></button>
                     <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-border hover:bg-surface-highlight disabled:opacity-50 transition-colors"><ChevronRight size={16} /></button>
                 </div>
             </div>
          )}
       </div>

       {/* Full Screen Modal for Purchase Bill */}
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBill ? 'Edit Bill' : 'New Purchase Bill'} maxWidth="max-w-5xl">
           <div className="space-y-6">
               
               {/* Header Section */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface-highlight/30 p-4 rounded-xl border border-border">
                   <div className="md:col-span-1">
                       <label className="text-xs font-semibold text-text-muted mb-1.5 block">Vendor <span className="text-danger">*</span></label>
                       <div className="relative">
                           <User size={16} className="absolute left-3 top-2.5 text-text-muted"/>
                           <select value={formData.vendorId || ''} onChange={e => handleInputChange('vendorId', e.target.value)} className="w-full bg-surface border border-border rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50">
                               <option value="">Select Vendor</option>
                               {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                           </select>
                       </div>
                       {errors.vendorId && <span className="text-xs text-danger">{errors.vendorId}</span>}
                   </div>
                   
                   <div>
                       <label className="text-xs font-semibold text-text-muted mb-1.5 block">Date <span className="text-danger">*</span></label>
                       <div className="relative">
                           <Calendar size={16} className="absolute left-3 top-2.5 text-text-muted"/>
                           <input type="date" value={formData.date || ''} onChange={e => handleInputChange('date', e.target.value)} className="w-full bg-surface border border-border rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50" />
                       </div>
                   </div>

                   <div>
                       <label className="text-xs font-semibold text-text-muted mb-1.5 block">Type</label>
                       <select value={formData.type || 'Cash'} onChange={e => handleInputChange('type', e.target.value)} className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/50">
                           <option>Cash</option>
                           <option>Credit</option>
                       </select>
                   </div>
                   
                   <div>
                       <label className="text-xs font-semibold text-text-muted mb-1.5 block">Due Date</label>
                       <input type="date" value={formData.dueDate || ''} onChange={e => handleInputChange('dueDate', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl py-2 px-3 text-sm text-text-muted" readOnly />
                       <span className="text-[10px] text-text-muted ml-1">Auto: {formData.type === 'Cash' ? 'Immediate' : '+30 Days'}</span>
                   </div>
               </div>

               {/* Settings Bar */}
               <div className="flex items-center justify-between">
                   <h3 className="text-sm font-bold text-text-main">Bill Items</h3>
                   <div className="flex items-center gap-4">
                       <label className="flex items-center gap-2 text-sm cursor-pointer select-none bg-surface-highlight px-3 py-1.5 rounded-lg border border-border">
                           <input type="checkbox" checked={formData.isGst} onChange={e => handleInputChange('isGst', e.target.checked)} className="rounded border-border text-primary focus:ring-primary" />
                           <span className="font-medium text-text-main">Enable GST</span>
                       </label>
                       <button onClick={addItem} className="flex items-center gap-1.5 text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold">
                           <Plus size={16} /> Add Item
                       </button>
                   </div>
               </div>

               {/* Items Table */}
               <div className="border border-border rounded-xl overflow-hidden bg-surface">
                   <table className="w-full text-left text-sm">
                       <thead className="bg-surface-highlight border-b border-border">
                           <tr>
                               <th className="px-4 py-2 text-xs font-bold text-text-muted uppercase w-[25%]">Item</th>
                               <th className="px-4 py-2 text-xs font-bold text-text-muted uppercase w-[10%] text-right">Qty</th>
                               <th className="px-4 py-2 text-xs font-bold text-text-muted uppercase w-[15%] text-right">Rate</th>
                               <th className="px-4 py-2 text-xs font-bold text-text-muted uppercase w-[15%] text-right">Amount</th>
                               {formData.isGst && <th className="px-4 py-2 text-xs font-bold text-text-muted uppercase w-[20%]">Tax Rule</th>}
                               <th className="px-4 py-2 text-xs font-bold text-text-muted uppercase w-[10%] text-right">Total</th>
                               <th className="px-4 py-2 w-[5%]"></th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-border">
                           {formItems.length === 0 ? (
                               <tr><td colSpan={7} className="p-8 text-center text-text-muted">No items added. Click "Add Item".</td></tr>
                           ) : (
                               formItems.map((item, idx) => (
                                   <tr key={item.id} className="group hover:bg-surface-highlight/30">
                                       <td className="px-4 py-2">
                                           <select value={item.inventoryItemId} onChange={e => updateItem(item.id, 'inventoryItemId', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-sm p-0">
                                               <option value="">Select Product</option>
                                               {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                                           </select>
                                           <div className="text-[10px] text-text-muted truncate">{item.description}</div>
                                       </td>
                                       <td className="px-4 py-2">
                                           <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} className="w-full bg-transparent text-right border-b border-transparent focus:border-primary focus:outline-none p-1" />
                                       </td>
                                       <td className="px-4 py-2">
                                           <input type="number" value={item.rate} onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} className="w-full bg-transparent text-right border-b border-transparent focus:border-primary focus:outline-none p-1" />
                                       </td>
                                       <td className="px-4 py-2 text-right font-mono text-text-muted">
                                           {item.amount.toLocaleString()}
                                       </td>
                                       {formData.isGst && (
                                           <td className="px-4 py-2">
                                               <select value={item.taxId || ''} onChange={e => updateItem(item.id, 'taxId', e.target.value)} className="w-full bg-transparent text-xs p-1 border-b border-transparent focus:border-primary focus:outline-none">
                                                   <option value="">No Tax</option>
                                                   {taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                                               </select>
                                               {item.taxAmount > 0 && <div className="text-[10px] text-text-muted text-right">+{item.taxAmount.toFixed(2)}</div>}
                                           </td>
                                       )}
                                       <td className="px-4 py-2 text-right font-mono font-medium text-text-main">
                                           {item.rowTotal.toFixed(2)}
                                       </td>
                                       <td className="px-4 py-2 text-center">
                                           <button onClick={() => removeItem(item.id)} className="text-text-muted hover:text-danger p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                                       </td>
                                   </tr>
                               ))
                           )}
                       </tbody>
                   </table>
               </div>
               {errors.items && <p className="text-xs text-danger text-right">{errors.items}</p>}

               {/* Footer / Totals */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                   <div className="space-y-4">
                       <div>
                           <label className="text-xs font-semibold text-text-muted mb-1.5 block">Notes</label>
                           <textarea value={formData.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} onBlur={handleBlurNote} rows={3} className="w-full bg-surface-highlight border border-transparent rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-primary/50" placeholder="Add bill notes..." />
                       </div>
                   </div>
                   
                   <div className="space-y-3 bg-surface-highlight/30 p-4 rounded-xl border border-border">
                       <div className="flex justify-between text-sm">
                           <span className="text-text-muted">Subtotal</span>
                           <span className="font-mono font-medium">{formData.subTotal?.toLocaleString()}</span>
                       </div>
                       {formData.isGst && (
                           <div className="flex justify-between text-sm">
                               <span className="text-text-muted">Total Tax</span>
                               <span className="font-mono font-medium text-warning">{formData.taxTotal?.toFixed(2)}</span>
                           </div>
                       )}
                       <div className="border-t border-border pt-3 flex justify-between items-center">
                           <span className="font-bold text-text-main">Grand Total</span>
                           <span className="font-mono text-xl font-bold text-primary">${formData.grandTotal?.toLocaleString()}</span>
                       </div>
                   </div>
               </div>

               <div className="flex justify-end gap-3 pt-6 border-t border-border">
                   <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main">Cancel</button>
                   <button onClick={handleSubmit} disabled={isSaving} className="bg-primary text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-light flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-70">
                       {isSaving ? 'Processing...' : <><Save size={18}/> Save Bill</>}
                   </button>
               </div>
           </div>
       </Modal>
    </div>
  );
};

export default Purchases;