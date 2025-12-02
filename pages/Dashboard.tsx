import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/mockDb';
import { RevenueData } from '../types';
import { TrendingUp, Users, ShoppingBag, DollarSign, Medal } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await db.fetch(db.getRevenueData());
      setRevenueData(data);
    };
    loadData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border p-3 rounded-xl shadow-xl">
          <p className="text-text-main font-semibold mb-1">{label}</p>
          <p className="text-primary text-sm font-mono">
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-6">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Welcome/Medal Card */}
        <div className="md:col-span-4 lg:col-span-4">
           <Card className="h-full relative overflow-hidden bg-gradient-to-br from-surface to-surface-highlight border-l-4 border-l-primary group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              
              <div className="relative z-10">
                <h2 className="text-xl font-bold text-text-main mb-1">Congratulations 🎉 {user?.name.split(' ')[0]}!</h2>
                <p className="text-text-muted text-sm mb-6">You have won gold medal</p>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold text-primary">$48.9k</span>
                  <p className="text-xs text-text-muted mt-1">Total Sales</p>
                </div>
                <button className="bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/30 active:scale-95">
                  View Sales
                </button>
              </div>
              <div className="absolute right-4 top-10 z-0 opacity-100 animate-in fade-in zoom-in duration-700">
                 <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-xl border-4 border-surface ring-4 ring-yellow-500/20">
                    <Medal size={40} className="text-white drop-shadow-md" />
                 </div>
              </div>
           </Card>
        </div>

        {/* Quick Stats Grid */}
        <div className="md:col-span-8 lg:col-span-8">
          <Card title="Statistics" action={<span className="text-xs font-medium text-text-muted bg-surface-highlight px-2 py-1 rounded-md">Updated 1 month ago</span>}>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Sales */}
                <div className="flex items-center gap-4 group">
                  <div className="p-3.5 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-text-main">230k</h4>
                    <p className="text-xs font-medium text-text-muted">Sales</p>
                  </div>
                </div>

                 {/* Customers */}
                 <div className="flex items-center gap-4 group">
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    <Users size={22} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-text-main">8.5k</h4>
                    <p className="text-xs font-medium text-text-muted">Customers</p>
                  </div>
                </div>

                 {/* Products */}
                 <div className="flex items-center gap-4 group">
                  <div className="p-3.5 rounded-2xl bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-text-main">1.4k</h4>
                    <p className="text-xs font-medium text-text-muted">Products</p>
                  </div>
                </div>

                 {/* Revenue */}
                 <div className="flex items-center gap-4 group">
                  <div className="p-3.5 rounded-2xl bg-success/10 text-success group-hover:bg-success group-hover:text-white transition-all duration-300">
                    <DollarSign size={22} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-text-main">$9.7k</h4>
                    <p className="text-xs font-medium text-text-muted">Revenue</p>
                  </div>
                </div>
             </div>
          </Card>
        </div>
      </div>

      {/* Middle Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Orders Card (Vertical Bars) */}
        <Card className="lg:col-span-1" title="Orders" action={<h4 className="text-2xl font-bold text-text-main">2.76k</h4>}>
           <div className="h-[200px] w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={revenueData.slice(0, 5)}>
                 <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--bg-surface-highlight)'}} />
                 <Bar dataKey="earning" fill="#FF9F43" radius={[6, 6, 6, 6]} barSize={12} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </Card>

        {/* Profit Card (Line Chart) */}
        <Card className="lg:col-span-1" title="Profit" action={<h4 className="text-2xl font-bold text-text-main">6.24k</h4>}>
           <div className="h-[200px] w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={revenueData}>
                 <Tooltip content={<CustomTooltip />} />
                 <Line type="monotone" dataKey="earning" stroke="#00CFE8" strokeWidth={4} dot={{ r: 4, fill: 'var(--bg-surface)', strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </Card>

         {/* Earnings (Donut / Progress) */}
         <Card className="lg:col-span-1" title="Earnings">
            <div className="flex items-center justify-between mt-4">
              <div>
                 <p className="text-xs font-medium text-text-muted mb-1 bg-surface-highlight inline-block px-2 py-0.5 rounded">This Month</p>
                 <h4 className="text-2xl font-bold text-text-main mb-2">$4,055</h4>
                 <p className="text-xs text-text-muted max-w-[120px]">
                   <span className="text-success font-bold">68.2%</span> more earnings than last month.
                 </p>
              </div>
              <div className="relative h-28 w-28 flex items-center justify-center">
                 <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                    <path className="text-surface-highlight stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-success stroke-current" strokeDasharray="53, 100" strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold text-text-main">53%</span>
                 </div>
              </div>
            </div>
        </Card>
      </div>

      {/* Main Revenue Report - Large Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <Card title="Revenue Report" className="h-full">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-primary ring-2 ring-primary/20"></span>
                       <span className="text-sm font-medium text-text-muted">Earning</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-warning ring-2 ring-warning/20"></span>
                       <span className="text-sm font-medium text-text-muted">Expense</span>
                    </div>
                 </div>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" strokeOpacity={0.6} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--bg-surface-highlight)'}} />
                    <Bar dataKey="earning" fill="#5841A3" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="expense" fill="#FF9F43" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </Card>
        </div>

        <div className="lg:col-span-1">
           <Card className="h-full flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-b from-surface to-surface-highlight/30">
               <div className="absolute top-4 right-4 border border-border rounded-lg px-2.5 py-1 text-xs font-medium text-text-main bg-surface">2023</div>
               
               <div className="mt-8 mb-2 p-4 rounded-full bg-surface-highlight border border-border shadow-inner">
                  <DollarSign size={32} className="text-primary" />
               </div>

               <h3 className="text-3xl font-bold text-text-main mt-4">$25,852</h3>
               <p className="text-sm font-medium text-text-muted mb-8">Budget: $56,800</p>

               <div className="h-[140px] w-full mb-6">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                       <defs>
                          <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#5841A3" stopOpacity={0.5}/>
                             <stop offset="95%" stopColor="#5841A3" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <Area type="monotone" dataKey="earning" stroke="#5841A3" strokeWidth={3} fillOpacity={1} fill="url(#colorBudget)" />
                    </AreaChart>
                 </ResponsiveContainer>
               </div>
               
               <button className="bg-primary hover:bg-primary-light text-white w-full py-3.5 rounded-xl font-semibold shadow-lg shadow-primary/25 transition-all active:scale-95">
                  Increase Budget
               </button>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;