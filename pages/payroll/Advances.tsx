
import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { AdvanceRecord, Employee, Partner, PaymentMethod, CompanyProfile } from '../../types';
import { Plus, Save, Printer, Edit2, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { GenericTable, Column } from '../../components/GenericTable';

const Advances = () => {
  const [records, setRecords] = useState<AdvanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [banks, setBanks] = useState<Partner[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AdvanceRecord>>({});

  useEffect(() => {
    setRecords(db.getAdvances());
    setEmployees(db.getEmployees().filter(e => e.status === 'Active'));
    setBanks(db.getPartners('bank'));
    setCompany(db.getCompanyProfile());
  }, [isModalOpen]);

  const openModal = () => {
    setFormData({ date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', amount: 0 });
    setIsModalOpen(true);
  };

  const handlePrint = (record: AdvanceRecord) => {
      const emp = employees.find(e => e.id === record.employeeId);
      const bank = banks.find(b => b.id === record.payFromBankId);
      
      // Parse Employee ID suffix to generate code (EMP-005 -> 1132005)
      let empCodeSuffix = '000';
      if (emp?.employeeId) {
          const parts = emp.employeeId.split('-');
          if (parts.length > 1) empCodeSuffix = parts[1];
      }
      const debitCode = `1132${empCodeSuffix}`;

      const printWindow = window.open('', '', 'width=900,height=800');
      if (!printWindow) return;

      const htmlContent = `
        <html>
        <head>
            <title>Advance Voucher - ${record.date}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { font-family: 'Inter', sans-serif; background: white; color: black; -webkit-print-color-adjust: exact; }
                @page { size: A4; margin: 20mm; }
            </style>
        </head>
        <body class="p-8 max-w-4xl mx-auto">
            <div class="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                <div class="w-1/2">
                    <h1 class="text-4xl font-bold uppercase tracking-tight text-gray-900">Payment Voucher</h1>
                    <p class="text-sm text-gray-600 mt-1 font-medium uppercase">Salary Advance</p>
                </div>
                <div class="w-1/2 text-right">
                    <h2 class="text-xl font-bold text-gray-900">${company?.name}</h2>
                    <p class="text-sm text-gray-600 whitespace-pre-wrap">${company?.address}</p>
                </div>
            </div>

            <div class="flex justify-between mb-10">
                <div class="w-1/2 pr-8">
                    <h3 class="text-xs font-bold text-gray-500 uppercase mb-2">Paid To</h3>
                    <div class="text-gray-900">
                        <p class="font-bold text-lg">${emp?.name}</p>
                        <p class="text-sm text-gray-600 font-mono">${emp?.employeeId}</p>
                        <p class="text-sm text-gray-600 mt-1">${emp?.designationId ? 'Employee' : ''}</p>
                    </div>
                </div>
                <div class="w-1/2 pl-8 flex flex-col gap-3 items-end">
                    <div class="text-right">
                        <p class="text-xs font-bold text-gray-500 uppercase">Date</p>
                        <p class="font-medium">${record.date}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs font-bold text-gray-500 uppercase">Payment Method</p>
                        <p class="font-medium">${record.paymentMethod}</p>
                    </div>
                </div>
            </div>

            <div class="mb-10 border border-gray-200 rounded-lg overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-gray-100 border-b border-gray-200">
                        <tr>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Account Code</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Description</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase text-right">Debit</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase text-right">Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="border-b border-gray-200">
                            <td class="py-3 px-4 font-mono text-sm text-gray-600">${debitCode}</td>
                            <td class="py-3 px-4 text-sm text-gray-900">
                                <div class="font-medium">Advance to Employees</div>
                                <div class="text-xs text-gray-500">${record.reason}</div>
                            </td>
                            <td class="py-3 px-4 text-right font-mono text-gray-900">${record.amount.toLocaleString()}</td>
                            <td class="py-3 px-4 text-right font-mono text-gray-900">-</td>
                        </tr>
                        <tr class="border-b border-gray-200">
                            <td class="py-3 px-4 font-mono text-sm text-gray-600">1111</td>
                            <td class="py-3 px-4 text-sm text-gray-900">
                                <div class="font-medium">${bank?.name}</div>
                                <div class="text-xs text-gray-500">
                                    ${record.paymentMethod}
                                    ${record.chequeNumber ? ` # ${record.chequeNumber}` : ''}
                                </div>
                            </td>
                            <td class="py-3 px-4 text-right font-mono text-gray-900">-</td>
                            <td class="py-3 px-4 text-right font-mono text-gray-900">${record.amount.toLocaleString()}</td>
                        </tr>
                    </tbody>
                    <tfoot class="bg-gray-50 font-bold">
                        <tr>
                            <td colspan="2" class="py-3 px-4 text-right text-xs uppercase text-gray-500">Totals</td>
                            <td class="py-3 px-4 text-right font-mono text-gray-900">${record.amount.toLocaleString()}</td>
                            <td class="py-3 px-4 text-right font-mono text-gray-900">${record.amount.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="grid grid-cols-2 gap-12 mt-auto pt-12">
                <div class="text-center">
                    <div class="border-b border-gray-400 mb-2 h-8"></div>
                    <p class="text-xs font-bold text-gray-500 uppercase">Authorized Signature</p>
                </div>
                <div class="text-center">
                    <div class="border-b border-gray-400 mb-2 h-8"></div>
                    <p class="text-xs font-bold text-gray-500 uppercase">Received By</p>
                </div>
            </div>
            
            <p class="text-center text-[10px] text-gray-400 mt-12">System Generated Voucher - ${new Date().toLocaleString()}</p>
            
            <script>window.onload = () => { window.print(); }</script>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  const handleSubmit = () => {
    if (!formData.employeeId || !formData.amount || !formData.payFromBankId) return;
    try {
        // Save and get the record back (simulated)
        const savedRecord = db.saveAdvance(formData);
        
        setIsModalOpen(false);
        // Auto print
        handlePrint(savedRecord);
    } catch(e: any) {
        alert(e.message);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this advance record?')) {
        db.deleteAdvance(id);
        setRecords(db.getAdvances());
    }
  };

  const columns: Column<AdvanceRecord>[] = [
      { header: 'Date', accessor: 'date' },
      { header: 'Employee', accessor: (rec: AdvanceRecord) => employees.find(e => e.id === rec.employeeId)?.name || 'Unknown' },
      { header: 'Method', accessor: 'paymentMethod' },
      { header: 'Paid From', accessor: (rec: AdvanceRecord) => banks.find(b => b.id === rec.payFromBankId)?.name || 'Unknown' },
      { header: 'Amount', accessor: (rec: AdvanceRecord) => `$${rec.amount.toLocaleString()}`, className: 'text-right font-mono text-danger font-bold' },
      {
          header: 'Actions',
          accessor: (rec: AdvanceRecord) => (
              <div className="flex justify-end gap-2">
                  <button onClick={() => handlePrint(rec)} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Print Voucher"><Printer size={16} /></button>
                  <button onClick={(e) => handleDelete(rec.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
          ),
          className: 'text-right'
      }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-text-main">Advances Management</h1></div>
        <button onClick={openModal} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"><Plus size={18}/> New Advance</button>
      </div>

      <GenericTable 
         data={records} 
         columns={columns} 
         title="Employee Advances" 
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Advance">
         <div className="space-y-4">
            <div>
                <label className="text-xs font-semibold text-text-muted">Employee (Active)</label>
                <select value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50"><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
            </div>
            <div>
                <label className="text-xs font-semibold text-text-muted">Pay From Account</label>
                <select value={formData.payFromBankId || ''} onChange={e => setFormData({...formData, payFromBankId: e.target.value})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50"><option value="">Select Bank / Cash Account</option>{banks.map(b => <option key={b.id} value={b.id}>{b.name} ({b.balance})</option>)}</select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-semibold text-text-muted">Amount</label>
                    <input type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-text-muted">Date</label>
                    <input type="date" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
                </div>
            </div>
            
            <div>
                <label className="text-xs font-semibold text-text-muted">Payment Method</label>
                <select value={formData.paymentMethod || 'Cash'} onChange={e => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50"><option>Cash</option><option>Cheque</option><option>Online Transfer</option></select>
            </div>

            {formData.paymentMethod === 'Cheque' && (
                 <div className="grid grid-cols-2 gap-4 bg-surface-highlight/50 p-3 rounded-xl border border-dashed border-border">
                    <div>
                        <label className="text-xs font-semibold text-text-muted">Cheque No</label>
                        <input type="text" value={formData.chequeNumber || ''} onChange={e => setFormData({...formData, chequeNumber: e.target.value})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2 text-sm" />
                    </div>
                     <div>
                        <label className="text-xs font-semibold text-text-muted">Cheque Date</label>
                        <input type="date" value={formData.chequeDate || ''} onChange={e => setFormData({...formData, chequeDate: e.target.value})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2 text-sm" />
                    </div>
                 </div>
            )}

            <div>
                 <label className="text-xs font-semibold text-text-muted">Reason / Description</label>
                 <textarea value={formData.reason || ''} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50 resize-none" rows={2} />
            </div>

            <div className="flex justify-end pt-4">
                <button onClick={handleSubmit} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary-light flex items-center gap-2"><Save size={16}/> Issue Advance</button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default Advances;
