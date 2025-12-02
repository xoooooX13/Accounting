
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Users, Clock, Coins, CalendarDays, Briefcase, Settings as SettingsIcon } from 'lucide-react';

// Import Payroll Sub-components
import Employees from './payroll/Employees';
import Advances from './payroll/Advances';
import Leaves from './payroll/Leaves';
import Attendance from './payroll/Attendance';
import PayrollSettings from './payroll/PayrollSettings';

const Payroll = () => {
  const [activeTab, setActiveTab] = useState('employees');

  const tabs = [
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Briefcase },
    { id: 'advances', label: 'Advances', icon: Coins },
    { id: 'leaves', label: 'Leaves', icon: CalendarDays },
    { id: 'settings', label: 'Configuration', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6 pb-8">
       <h1 className="text-2xl font-bold text-text-main tracking-tight">Payroll System</h1>
       
       <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Payroll Sidebar Navigation */}
          <Card className="md:col-span-1 p-0 overflow-hidden h-fit border-border shadow-soft sticky top-24">
             <div className="flex flex-col p-2 space-y-1">
                {tabs.map(tab => (
                   <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                         activeTab === tab.id 
                         ? 'bg-primary/10 text-primary' 
                         : 'text-text-muted hover:bg-surface-highlight hover:text-text-main'
                      }`}
                   >
                      <tab.icon size={18} />
                      {tab.label}
                   </button>
                ))}
             </div>
          </Card>

          {/* Main Content Area */}
          <div className="md:col-span-3">
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                {activeTab === 'employees' && <Employees />}
                {activeTab === 'attendance' && <Attendance />}
                {activeTab === 'advances' && <Advances />}
                {activeTab === 'leaves' && <Leaves />}
                {activeTab === 'settings' && <PayrollSettings />}
             </div>
          </div>
       </div>
    </div>
  );
};

export default Payroll;
