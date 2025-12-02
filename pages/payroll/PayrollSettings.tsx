
import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { db } from '../../services/mockDb';
import { Designation, LeaveType, PayrollGlobalSettings } from '../../types';
import { Trash2, Plus, Save, Calendar, X } from 'lucide-react';

const toProperCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const PayrollSettings = () => {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [globalSettings, setGlobalSettings] = useState<PayrollGlobalSettings>({ defaultOvertimeRate: 1.5, monthlyCutoffDay: 25, customHolidays: [] });
  
  const [newDesignation, setNewDesignation] = useState('');
  const [newLeaveType, setNewLeaveType] = useState({ name: '', isPaid: true });
  const [newHolidayDate, setNewHolidayDate] = useState('');
  
  const loadData = () => {
    setDesignations(db.getDesignations());
    setLeaveTypes(db.getLeaveTypes());
    setGlobalSettings(db.getPayrollSettings());
  };

  useEffect(() => { loadData(); }, []);

  const handleAddDesignation = () => {
    if (!newDesignation.trim()) return;
    db.saveDesignation({ title: toProperCase(newDesignation) });
    setNewDesignation('');
    loadData();
  };

  const handleAddLeaveType = () => {
    if (!newLeaveType.name.trim()) return;
    db.saveLeaveType({ ...newLeaveType, name: toProperCase(newLeaveType.name) });
    setNewLeaveType({ name: '', isPaid: true });
    loadData();
  };

  const handleSaveGlobal = () => {
    db.savePayrollSettings(globalSettings);
    alert('Settings Saved');
  };

  const handleAddHoliday = () => {
      if (!newHolidayDate) return;
      if (globalSettings.customHolidays.includes(newHolidayDate)) {
          alert('Date already exists.');
          return;
      }
      const updatedHolidays = [...globalSettings.customHolidays, newHolidayDate];
      setGlobalSettings(prev => ({ ...prev, customHolidays: updatedHolidays }));
  };

  const handleRemoveHoliday = (date: string) => {
      const updatedHolidays = globalSettings.customHolidays.filter(d => d !== date);
      setGlobalSettings(prev => ({ ...prev, customHolidays: updatedHolidays }));
  };

  const handleDeleteDesignation = (id: string) => {
    if (confirm('Delete this designation?')) {
        db.deleteDesignation(id);
        loadData();
    }
  };

  const handleDeleteLeaveType = (id: string) => {
    if (confirm('Delete this leave type?')) {
        db.deleteLeaveType(id);
        loadData();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">Payroll Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Global Settings */}
        <Card title="General Configuration" className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5">Default Overtime Multiplier (X)</label>
                    <input 
                        type="number" 
                        step="0.1" 
                        min="1"
                        value={globalSettings.defaultOvertimeRate} 
                        onChange={e => setGlobalSettings({...globalSettings, defaultOvertimeRate: Number(e.target.value)})} 
                        className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50" 
                        placeholder="e.g. 1.5, 2.0"
                    />
                    <p className="text-[10px] text-text-muted mt-1">Calculated as: Hourly Salary × Hours × Multiplier</p>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5">Monthly Cutoff Day</label>
                    <input type="number" min="1" max="31" value={globalSettings.monthlyCutoffDay} onChange={e => setGlobalSettings({...globalSettings, monthlyCutoffDay: Number(e.target.value)})} className="w-full bg-surface-highlight border border-transparent rounded-xl p-2.5 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button onClick={handleSaveGlobal} className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20"><Save size={16}/> Save Configuration</button>
            </div>
        </Card>

        {/* Holiday Configuration */}
        <Card title="Holiday Configuration" className="md:col-span-2">
            <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-xl border border-primary/10 mb-6">
                <Calendar className="text-primary" size={24} />
                <div>
                    <h4 className="font-bold text-text-main text-sm">Weekly Off: Sunday</h4>
                    <p className="text-xs text-text-muted">All Sundays are automatically treated as unpaid holidays.</p>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Add Custom Holiday (Unpaid)</label>
                <div className="flex gap-2">
                    <input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} className="flex-1 bg-surface-highlight border border-transparent rounded-xl p-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    <button onClick={handleAddHoliday} className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-sm font-medium transition-colors">Add Date</button>
                </div>
            </div>

            <div className="bg-surface-highlight rounded-xl p-4 border border-border">
                <h5 className="text-xs font-bold text-text-muted uppercase mb-3">Custom Holidays List</h5>
                {globalSettings.customHolidays && globalSettings.customHolidays.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {globalSettings.customHolidays.sort().map(date => (
                            <div key={date} className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-lg text-sm text-text-main shadow-sm">
                                <span>{date}</span>
                                <button onClick={() => handleRemoveHoliday(date)} className="text-text-muted hover:text-danger transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-text-muted italic">No custom holidays added.</p>
                )}
            </div>
            <div className="mt-4 flex justify-end">
                <button onClick={handleSaveGlobal} className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20"><Save size={16}/> Save Holidays</button>
            </div>
        </Card>

        {/* Designations */}
        <Card title="Designations">
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    placeholder="New Designation Title" 
                    value={newDesignation} 
                    onChange={e => setNewDesignation(e.target.value)} 
                    onBlur={() => setNewDesignation(toProperCase(newDesignation))}
                    className="flex-1 bg-surface-highlight border border-transparent rounded-xl p-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />
                <button onClick={handleAddDesignation} className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-colors"><Plus size={20} /></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {designations.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-surface-highlight/50 rounded-lg">
                        <span className="text-sm font-medium text-text-main">{d.title}</span>
                        <button onClick={() => handleDeleteDesignation(d.id)} className="text-danger hover:bg-danger/10 p-1.5 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                ))}
            </div>
        </Card>

        {/* Leave Types */}
        <Card title="Leave Types">
             <div className="flex flex-col gap-3 mb-4">
                <input 
                    type="text" 
                    placeholder="Leave Name (e.g. Sick Leave)" 
                    value={newLeaveType.name} 
                    onChange={e => setNewLeaveType({...newLeaveType, name: e.target.value})} 
                    onBlur={() => setNewLeaveType({...newLeaveType, name: toProperCase(newLeaveType.name)})}
                    className="w-full bg-surface-highlight border border-transparent rounded-xl p-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                        <input type="checkbox" checked={newLeaveType.isPaid} onChange={e => setNewLeaveType({...newLeaveType, isPaid: e.target.checked})} className="rounded border-border bg-surface-highlight text-primary focus:ring-primary" />
                        Is Paid Leave?
                    </label>
                    <button onClick={handleAddLeaveType} className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"><Plus size={14} /> Add Type</button>
                </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {leaveTypes.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-3 bg-surface-highlight/50 rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-text-main block">{l.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${l.isPaid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{l.isPaid ? 'Paid' : 'Unpaid'}</span>
                        </div>
                        <button onClick={() => handleDeleteLeaveType(l.id)} className="text-danger hover:bg-danger/10 p-1.5 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                ))}
            </div>
        </Card>

      </div>
    </div>
  );
};

export default PayrollSettings;
