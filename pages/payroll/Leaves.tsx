
import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { LeaveRequest, Employee, LeaveType } from '../../types';
import { Plus, Save } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { GenericTable, Column } from '../../components/GenericTable';

const Leaves = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<LeaveRequest>>({});

  useEffect(() => {
    setLeaves(db.getLeaves());
    setEmployees(db.getEmployees().filter(e => e.status === 'Active'));
    setLeaveTypes(db.getLeaveTypes());
  }, [isModalOpen]);

  const openModal = () => {
    setFormData({ fromDate: new Date().toISOString().split('T')[0], toDate: new Date().toISOString().split('T')[0], status: 'Pending', totalDays: 1 });
    setIsModalOpen(true);
  };

  const calculateDays = (from: string, to: string) => {
      const d1 = new Date(from);
      const d2 = new Date(to);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  };

  const handleDateChange = (field: 'fromDate'|'toDate', val: string) => {
      const newData = { ...formData, [field]: val };
      if (newData.fromDate && newData.toDate) {
          newData.totalDays = calculateDays(newData.fromDate, newData.toDate);
      }
      setFormData(newData);
  };

  const handleSubmit = () => {
    if (!formData.employeeId || !formData.leaveTypeId) return;
    db.saveLeave(formData);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this leave request?')) {
        db.deleteLeave(id);
        setLeaves(db.getLeaves());
    }
  };

  const columns: Column<LeaveRequest>[] = [
      { header: 'Employee', accessor: (rec: LeaveRequest) => db.getEmployees().find(e => e.id === rec.employeeId)?.name || 'Unknown' },
      { header: 'Type', accessor: (rec: LeaveRequest) => leaveTypes.find(l => l.id === rec.leaveTypeId)?.name || 'Unknown' },
      { header: 'From', accessor: 'fromDate' },
      { header: 'To', accessor: 'toDate' },
      { header: 'Days', accessor: 'totalDays', className: 'font-mono' },
      { 
          header: 'Status', 
          accessor: (rec: LeaveRequest) => (
             <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${rec.status === 'Approved' ? 'bg-success/10 text-success' : rec.status === 'Rejected' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>{rec.status}</span>
          ) 
      },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-text-main">Leaves Management</h1></div>
        <button onClick={openModal} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"><Plus size={18}/> New Request</button>
      </div>

      <GenericTable 
         data={leaves} 
         columns={columns} 
         title="Leave Requests" 
         onDelete={(item) => handleDelete(item.id)}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Leave Request">
         <div className="space-y-4">
            <div>
                <label className="text-xs font-semibold text-text-muted">Employee (Active)</label>
                <select value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50"><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
            </div>
            <div>
                <label className="text-xs font-semibold text-text-muted">Leave Type</label>
                <select value={formData.leaveTypeId || ''} onChange={e => setFormData({...formData, leaveTypeId: e.target.value})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50"><option value="">Select Type</option>{leaveTypes.map(l => <option key={l.id} value={l.id}>{l.name} ({l.isPaid ? 'Paid' : 'Unpaid'})</option>)}</select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-semibold text-text-muted">From Date</label>
                    <input type="date" value={formData.fromDate || ''} onChange={e => handleDateChange('fromDate', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-text-muted">To Date</label>
                    <input type="date" value={formData.toDate || ''} onChange={e => handleDateChange('toDate', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
                </div>
            </div>
            <div className="text-right text-xs font-bold text-primary">Total: {formData.totalDays} Days</div>
            
             <div>
                <label className="text-xs font-semibold text-text-muted">Status</label>
                <select value={formData.status || 'Pending'} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50"><option>Pending</option><option>Approved</option><option>Rejected</option></select>
            </div>

            <div className="flex justify-end pt-4">
                <button onClick={handleSubmit} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary-light flex items-center gap-2"><Save size={16}/> Save Request</button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default Leaves;