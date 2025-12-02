

import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { AttendanceRecord, Employee } from '../../types';
import { Plus, Save, CalendarDays } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { GenericTable, Column } from '../../components/GenericTable';

const Attendance = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<'single' | 'month'>('single');
  
  // Single Entry Form
  const [formData, setFormData] = useState<Partial<AttendanceRecord>>({});
  
  // Bulk Entry Form
  const [bulkMonth, setBulkMonth] = useState(new Date().toISOString().slice(0, 7));
  const [bulkEmployeeId, setBulkEmployeeId] = useState('');
  const [bulkInTime, setBulkInTime] = useState('09:00');
  const [bulkOutTime, setBulkOutTime] = useState('18:00');
  const [skipSundays, setSkipSundays] = useState(true);
  
  // UI State for Modal Feedback
  const [modalOvertime, setModalOvertime] = useState({ hours: 0, amount: 0 });

  useEffect(() => {
    loadData();
  }, [isModalOpen]);

  useEffect(() => {
      // Filter records based on selectedMonth in main view
      const filtered = records.filter(r => r.date.startsWith(selectedMonth));
      setFilteredRecords(filtered);
  }, [records, selectedMonth]);

  // Update modal calculations when time changes (Single Mode)
  useEffect(() => {
      if (isModalOpen && entryMode === 'single' && formData.employeeId && formData.inTime && formData.outTime) {
          calculateOtForState(formData.employeeId, formData.inTime, formData.outTime);
      }
  }, [formData.inTime, formData.outTime, formData.employeeId, isModalOpen, entryMode]);

  const calculateOtForState = (empId: string, inT: string, outT: string) => {
      const emp = employees.find(e => e.id === empId);
      if (emp) {
          const start = new Date(`1970-01-01T${inT}Z`);
          const end = new Date(`1970-01-01T${outT}Z`);
          const diffHrs = (end.getTime() - start.getTime()) / 3600000;
          
          const duty = emp.dutyHours || 8;
          // Subtract 1 hour mandatory break
          const actualWorkHrs = diffHrs - 1;
          const ot = Math.max(0, actualWorkHrs - duty);
          
          if (ot > 0) {
              const hourly = emp.basicSalary / 30 / duty;
              const settings = db.getPayrollSettings();
              const amount = hourly * ot * (settings.defaultOvertimeRate || 1.5);
              setModalOvertime({ hours: Number(ot.toFixed(2)), amount: Math.round(amount) });
          } else {
              setModalOvertime({ hours: 0, amount: 0 });
          }
      }
  };

  const loadData = () => {
      setRecords(db.getAttendance());
      setEmployees(db.getEmployees().filter(e => e.status === 'Active'));
  };

  const openModal = () => {
    setEntryMode('single');
    setFormData({ date: new Date().toISOString().split('T')[0], status: 'Present', inTime: '09:00', outTime: '18:00', totalHours: '09:00' });
    setModalOvertime({ hours: 0, amount: 0 });
    // Reset bulk defaults
    setBulkEmployeeId('');
    setBulkMonth(new Date().toISOString().slice(0, 7));
    setBulkInTime('09:00');
    setBulkOutTime('18:00');
    setSkipSundays(true);
    
    setIsModalOpen(true);
  };

  const calculateHours = (inTime: string, outTime: string) => {
      const start = new Date(`1970-01-01T${inTime}Z`);
      const end = new Date(`1970-01-01T${outTime}Z`);
      const diff = (end.getTime() - start.getTime());
      const hours = Math.floor(diff / 3600000);
      const mins = Math.round((diff % 3600000) / 60000);
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const handleTimeChange = (field: 'inTime'|'outTime', val: string) => {
      const newData = { ...formData, [field]: val };
      if (newData.inTime && newData.outTime) {
          newData.totalHours = calculateHours(newData.inTime, newData.outTime);
      }
      setFormData(newData);
  };

  const handleSingleSubmit = () => {
    if (!formData.employeeId || !formData.date) return;
    
    try {
        db.saveAttendance(formData);
        setIsModalOpen(false);
        loadData();
    } catch (e: any) {
        alert(e.message);
    }
  };

  const handleBulkSubmit = () => {
      if (!bulkEmployeeId || !bulkMonth) return;
      
      const emp = employees.find(e => e.id === bulkEmployeeId);
      if (!emp) return;

      if (!confirm(`Generate attendance for ${emp.name} for the entire month of ${bulkMonth}?`)) return;

      try {
          const [year, month] = bulkMonth.split('-').map(Number);
          const daysInMonth = new Date(year, month, 0).getDate();
          const settings = db.getPayrollSettings();
          const customHolidays = settings.customHolidays || [];
          const currentRecords = db.getAttendance();

          const newRecords: AttendanceRecord[] = [];
          let skipped = 0;

          for (let day = 1; day <= daysInMonth; day++) {
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dateObj = new Date(year, month - 1, day);

              // Skip Sundays if checked
              if (skipSundays && dateObj.getDay() === 0) continue;
              
              // Skip configured holidays (always)
              if (customHolidays.includes(dateStr)) continue;

              // Check duplicate (client-side pre-check)
              const exists = currentRecords.some(r => r.employeeId === bulkEmployeeId && r.date === dateStr);
              if (exists) {
                  skipped++;
                  continue;
              }

              // Calculate Total Hours string
              const totalHrs = calculateHours(bulkInTime, bulkOutTime);

              newRecords.push({
                  id: Math.random().toString(36).substr(2, 9),
                  employeeId: bulkEmployeeId,
                  date: dateStr,
                  inTime: bulkInTime,
                  outTime: bulkOutTime,
                  totalHours: totalHrs,
                  status: 'Present',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
              });
          }

          if (newRecords.length > 0) {
              db.bulkSaveAttendance(newRecords);
              
              // Switch view to the generated month so user sees the data
              setSelectedMonth(bulkMonth);
              
              // Reload data from DB
              loadData();
              
              setIsModalOpen(false);
              alert(`Success! Generated ${newRecords.length} records.\n(${skipped} skipped as duplicates/holidays)`);
          } else {
              alert(`No records generated.\nPossible reasons:\n- All days are Sundays/Holidays\n- Attendance already exists for this month`);
          }
      } catch (e: any) {
          alert("Error generating attendance: " + e.message);
      }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this record?')) {
        db.deleteAttendance(id);
        loadData();
    }
  };

  const columns: Column<AttendanceRecord>[] = [
      { header: 'Date', accessor: 'date' },
      { header: 'Employee', accessor: (rec: AttendanceRecord) => db.getEmployees().find(e => e.id === rec.employeeId)?.name || 'Unknown' },
      { header: 'In', accessor: 'inTime' },
      { header: 'Out', accessor: 'outTime' },
      { header: 'Work Hrs', accessor: 'totalHours', className: 'font-mono text-xs' },
      { 
          header: 'OT Hrs', 
          accessor: (rec) => (rec.overtimeHours && rec.overtimeHours > 0) ? <span className="text-warning font-bold">{rec.overtimeHours}</span> : '-',
          className: 'text-right'
      },
      { 
          header: 'OT Amount', 
          accessor: (rec) => (rec.overtimeAmount && rec.overtimeAmount > 0) ? `$${rec.overtimeAmount}` : '-',
          className: 'text-right font-mono text-xs'
      },
      { 
          header: 'Status', 
          accessor: (rec: AttendanceRecord) => (
             <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${rec.status === 'Present' ? 'bg-success/10 text-success' : rec.status === 'Absent' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>{rec.status}</span>
          ) 
      },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div><h1 className="text-2xl font-bold text-text-main">Attendance & Overtime</h1></div>
        <div className="flex items-center gap-3">
            <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button onClick={openModal} className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
                <Plus size={18}/> Attendance Record
            </button>
        </div>
      </div>

      <GenericTable 
         data={filteredRecords} 
         columns={columns} 
         title={`Attendance Records - ${selectedMonth}`} 
         onDelete={(item) => handleDelete(item.id)}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Attendance Entry">
         <div className="space-y-6">
            
            {/* Mode Switcher */}
            <div className="flex bg-surface-highlight p-1 rounded-xl border border-border">
                <button 
                    onClick={() => setEntryMode('single')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${entryMode === 'single' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text-main'}`}
                >
                    Single Day Entry
                </button>
                <button 
                    onClick={() => setEntryMode('month')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${entryMode === 'month' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text-main'}`}
                >
                    Full Month Entry
                </button>
            </div>

            {entryMode === 'single' ? (
                // SINGLE DATE FORM
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div>
                        <label className="text-xs font-semibold text-text-muted mb-1.5 block">Employee (Active)</label>
                        <select value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50"><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-text-muted mb-1.5 block">Date</label>
                        <input type="date" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-text-muted mb-1.5 block">In Time</label>
                            <input type="time" value={formData.inTime || ''} onChange={e => handleTimeChange('inTime', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-text-muted mb-1.5 block">Out Time</label>
                            <input type="time" value={formData.outTime || ''} onChange={e => handleTimeChange('outTime', e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-surface-highlight p-2 rounded-lg text-center text-sm font-bold flex-1 border border-border">
                            Duration: <span className="text-primary">{formData.totalHours}</span>
                        </div>
                        {modalOvertime.hours > 0 && (
                            <div className="bg-warning/10 p-2 rounded-lg text-center text-sm font-bold flex-1 border border-warning/20">
                                Overtime: <span className="text-warning">{modalOvertime.hours} hrs</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-text-muted mb-1.5 block">Status</label>
                        <select value={formData.status || 'Present'} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50"><option>Present</option><option>Late</option><option>Half Day</option><option>Absent</option></select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={handleSingleSubmit} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary-light flex items-center gap-2 shadow-lg shadow-primary/20"><Save size={16}/> Save Record</button>
                    </div>
                </div>
            ) : (
                // FULL MONTH FORM
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4">
                        <p className="text-xs text-text-muted">
                            <span className="font-bold text-primary">Note:</span> This will generate attendance for every working day of the selected month. Sundays and Holidays are skipped. Duplicate entries are prevented.
                        </p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-text-muted mb-1.5 block">Select Employee</label>
                        <select value={bulkEmployeeId} onChange={e => setBulkEmployeeId(e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50"><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-text-muted mb-1.5 block">Select Month</label>
                        <input type="month" value={bulkMonth} onChange={e => setBulkMonth(e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-text-muted mb-1.5 block">Default In Time</label>
                            <input type="time" value={bulkInTime} onChange={e => setBulkInTime(e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-text-muted mb-1.5 block">Default Out Time</label>
                            <input type="time" value={bulkOutTime} onChange={e => setBulkOutTime(e.target.value)} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer bg-surface-highlight p-3 rounded-xl border border-border">
                            <input type="checkbox" checked={skipSundays} onChange={e => setSkipSundays(e.target.checked)} className="rounded border-border text-primary focus:ring-primary" />
                            <span className="text-sm font-medium text-text-main">Skip Sundays & Holidays automatically</span>
                        </label>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={handleBulkSubmit} className="bg-success hover:bg-success/90 text-white px-6 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-success/20"><CalendarDays size={16}/> Generate Month</button>
                    </div>
                </div>
            )}
         </div>
      </Modal>
    </div>
  );
};

export default Attendance;
